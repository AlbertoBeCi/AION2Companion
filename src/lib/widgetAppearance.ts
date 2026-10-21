import { useEffect, useState } from 'react';

export type WidgetTheme = 'companion' | 'game';
const themeKey = 'aion2-widget-theme';

function savedTheme(key: string): WidgetTheme {
  try { return localStorage.getItem(key) === 'game' ? 'game' : 'companion'; }
  catch { return 'companion'; }
}

export function useWidgetTheme(widget: 'daily' | 'alarms' = 'daily') {
  const key = widget === 'alarms' ? 'aion2-alarms-widget-theme' : themeKey;
  const [theme, setTheme] = useState<WidgetTheme>(() => savedTheme(key));
  useEffect(() => {
    try { localStorage.setItem(key, theme); } catch { /* Keep this session's theme. */ }
  }, [key, theme]);
  return [theme, setTheme] as const;
}
