import { AlarmClock, BellOff, Clock3, Volume2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TIMER_ALERT_LEAD_MS } from '../lib/timerAlerts';
import { timerCountdown, useTimers } from './TimerProvider';

export function AlarmTimersPanel({ onManage }: { onManage: () => void }) {
  const { t, i18n } = useTranslation();
  const { now, soundAlerts, entries, activeEntries, gartuaTimers, gartuaServer, gartuaFeedStatus } = useTimers();
  const rows = [
    ...entries.filter(entry => soundAlerts[entry.schedule.id]).map(({ schedule, next }) => {
      const active = activeEntries.find(entry => entry.schedule.id === schedule.id);
      return { id: schedule.id, name: schedule.name, target: active?.ends ?? next, status: active ? t('endsIn') : t('startsIn'), live: Boolean(active), estimated: false };
    }),
    ...gartuaTimers.filter(boss => soundAlerts[boss.id]).map(boss => {
      const available = gartuaFeedStatus === 'ready';
      const alive = available && boss.status?.st === 'up';
      const target = available && boss.status?.st === 'dead' && boss.spawnAt && boss.spawnAt > now ? boss.spawnAt : null;
      const status = !gartuaServer ? t('gartuaSelectServer') : gartuaFeedStatus === 'loading' ? t('gartuaLoading') : gartuaFeedStatus === 'error' ? t('gartuaUnavailable') : alive ? t('gartuaAlive') : target ? t('gartuaRespawnsIn') : boss.spawnAt ? t('gartuaWindowPassed') : t('gartuaNoReport');
      return { id: boss.id, name: t(boss.nameKey), target, status, live: alive, estimated: Boolean(boss.status?.est) };
    }),
  ].sort((a, b) => (a.target?.getTime() ?? Infinity) - (b.target?.getTime() ?? Infinity));

  return <section className="alarm-panel" aria-labelledby="overview-alarms-heading">
    <div className="alarm-panel-head">
      <div><h2 id="overview-alarms-heading"><Volume2 size={20} aria-hidden="true" />{t('myTimerAlerts')}</h2><span className="alarm-count">{rows.length}</span></div>
      <button type="button" className="button button-secondary" onClick={onManage}>{t('manageTimerAlerts')}</button>
    </div>
    {rows.length ? <>
      <p className="alarm-panel-note">{t('timerAlertLead', { minutes: TIMER_ALERT_LEAD_MS / 60000 })} · {t('communitySchedule')}</p>
      <div className="alarm-list">{rows.map(row => <article key={row.id} data-alarm-id={row.id} className={`alarm-timer${row.live ? ' is-live' : ''}`}>
        <div className="alarm-timer-copy"><h3><AlarmClock size={18} aria-hidden="true" />{row.name}</h3><p>{row.status}</p>{row.target && <time dateTime={row.target.toISOString()}>{row.estimated ? '≈ ' : ''}{new Intl.DateTimeFormat(i18n.resolvedLanguage, { weekday: 'short', hour: '2-digit', minute: '2-digit' }).format(row.target)}</time>}</div>
        {row.target && <strong role="timer" aria-label={`${t('timeRemaining')}: ${timerCountdown(row.target, now)}`}>{timerCountdown(row.target, now)}</strong>}
      </article>)}</div>
    </> : <div className="alarm-empty"><BellOff size={24} aria-hidden="true" /><p>{t('noTimerAlerts')}</p><span>{t('noTimerAlertsHint')}</span></div>}
    <p className="alarm-panel-footer"><Clock3 size={14} aria-hidden="true" />{t('timerAlertsAcrossPages')}</p>
  </section>;
}
