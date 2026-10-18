import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { AlarmClock, CalendarClock, Clock3, ExternalLink, Radio, ShieldAlert, Volume2, VolumeX } from 'lucide-react';
import { currentScheduleOccurrence, globalSchedules, nextScheduleOccurrence, nextWeeklyGlobalReset } from '../lib/schedule';
import { isWithinTimerAlertWindow, playTimerAlert, preloadTimerAlertAudio, TIMER_ALERT_LEAD_MS } from '../lib/timerAlerts';
import { fetchGartuaFeed, gartuaFeedServers, isSupportedGartuaServer, type GartuaFeed } from '../lib/gartuaFeed';
import { NeoSelect } from './NeoSelect';

const serverZones = [
  { value: 'Europe/Berlin', labelKey: 'timezoneEurope' },
  { value: 'America/New_York', labelKey: 'timezoneNaEast' },
  { value: 'America/Los_Angeles', labelKey: 'timezoneNaWest' },
  { value: 'America/Sao_Paulo', labelKey: 'timezoneSouthAmerica' },
  { value: 'Asia/Seoul', labelKey: 'timezoneAsia' },
];
const weekdayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const soundAlertsStorageKey = 'aion2-timer-sound-alerts';
const gartuaBosses = [
  { id: 'gartua-eternal', feedId: 'elyos24', nameKey: 'gartuaEternal', zoneKey: 'gartuaEternalZone' },
  { id: 'gartua-immortal', feedId: 'asmo24', nameKey: 'gartuaImmortal', zoneKey: 'gartuaImmortalZone' },
] as const;

function readGartuaServer(): string {
  try {
    const value = localStorage.getItem('aion2-gartua-server') ?? '';
    return isSupportedGartuaServer(value) ? value : '';
  } catch {
    return '';
  }
}

function readSoundAlerts(): Record<string, boolean> {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(soundAlertsStorageKey) ?? '{}');
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return {};
    return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, boolean] => typeof entry[1] === 'boolean'));
  } catch {
    return {};
  }
}

function scheduleDescription(schedule: (typeof globalSchedules)[number], t: TFunction): string {
  if (schedule.intervalMinute !== undefined) return t('everyHourAt', { minute: String(schedule.intervalMinute).padStart(2, '0') });
  const days = schedule.days?.length ? schedule.days.map((day) => t(weekdayKeys[day] ?? 'sunday')).join(', ') : t('dailySchedule');
  return `${days} · ${schedule.times?.join(', ') ?? ''}`;
}

function defaultZone(): string {
  const deviceZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (deviceZone === 'Europe/Madrid' || deviceZone === 'Europe/Paris') return 'Europe/Berlin';
  if (deviceZone === 'America/New_York' || deviceZone === 'America/Los_Angeles' || deviceZone === 'America/Sao_Paulo' || deviceZone === 'Asia/Seoul') return deviceZone;
  return serverZones.some((zone) => zone.value === deviceZone) ? deviceZone : 'Europe/Berlin';
}

function readZone(): string {
  const saved = localStorage.getItem('aion2-timer-server-zone');
  return serverZones.some((zone) => zone.value === saved) ? saved! : defaultZone();
}

