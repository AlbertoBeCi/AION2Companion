import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Maximize2, Minimize2, Minus, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useUiStore } from '../stores/uiStore';

const edges = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'] as const;
type Edge = typeof edges[number];
type Bounds = { x: number; y: number; width: number; height: number };

export function DesktopFrame({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const page = useUiStore((state) => state.page);
  const [maximized, setMaximized] = useState(false);
  const resizing = useRef<{ edge: Edge; x: number; y: number; bounds: Bounds | null } | null>(null);
  const content = useRef<HTMLDivElement>(null);
  const desktop = window.aionDesktop!;
  const pageKey = page === 'privacy' ? 'privacyPolicy' : page === 'fan-notice' ? 'fanNotice' : page === 'about' ? 'aboutContact' : page;

  useEffect(() => { content.current?.scrollTo({ top: 0, left: 0 }); }, [page]);

  useEffect(() => {
    let active = true;
    const unsubscribe = desktop.onMainMaximized((value) => { if (active) setMaximized(value); });
    void desktop.isMainMaximized().then((value) => { if (active) setMaximized(value); });
    return () => { active = false; unsubscribe(); };
  }, [desktop]);

  function resizeTo(screenX: number, screenY: number) {
    const start = resizing.current;
    if (!start?.bounds) return;
    const bounds = { ...start.bounds };
    const dx = screenX - start.x;
    const dy = screenY - start.y;
    if (start.edge.includes('e')) bounds.width = Math.max(800, bounds.width + dx);
    if (start.edge.includes('s')) bounds.height = Math.max(600, bounds.height + dy);
    if (start.edge.includes('w')) { bounds.width = Math.max(800, start.bounds.width - dx); bounds.x = start.bounds.x + start.bounds.width - bounds.width; }
    if (start.edge.includes('n')) { bounds.height = Math.max(600, start.bounds.height - dy); bounds.y = start.bounds.y + start.bounds.height - bounds.height; }
    desktop.resizeMain(bounds);
  }

  return <div className="desktop-main-frame" data-maximized={maximized}>
    <header className="desktop-titlebar" aria-label={t('appWindowControls')} title={t('dragAppWindow')}>
      <div className="desktop-titlebar-name"><img src="/favicon.svg" width={22} height={22} alt="" /><b>AION2<span>COMPANION</span></b><span className="desktop-titlebar-page">{t(pageKey)}</span></div>
      <div className="desktop-window-controls">
        <button type="button" aria-label={t('minimizeAppWindow')} title={t('minimizeAppWindow')} onClick={() => void desktop.minimizeMain()}><Minus size={16} aria-hidden="true" /></button>
        <button type="button" aria-label={t(maximized ? 'restoreAppWindow' : 'maximizeAppWindow')} title={t(maximized ? 'restoreAppWindow' : 'maximizeAppWindow')} onClick={() => void desktop.toggleMaximizeMain()}>{maximized ? <Minimize2 size={15} aria-hidden="true" /> : <Maximize2 size={15} aria-hidden="true" />}</button>
        <button type="button" className="desktop-window-close" aria-label={t('closeAppWindow')} title={t('closeAppWindow')} onClick={() => void desktop.closeMain()}><X size={17} aria-hidden="true" /></button>
      </div>
    </header>
    <div ref={content} className="desktop-main-content">{children}</div>
    {!maximized && edges.map((edge) => <button key={edge} type="button" className={`desktop-resize-edge desktop-resize-${edge}`} tabIndex={edge === 'se' ? 0 : -1} aria-hidden={edge === 'se' ? undefined : true} aria-label={t('resizeAppWindow')}
      onPointerDown={async (event) => {
        if (event.button !== 0) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        const start = { edge, x: event.screenX, y: event.screenY, bounds: null as Bounds | null };
        resizing.current = start;
        const bounds = await desktop.getMainBounds();
        if (resizing.current === start) start.bounds = bounds;
      }}
      onPointerMove={(event) => resizeTo(event.screenX, event.screenY)}
      onPointerUp={() => { resizing.current = null; }} onLostPointerCapture={() => { resizing.current = null; }}
      onKeyDown={async (event) => {
        const delta = { ArrowRight: [20, 0], ArrowLeft: [-20, 0], ArrowDown: [0, 20], ArrowUp: [0, -20] }[event.key];
        if (edge !== 'se' || !delta) return;
        event.preventDefault();
        const bounds = await desktop.getMainBounds();
        desktop.resizeMain({ ...bounds, width: bounds.width + delta[0]!, height: bounds.height + delta[1]! });
      }} />)}
  </div>;
}
