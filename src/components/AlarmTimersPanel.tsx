import type { ReactNode } from 'react';
import { AlarmClock, BellOff, Clock3, PictureInPicture2, Volume2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { timerCountdown, useTimers } from './TimerProvider';
import { useAlarmOverlay } from './useAlarmOverlay';
import { timerElapsedPercent } from '../lib/timerProgress';

export function AlarmTimersPanel({ onManage, floating = false, headerAction }: { onManage?: () => void; floating?: boolean; headerAction?: ReactNode }) {
  const { t, i18n } = useTranslation();
  const { now, soundAlerts, alertLeadMinutes, entries, activeEntries, gartuaTimers, gartuaServer, gartuaFeedStatus } = useTimers();
  const overlay = useAlarmOverlay();
  const rows = [
    ...entries.filter(entry => soundAlerts[entry.schedule.id]).map(({ schedule, next, previous }) => {
      const active = activeEntries.find(entry => entry.schedule.id === schedule.id);
      const start = active?.start ?? (previous ? new Date(previous.getTime() + (schedule.activeDurationMinute ?? 0) * 60000) : null);
      return { id: schedule.id, name: schedule.name, start, target: active?.ends ?? next, status: active ? t('endsIn') : t('startsIn'), live: Boolean(active), estimated: false };
    }),
    ...gartuaTimers.filter(boss => soundAlerts[boss.id]).map(boss => {
      const available = gartuaFeedStatus === 'ready';
      const alive = available && boss.status?.st === 'up';
      const target = available && boss.status?.st === 'dead' && boss.spawnAt && boss.spawnAt > now ? boss.spawnAt : null;
      const status = !gartuaServer ? t('gartuaSelectServer') : gartuaFeedStatus === 'loading' ? t('gartuaLoading') : gartuaFeedStatus === 'error' ? t('gartuaUnavailable') : alive ? t('gartuaAlive') : target ? t('gartuaRespawnsIn') : boss.spawnAt ? t('gartuaWindowPassed') : t('gartuaNoReport');
      return { id: boss.id, name: t(boss.nameKey), start: target ? new Date(target.getTime() - alertLeadMinutes * 60000) : null, target, status, live: alive, estimated: Boolean(boss.status?.est) };
    }),
  ].sort((a, b) => (a.target?.getTime() ?? Infinity) - (b.target?.getTime() ?? Infinity))
    .map(row => ({ ...row, elapsed: timerElapsedPercent(row.start, row.target, now) }));

  return <section className="alarm-panel" aria-labelledby="overview-alarms-heading">
    <header className={`alarm-panel-head${floating ? ' daily-overlay-header' : ''}`} title={floating ? t('dragAlarmsWidget') : undefined}>
      <div><h2 id="overview-alarms-heading">{floating ? <AlarmClock size={20} aria-hidden="true" /> : <Volume2 size={20} aria-hidden="true" />}{t('myTimerAlerts')}</h2>{!floating && <span className="alarm-count">{rows.length}</span>}</div>
      {floating ? headerAction : <div className="alarm-panel-actions">
        {window.aionDesktop && <button type="button" className="button button-secondary" onClick={() => void overlay.open()} disabled={overlay.opening}><PictureInPicture2 size={16} aria-hidden="true" />{t(overlay.isOpen ? 'focusAlarmsOverlay' : 'openAlarmsOverlay')}</button>}
        <button type="button" className="button button-secondary" onClick={onManage}>{t('manageTimerAlerts')}</button>
      </div>}
    </header>
    {!floating && overlay.failed && <p role="status">{t('alarmsOverlayFailed')}</p>}
    {rows.length ? <>
      <p className="alarm-panel-note">{t('timerAlertLead', { minutes: alertLeadMinutes })} · {t('communitySchedule')}</p>
      <div className="alarm-list">{rows.map(row => <article key={row.id} data-alarm-id={row.id} className={`alarm-timer${row.live ? ' is-live' : ''}`}>
        <div className="alarm-timer-copy"><h3>{!floating && <AlarmClock size={18} aria-hidden="true" />}{row.name}</h3><p>{row.status}</p>{row.target && <time dateTime={row.target.toISOString()}>{row.estimated ? '≈ ' : ''}{new Intl.DateTimeFormat(i18n.resolvedLanguage, { weekday: 'short', hour: '2-digit', minute: '2-digit' }).format(row.target)}</time>}</div>
        {row.target && <strong role="timer" aria-label={`${t('timeRemaining')}: ${timerCountdown(row.target, now)}`}>{timerCountdown(row.target, now)}</strong>}
        {floating && row.elapsed !== null && <div className="alarm-timer-progress daily-hud-progress" role="progressbar" aria-label={`${row.name} · ${t('timerElapsed')}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(row.elapsed)}><span style={{ width: `${row.elapsed}%` }} /></div>}
      </article>)}</div>
    </> : <div className="alarm-empty"><BellOff size={24} aria-hidden="true" /><p>{t('noTimerAlerts')}</p><span>{t('noTimerAlertsHint')}</span></div>}
    <p className="alarm-panel-footer"><Clock3 size={14} aria-hidden="true" />{t('timerAlertsAcrossPages')}</p>
  </section>;
}
