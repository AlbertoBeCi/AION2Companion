import { useRegisterSW } from 'virtual:pwa-register/react';
import { Check, RefreshCw, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function PwaPrompt() {
  const { t } = useTranslation();
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!offlineReady && !needRefresh) return null;
  return <section className="pwa-prompt" aria-label={t('appUpdate')}>
    {offlineReady ? <Check size={16} aria-hidden="true" /> : <RefreshCw size={16} aria-hidden="true" />}
    <span role="status" aria-live="polite">{offlineReady ? t('offlineReady') : t('updateReady')}</span>
    {needRefresh && <button type="button" className="button button-primary" onClick={() => void updateServiceWorker(true)}>{t('update')}</button>}
    <button type="button" className="icon-button" aria-label={t('dismiss')} onClick={() => { setOfflineReady(false); setNeedRefresh(false); }}><X size={15} aria-hidden="true" /></button>
  </section>;
}
