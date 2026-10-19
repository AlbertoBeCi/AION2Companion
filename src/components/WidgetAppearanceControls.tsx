import { useEffect, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { WidgetTheme } from '../lib/widgetAppearance';

const opacityKey = 'aion2-desktop-widget-opacity';

function savedOpacity() {
  try {
    const value = Number(localStorage.getItem(opacityKey));
    return Number.isFinite(value) && value >= 25 && value <= 100 ? value : 100;
  } catch { return 100; }
}

export function WidgetAppearanceControls({ theme, onThemeChange }: { theme: WidgetTheme; onThemeChange: (theme: WidgetTheme) => void }) {
  const { t } = useTranslation();
  const [opacity, setOpacity] = useState(savedOpacity);
  useEffect(() => {
    window.aionDesktop?.setDailyOpacity(opacity / 100);
    try { localStorage.setItem(opacityKey, String(opacity)); } catch { /* Keep this session's opacity. */ }
  }, [opacity]);
  return <details className="widget-appearance">
    <summary className="icon-button" aria-label={t('widgetAppearance')} title={t('widgetAppearance')}><SlidersHorizontal size={16} aria-hidden="true" /></summary>
    <div className="widget-appearance-panel">
      <label><span>{t('widgetTheme')}</span><select value={theme} onChange={(event) => onThemeChange(event.target.value as WidgetTheme)}><option value="companion">{t('widgetThemeCompanion')}</option><option value="game">{t('widgetThemeGame')}</option></select></label>
      {window.aionDesktop && <><label><span>{t('widgetOpacity')} <output>{opacity}%</output></span><input type="range" aria-label={t('widgetOpacity')} min={25} max={100} step={5} value={opacity} onChange={(event) => setOpacity(Number(event.target.value))} /></label>
      <button type="button" onClick={() => setOpacity(100)}>{t('restoreWidgetOpacity')}</button></>}
    </div>
  </details>;
}