function countdown(target: Date, now: Date): string {
  const seconds = Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000));
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return `${days ? `${days}d ` : ''}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}

export function TimersPage() {
  const { t, i18n } = useTranslation();
  const zoneOptions = serverZones.map((zone) => ({ value: zone.value, label: t(zone.labelKey) }));
  const [now, setNow] = useState(() => new Date());
  const [timeZone, setTimeZone] = useState(readZone);
  const [soundAlerts, setSoundAlerts] = useState(readSoundAlerts);
  const [gartuaServer, setGartuaServer] = useState(readGartuaServer);
  const [gartuaFeed, setGartuaFeed] = useState<GartuaFeed | null>(null);
  const [gartuaFeedStatus, setGartuaFeedStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [gartuaFeedUpdatedAt, setGartuaFeedUpdatedAt] = useState<Date | null>(null);
  const pendingAlerts = useRef(new Set<string>());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!gartuaServer) {
      setGartuaFeed(null);
      setGartuaFeedUpdatedAt(null);
      setGartuaFeedStatus('idle');
      return;
    }
    let active = true;
    let controller: AbortController | null = null;
    const update = async () => {
      controller?.abort();
      const requestController = new AbortController();
      controller = requestController;
      setGartuaFeedStatus((status) => status === 'ready' ? status : 'loading');
      try {
        const feed = await fetchGartuaFeed(gartuaServer, requestController.signal);
        if (!active) return;
        setGartuaFeed(feed);
        setGartuaFeedUpdatedAt(new Date());
        setGartuaFeedStatus('ready');
      } catch {
        if (!active || requestController.signal.aborted) return;
        setGartuaFeedStatus('error');
      }
    };
    setGartuaFeed(null);
    setGartuaFeedUpdatedAt(null);
    setGartuaFeedStatus('loading');
    void update();
    const interval = window.setInterval(() => void update(), 60_000);
    return () => {
      active = false;
      controller?.abort();
      window.clearInterval(interval);
    };
  }, [gartuaServer]);

  const entries = useMemo(() => globalSchedules.map((schedule) => ({ schedule, next: nextScheduleOccurrence(schedule, now, timeZone) })).sort((a, b) => (a.next?.getTime() ?? Infinity) - (b.next?.getTime() ?? Infinity)), [now, timeZone]);
  const activeEntries = useMemo(() => globalSchedules.flatMap((schedule) => {
    const start = currentScheduleOccurrence(schedule, now, timeZone);
    return start ? [{ schedule, start, ends: new Date(start.getTime() + (schedule.activeDurationMinute ?? 0) * 60000) }] : [];
  }).sort((a, b) => a.ends.getTime() - b.ends.getTime()), [now, timeZone]);
  const weeklyReset = useMemo(() => nextWeeklyGlobalReset(now), [now]);
  const weeklyResetLocal = new Intl.DateTimeFormat(i18n.resolvedLanguage, { dateStyle: 'full', timeStyle: 'short' }).format(weeklyReset);
  const gartuaTimers = gartuaBosses.map((boss) => {
    const status = gartuaFeed?.kills[boss.feedId];
    const spawnAt = status?.ns ? new Date(status.ns * 1000) : null;
    const aliveTimestamp = status?.us ?? status?.mu;
    const aliveSince = aliveTimestamp ? new Date(aliveTimestamp * 1000) : null;
    return { ...boss, status, spawnAt, aliveSince };
  });

  useEffect(() => {
    for (const { schedule, next } of entries) {
      if (!soundAlerts[schedule.id] || !next || !isWithinTimerAlertWindow(next, now)) continue;
      const firedKey = `aion2-timer-alert-fired:${schedule.id}`;
      const occurrence = String(next.getTime());
      const pendingKey = `${schedule.id}:${occurrence}`;
      if (localStorage.getItem(firedKey) === occurrence || pendingAlerts.current.has(pendingKey)) continue;
      pendingAlerts.current.add(pendingKey);
      void playTimerAlert().then((played) => {
        pendingAlerts.current.delete(pendingKey);
        if (played) localStorage.setItem(firedKey, occurrence);
      });
    }
  }, [entries, now, soundAlerts]);

  useEffect(() => {
    for (const boss of gartuaTimers) {
      if (!soundAlerts[boss.id] || !boss.spawnAt || !isWithinTimerAlertWindow(boss.spawnAt, now)) continue;
      const firedKey = `aion2-timer-alert-fired:${boss.id}`;
      const occurrence = String(boss.spawnAt.getTime());
      const pendingKey = `${boss.id}:${occurrence}`;
      if (localStorage.getItem(firedKey) === occurrence || pendingAlerts.current.has(pendingKey)) continue;
      pendingAlerts.current.add(pendingKey);
      void playTimerAlert().then((played) => {
        pendingAlerts.current.delete(pendingKey);
        if (played) localStorage.setItem(firedKey, occurrence);
      });
    }
  }, [gartuaFeed, now, soundAlerts]);

  function changeZone(value: string) {
    setTimeZone(value);
    localStorage.setItem('aion2-timer-server-zone', value);
  }

  function changeGartuaServer(value: string) {
    const server = isSupportedGartuaServer(value) ? value : '';
    setGartuaServer(server);
    localStorage.setItem('aion2-gartua-server', server);
  }

  function toggleSoundAlert(scheduleId: string) {
    const enabled = !soundAlerts[scheduleId];
    if (enabled) preloadTimerAlertAudio();
    const updated = { ...soundAlerts, [scheduleId]: enabled };
    setSoundAlerts(updated);
    localStorage.setItem(soundAlertsStorageKey, JSON.stringify(updated));
  }

  return <>
    <section className="hero-row timers-hero"><div><div className="eyebrow"><span className="live-dot" aria-hidden="true" />{t('timers')}</div><h1 tabIndex={-1}>{t('timersTitle')}</h1><p>{t('timersSubtitle')}</p></div><label className="server-zone-picker"><span>{t('serverTimeZone')}</span><NeoSelect ariaLabel={t('serverTimeZone')} value={timeZone} onChange={(value) => changeZone(String(value))} options={zoneOptions} /></label></section>

    <section className="weekly-reset-card">
      <div className="weekly-reset-art"><CalendarClock size={22} /></div>
      <div className="weekly-reset-info"><span className="eyebrow">{t('weeklyReset')}</span><h2 aria-label={`${t('timeRemaining')}: ${countdown(weeklyReset, now)}`}>{countdown(weeklyReset, now)}</h2><p>{t('nextResetAt')} {weeklyResetLocal} · {t('globalService')} · {t('resetBasedOnKst')}</p></div>
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
