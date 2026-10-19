import { useEffect, useRef, useState } from 'react';

type PictureInPictureWindow = Window & {
  documentPictureInPicture?: {
    requestWindow: (options: { width: number; height: number; disallowReturnToOpener: boolean }) => Promise<Window>;
  };
};

export function useDailyOverlay(onError: (reason: 'unsupported' | 'failed') => void) {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const [opening, setOpening] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(false);
  const overlay = useRef<Window | null>(null);
  const pending = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    const desktop = window.aionDesktop;
    if (!desktop) return;
    let alive = true;
    const unsubscribe = desktop.onDailyChanged((open) => { if (alive) setDesktopOpen(open); });
    void desktop.isDailyOpen().then((open) => { if (alive) setDesktopOpen(open); });
    return () => { alive = false; unsubscribe(); };
  }, []);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      overlay.current?.close();
    };
  }, []);

  async function open() {
    if (window.aionDesktop) {
      if (pending.current) return;
      pending.current = true;
      setOpening(true);
      try { await window.aionDesktop.openDaily(); }
      catch { onError('failed'); }
      finally { pending.current = false; if (mounted.current) setOpening(false); }
      return;
    }
    if (overlay.current && !overlay.current.closed) {
      overlay.current.focus();
      return;
    }
    if (pending.current) return;
    const api = (window as PictureInPictureWindow).documentPictureInPicture;
    if (!api) {
      onError('unsupported');
      return;
    }
    pending.current = true;
    setOpening(true);
    let floating: Window | null = null;
    try {
      // Keep this call in the button's user gesture: the browser requires it.
      floating = await api.requestWindow({ width: 440, height: 560, disallowReturnToOpener: true });
      if (!mounted.current) { floating.close(); return; }
      const target = floating.document;
      const base = target.createElement('base');
      base.href = document.baseURI;
      target.head.append(base);
      for (const sheet of document.styleSheets) {
        try {
          const style = target.createElement('style');
          style.textContent = [...sheet.cssRules].map((rule) => rule.cssText).join('\n');
          target.head.append(style);
        } catch {
          if (sheet.href) {
            const link = target.createElement('link');
            link.rel = 'stylesheet';
            link.href = sheet.href;
            target.head.append(link);
          }
        }
      }
      const syncAppearance = () => {
        target.documentElement.dataset.theme = document.documentElement.dataset.theme;
        target.documentElement.lang = document.documentElement.lang;
        target.documentElement.style.colorScheme = document.documentElement.style.colorScheme;
      };
      syncAppearance();
      target.documentElement.classList.add('daily-overlay-root');
      const observer = new MutationObserver(syncAppearance);
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'lang', 'style'] });
      target.body.className = 'daily-overlay-body';
      const root = target.createElement('div');
      target.body.append(root);
      overlay.current = floating;
      floating.addEventListener('pagehide', () => {
        observer.disconnect();
        overlay.current = null;
        if (mounted.current) setContainer(null);
      }, { once: true });
      setContainer(root);
    } catch {
      floating?.close();
      if (mounted.current) onError('failed');
    } finally {
      pending.current = false;
      if (mounted.current) setOpening(false);
    }
  }

  return { container, opening, open, isOpen: desktopOpen || !!container,
    close: () => { if (window.aionDesktop) void window.aionDesktop.closeDaily(); else overlay.current?.close(); } };
}
