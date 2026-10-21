import { ExternalLink, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AlarmTimersPanel } from './AlarmTimersPanel';
import { WidgetAppearanceControls } from './WidgetAppearanceControls';
import { WidgetResizeHandle } from './WidgetResizeHandle';
import { useWidgetTheme } from '../lib/widgetAppearance';

export function AlarmOverlay() {
  const { t } = useTranslation();
  const [theme, setTheme] = useWidgetTheme('alarms');
  const desktop = window.aionDesktop!;
  return <main className="daily-overlay alarm-overlay" data-widget-theme={theme}>
    <AlarmTimersPanel floating headerAction={<div className="daily-overlay-controls">
      <WidgetAppearanceControls widget="alarms" theme={theme} onThemeChange={setTheme} />
      <button type="button" className="icon-button" aria-label={t('showDesktopApp')} title={t('showDesktopApp')} onClick={() => void desktop.showMain()}><ExternalLink size={16} aria-hidden="true" /></button>
      <button type="button" className="icon-button" aria-label={t('closeAlarmsOverlay')} title={t('closeAlarmsOverlay')} onClick={() => void desktop.closeAlarms()}><X size={18} aria-hidden="true" /></button>
    </div>} />
    <WidgetResizeHandle label={t('resizeAlarmsWidget')} onResize={desktop.resizeAlarms} />
  </main>;
}
