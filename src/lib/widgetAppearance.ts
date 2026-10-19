import { useEffect, useState } from 'react';

export type WidgetTheme = 'companion' | 'game';
const themeKey = 'aion2-widget-theme';

function savedTheme(): WidgetTheme {
  try { return localStorage.getItem(themeKey) === 'game' ? 'game' : 'companion'; }
  catch { return 'companion'; }
}

export function useWidgetTheme() {
  const [theme, setTheme] = useState<WidgetTheme>(savedTheme);
  useEffect(() => {
    try { localStorage.setItem(themeKey, theme); } catch { /* Keep this session's theme. */ }
  }, [theme]);
  return [theme, setTheme] as const;
}
