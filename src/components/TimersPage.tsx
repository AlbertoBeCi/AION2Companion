import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { AlarmClock, CalendarClock, Clock3, ExternalLink, Radio, ShieldAlert, Volume2, VolumeX } from 'lucide-react';
import { globalSchedules, nextWeeklyGlobalReset } from '../lib/schedule';
import { TIMER_ALERT_LEAD_MS } from '../lib/timerAlerts';
import { gartuaFeedServers } from '../lib/gartuaFeed';
import { NeoSelect } from './NeoSelect';
import { serverZones, useTimers, timerCountdown as countdown } from './TimerProvider';

const weekdayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
function scheduleDescription(schedule: (typeof globalSchedules)[number], t: TFunction): string {
  if (schedule.intervalMinute !== undefined) return t('everyHourAt', { minute: String(schedule.intervalMinute).padStart(2, '0') });
  const days = schedule.days?.length ? schedule.days.map((day) => t(weekdayKeys[day] ?? 'sunday')).join(', ') : t('dailySchedule');
  return `${days} · ${schedule.times?.join(', ') ?? ''}`;
}

export function TimersPage() {
  const { t, i18n } = useTranslation();
  const { now, timeZone, soundAlerts, gartuaServer, gartuaFeedStatus, gartuaFeedUpdatedAt, entries, activeEntries, gartuaTimers, changeZone, changeGartuaServer, toggleSoundAlert } = useTimers();
  const zoneOptions = serverZones.map(zone => ({ value: zone.value, label: t(zone.labelKey) }));
  const weeklyReset = useMemo(() => nextWeeklyGlobalReset(now), [now]);
  const weeklyResetLocal = new Intl.DateTimeFormat(i18n.resolvedLanguage, { dateStyle: 'full', timeStyle: 'short' }).format(weeklyReset);
  return <>
    <section className="hero-row timers-hero"><div><div className="eyebrow"><span className="live-dot" aria-hidden="true" />{t('timers')}</div><h1 tabIndex={-1}>{t('timersTitle')}</h1><p>{t('timersSubtitle')}</p></div><label className="server-zone-picker"><span>{t('serverTimeZone')}</span><NeoSelect ariaLabel={t('serverTimeZone')} value={timeZone} onChange={(value) => changeZone(String(value))} options={zoneOptions} /></label></section>

    <section className="weekly-reset-card">
      <div className="weekly-reset-art"><CalendarClock size={22} /></div>
      <div className="weekly-reset-info"><span className="eyebrow">{t('weeklyReset')}</span><h2 aria-label={`${t('timeRemaining')}: ${countdown(weeklyReset, now)}`}>{countdown(weeklyReset, now)}</h2><p>{t('nextResetAt')} {weeklyResetLocal} · {t('globalService')}</p></div>
      <div className="reset-source-tag"><span className="source-dot community-dot" />{t('communitySchedule')}</div>
    </section>

    <section className="timer-list-panel gartua-feed-panel content-section" aria-labelledby="gartua-feed-heading">
      <div className="section-heading gartua-feed-heading">
        <div><div className="eyebrow"><Radio size={13} aria-hidden="true" />{t('gartuaReportSource')}</div><h2 id="gartua-feed-heading">{t('gartuaTitle')}</h2><p>{t('gartuaDescription')}</p></div>
        <label className="server-zone-picker"><span>{t('gartuaServer')}</span><NeoSelect ariaLabel={t('gartuaServer')} value={gartuaServer} onChange={(value) => changeGartuaServer(String(value))} options={[{ value: '', label: t('chooseGartuaServer') }, ...gartuaFeedServers.flatMap((region) => { const group = region.region === 'Europe' ? 'chooseRegionEurope' : region.region === 'North America East' ? 'chooseRegionNaEast' : region.region === 'North America West' ? 'chooseRegionNaWest' : 'chooseRegionSouthAmerica'; return region.servers.map((server) => ({ value: server.id, label: server.name, group: t(group) })); })]} /></label>
      </div>
      {!gartuaServer ? <p className="gartua-feed-note">{t('gartuaSelectServer')}</p> : gartuaFeedStatus === 'loading' ? <p className="gartua-feed-note" role="status">{t('gartuaLoading')}</p> : gartuaFeedStatus === 'error' ? <p className="gartua-feed-note is-error" role="status">{t('gartuaUnavailable')}</p> : <div className="schedule-list">{gartuaTimers.map((boss) => {
        const isAlive = boss.status?.st === 'up';
        const isDeadWithTimer = boss.status?.st === 'dead' && boss.spawnAt;
        const estimateMark = boss.status?.est ? '≈ ' : '';
        const serverLabel = gartuaFeedServers.flatMap((region) => region.servers).find((server) => server.id === gartuaServer)?.name;
        return <article className={`schedule-card gartua-feed-row${isAlive ? ' is-live' : ''}`} key={boss.id}>
          <div className={`schedule-glyph boss${isAlive ? ' is-live' : ''}`}><AlarmClock size={17} aria-hidden="true" /></div>
          <div className="schedule-main"><div className="schedule-title"><h3>{t(boss.nameKey)}</h3><span className="schedule-kind boss">{t('boss')}</span>{isAlive && <span className="live-status"><span className="live-status-dot" aria-hidden="true" />{t('gartuaAlive')}</span>}</div><p>{t(boss.zoneKey)}{serverLabel ? ` · ${serverLabel}` : ''}</p>
            {gartuaFeedUpdatedAt && <small>{t('gartuaUpdated')}: {new Intl.DateTimeFormat(i18n.resolvedLanguage, { timeStyle: 'short', timeZone }).format(gartuaFeedUpdatedAt)}</small>}
            {!boss.status ? <small>{t('gartuaNoReport')}</small> : isAlive ? <small>{boss.aliveSince ? `${t('gartuaAliveSince')} ${new Intl.DateTimeFormat(i18n.resolvedLanguage, { dateStyle: 'short', timeStyle: 'short', timeZone }).format(boss.aliveSince)}` : t('gartuaAlive')}{boss.status.est ? ` · ${t('gartuaEstimated')}` : ''}</small> : isDeadWithTimer ? <small>{estimateMark}{t('gartuaExpectedAt')}: {new Intl.DateTimeFormat(i18n.resolvedLanguage, { dateStyle: 'short', timeStyle: 'short', timeZone }).format(boss.spawnAt!)}{boss.status?.est ? ` · ${t('gartuaEstimated')}` : ''}</small> : <small>{t('gartuaNoReport')}</small>}
          </div>
          <div className="schedule-right gartua-feed-right">{isDeadWithTimer && <><button type="button" className={`sound-alert-switch${soundAlerts[boss.id] ? ' is-enabled' : ''}`} role="switch" aria-checked={Boolean(soundAlerts[boss.id])} aria-label={t('soundAlertFor', { name: t(boss.nameKey), minutes: TIMER_ALERT_LEAD_MS / 60000 })} title={t('soundAlertTooltip', { minutes: TIMER_ALERT_LEAD_MS / 60000 })} onClick={() => toggleSoundAlert(boss.id)}>{soundAlerts[boss.id] ? <Volume2 size={15} aria-hidden="true" /> : <VolumeX size={15} aria-hidden="true" />}<span>{TIMER_ALERT_LEAD_MS / 60000} min</span></button><strong aria-label={`${t('timeRemaining')}: ${countdown(boss.spawnAt!, now)}`}>{countdown(boss.spawnAt!, now)}</strong><span className="schedule-live-caption">{boss.spawnAt!.getTime() <= now.getTime() ? t('gartuaWindowPassed') : t('gartuaRespawnsIn')}</span></>}</div>
        </article>;
      })}</div>}
      <p className="gartua-source-note">{t('gartuaSourceNote')} <a href="https://www.aion2timers.com/world-boss-timer/" target="_blank" rel="noreferrer">{t('gartuaReportSource')} <ExternalLink size={12} aria-hidden="true" /></a></p>
    </section>

    <section className="timer-list-panel live-schedules-panel content-section" aria-labelledby="live-schedules-heading">
      <div className="section-heading"><div><div className="eyebrow"><Radio size={13} />{t('liveNow')}</div><h2 id="live-schedules-heading">{t('activeSchedules')}</h2></div><span className="filter-count">{activeEntries.length} {t('activeLabel')}</span></div>
      {activeEntries.length ? <div className="schedule-list">{activeEntries.map(({ schedule, ends }) => (
        <article className="schedule-card is-live" key={schedule.id}>
          <div className={`schedule-glyph ${schedule.kind}`}><AlarmClock size={17} /></div>
          <div className="schedule-main"><div className="schedule-title"><h3>{schedule.name}</h3><span className={`schedule-kind ${schedule.kind}`}>{schedule.kind === 'boss' ? t('boss') : t('event')}</span><span className="live-status"><span className="live-status-dot" aria-hidden="true" />{t('inProgress')}</span></div><p>{t('startedAt')} {new Intl.DateTimeFormat(i18n.resolvedLanguage, { timeStyle: 'short', timeZone }).format(ends.getTime() - (schedule.activeDurationMinute ?? 0) * 60000)} · {t('serverTime')}</p></div>
          <div className="schedule-right" role="group" aria-label={`${t('endsIn')}: ${countdown(ends, now)}`}><strong aria-hidden="true">{countdown(ends, now)}</strong><span className="schedule-live-caption" aria-hidden="true">{t('endsIn')}</span></div>
        </article>
      ))}</div> : <p className="no-live-schedules">{t('noActiveSchedules')}</p>}
    </section>

    <section className="timer-list-panel content-section">
      <div className="section-heading"><div><div className="eyebrow"><Clock3 size={13} />{t('communitySchedule')}</div><h2>{t('upcomingSchedules')}</h2></div><span className="filter-count">{entries.length} {t('globalService')}</span></div>
      <p className="sound-alert-help">{t('soundAlertNotice', { minutes: TIMER_ALERT_LEAD_MS / 60000 })}</p>
      <div className="schedule-list">{entries.map(({ schedule, next }) => (
        <article className="schedule-card" key={schedule.id}>
          <div className={`schedule-glyph ${schedule.kind}`}><AlarmClock size={17} /></div>
          <div className="schedule-main"><div className="schedule-title"><h3>{schedule.name}</h3><span className={`schedule-kind ${schedule.kind}`}>{schedule.kind === 'boss' ? t('boss') : t('event')}</span></div><p>{scheduleDescription(schedule, t)} · {t('serverTime')}</p><small>{t('nextOccurrence')}: {new Intl.DateTimeFormat(i18n.resolvedLanguage, { dateStyle: 'medium', timeStyle: 'short', timeZone }).format(next ?? now)}</small></div>
          <div className="schedule-right"><button type="button" className={`sound-alert-switch${soundAlerts[schedule.id] ? ' is-enabled' : ''}`} role="switch" aria-checked={Boolean(soundAlerts[schedule.id])} aria-label={t('soundAlertFor', { name: schedule.name, minutes: TIMER_ALERT_LEAD_MS / 60000 })} title={t('soundAlertTooltip', { minutes: TIMER_ALERT_LEAD_MS / 60000 })} onClick={() => toggleSoundAlert(schedule.id)}>{soundAlerts[schedule.id] ? <Volume2 size={15} aria-hidden="true" /> : <VolumeX size={15} aria-hidden="true" />}<span>{TIMER_ALERT_LEAD_MS / 60000} min</span></button><strong aria-label={`${t('timeRemaining')}: ${next ? countdown(next, now) : '—'}`}>{next ? countdown(next, now) : '—'}</strong></div>
        </article>
      ))}</div>
    </section>

    <div className="footnote-card timer-provenance"><ShieldAlert size={17} /><p><b>{t('scheduleProvenanceTitle')}</b> {t('scheduleProvenanceBody')} <a href="https://shugo.gg/timers" target="_blank" rel="noreferrer">Shugo.gg / Timers <ExternalLink size={11} /></a></p></div>
    <div className="timer-source-line"><span className="source-dot community-dot" />{t('communitySchedule')} · {t('reviewed')} 2026-10-09 · {t('globalService')}</div>
  </>;
}
