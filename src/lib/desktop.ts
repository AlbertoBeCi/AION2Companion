import { useEffect, useState } from 'react';

export const isDesktopWidget = Boolean(window.aionDesktop?.isWidget);
const activeCharacterKey = 'aion2-desktop-active-character';

function savedCharacter() {
  try { return window.aionDesktop ? localStorage.getItem(activeCharacterKey) ?? '' : ''; } catch { return ''; }
}

export function useActiveCharacter() {
  const [active, setActive] = useState(savedCharacter);
  useEffect(() => {
    if (!window.aionDesktop) return;
    const sync = (event: StorageEvent) => {
      if (event.key === activeCharacterKey || event.key === null) setActive(savedCharacter());
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  const select = (value: string) => {
    setActive(value);
    if (window.aionDesktop) {
      try { localStorage.setItem(activeCharacterKey, value); } catch { /* Keep the selection in this window. */ }
    }
  };
  return [active, select] as const;
}
