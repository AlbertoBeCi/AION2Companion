import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { currentScheduleOccurrence, globalSchedules, nextScheduleOccurrence, previousScheduleOccurrence } from '../lib/schedule';
import { fetchGartuaFeed, isSupportedGartuaServer, type GartuaFeed } from '../lib/gartuaFeed';
import { isWithinTimerAlertWindow, playTimerAlert, preloadTimerAlertAudio, TIMER_ALERT_LEAD_KEY, TIMER_ALERT_SOUND_KEY, timerAlertSounds, validAlertLeadMinutes, type TimerAlertSound } from '../lib/timerAlerts';
import { LOCAL_SETTINGS_CHANGED } from '../lib/localSettings';
import { useUiStore } from '../stores/uiStore';

export const serverZones = [
  { value: 'Europe/Berlin', labelKey: 'timezoneEurope' },
  { value: 'America/New_York', labelKey: 'timezoneNaEast' },
  { value: 'America/Los_Angeles', labelKey: 'timezoneNaWest' },
  { value: 'America/Sao_Paulo', labelKey: 'timezoneSouthAmerica' },
  { value: 'Asia/Seoul', labelKey: 'timezoneAsia' },
];
export const gartuaBosses = [
  { id: 'gartua-eternal', feedId: 'elyos24', nameKey: 'gartuaEternal', zoneKey: 'gartuaEternalZone' },
  { id: 'gartua-immortal', feedId: 'asmo24', nameKey: 'gartuaImmortal', zoneKey: 'gartuaImmortalZone' },
] as const;
const soundAlertsStorageKey = 'aion2-timer-sound-alerts';
const preferenceKeys = [soundAlertsStorageKey, 'aion2-timer-server-zone', 'aion2-gartua-server', TIMER_ALERT_LEAD_KEY, TIMER_ALERT_SOUND_KEY];

function stored(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
function remember(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* Keep the current session working without storage. */ }
}
function readGartuaServer(): string {
  const server = stored('aion2-gartua-server') ?? '';
  return isSupportedGartuaServer(server) ? server : '';
}
function readSoundAlerts(): Record<string, boolean> {
  try {
    const value: unknown = JSON.parse(stored(soundAlertsStorageKey) ?? '{}');
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return {};
    return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, boolean] => typeof entry[1] === 'boolean'));
  } catch { return {}; }
}
function readZone(): string {
  const saved = stored('aion2-timer-server-zone');
  if (serverZones.some(zone => zone.value === saved)) return saved!;
  const deviceZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return serverZones.some(zone => zone.value === deviceZone) ? deviceZone : 'Europe/Berlin';
}
function readLeadMinutes(): number {
  const value = Number(stored(TIMER_ALERT_LEAD_KEY));
  return validAlertLeadMinutes(value) ? value : 5;
}
function readAlertSound(): TimerAlertSound {
  const value = stored(TIMER_ALERT_SOUND_KEY);
  return value === 'completion' || value === 'custom' ? value : 'default';
}
export function timerCountdown(target: Date, now: Date): string {
  const seconds = Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000));
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${days ? `${days}d ` : ''}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

function useTimerEngine(playAlerts: boolean) {
  const page = useUiStore(state => state.page);
  const [now, setNow] = useState(() => new Date());
  const [timeZone, setTimeZone] = useState(readZone);
  const [soundAlerts, setSoundAlerts] = useState(readSoundAlerts);
  const [alertLeadMinutes, setAlertLeadMinutes] = useState(readLeadMinutes);
  const [alertSound, setAlertSound] = useState(readAlertSound);
  const customAudio = useLiveQuery(async () => (await db.preferences.get('main'))?.timerAlertAudio ?? null);
  const alertSoundSource = alertSound === 'custom' ? customAudio?.dataUrl ?? timerAlertSounds.default : timerAlertSounds[alertSound];
  const [gartuaServer, setGartuaServer] = useState(readGartuaServer);
  const [gartuaFeed, setGartuaFeed] = useState<GartuaFeed | null>(null);
  const [gartuaFeedStatus, setGartuaFeedStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [gartuaFeedUpdatedAt, setGartuaFeedUpdatedAt] = useState<Date | null>(null);
  const pendingAlerts = useRef(new Set<string>());
  const firedAlerts = useRef(new Map<string, string>());
  const pollGartua = Boolean(gartuaServer) && (page === 'timers' || gartuaBosses.some(boss => soundAlerts[boss.id]));

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const refresh = () => {
      setTimeZone(readZone());
      setSoundAlerts(readSoundAlerts());
      setGartuaServer(readGartuaServer());
      setAlertLeadMinutes(readLeadMinutes());
      setAlertSound(readAlertSound());
      firedAlerts.current.clear();
    };
    const onStorage = (event: StorageEvent) => { if (event.key === null || preferenceKeys.includes(event.key)) refresh(); };
    window.addEventListener(LOCAL_SETTINGS_CHANGED, refresh);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(LOCAL_SETTINGS_CHANGED, refresh);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  useEffect(() => {
    if (!pollGartua) {
      setGartuaFeed(null);
      setGartuaFeedUpdatedAt(null);
      setGartuaFeedStatus('idle');
      return;
    }
    let active = true;
    let controller: AbortController | null = null;
    const update = async () => {
      controller?.abort();
      const request = new AbortController();
      controller = request;
      setGartuaFeedStatus(status => status === 'ready' ? status : 'loading');
      try {
        const feed = await fetchGartuaFeed(gartuaServer, request.signal);
        if (!active) return;
        setGartuaFeed(feed);
        setGartuaFeedUpdatedAt(new Date());
        setGartuaFeedStatus('ready');
      } catch {
        if (active && !request.signal.aborted) setGartuaFeedStatus('error');
      }
    };
    setGartuaFeed(null);
    setGartuaFeedUpdatedAt(null);
    setGartuaFeedStatus('loading');
    void update();
    const interval = window.setInterval(() => void update(), 60_000);
    return () => { active = false; controller?.abort(); window.clearInterval(interval); };
  }, [gartuaServer, pollGartua]);

  const scheduleMinute = Math.floor(now.getTime() / 60000);
  const scheduleNow = useMemo(() => new Date(scheduleMinute * 60000), [scheduleMinute]);
  const entries = useMemo(() => globalSchedules.map(schedule => ({ schedule, next: nextScheduleOccurrence(schedule, scheduleNow, timeZone), previous: previousScheduleOccurrence(schedule, scheduleNow, timeZone) })).sort((a, b) => (a.next?.getTime() ?? Infinity) - (b.next?.getTime() ?? Infinity)), [scheduleNow, timeZone]);
  const activeEntries = useMemo(() => globalSchedules.flatMap(schedule => {
    const start = currentScheduleOccurrence(schedule, scheduleNow, timeZone);
    return start ? [{ schedule, start, ends: new Date(start.getTime() + (schedule.activeDurationMinute ?? 0) * 60000) }] : [];
  }).sort((a, b) => a.ends.getTime() - b.ends.getTime()), [scheduleNow, timeZone]);
  const gartuaTimers = useMemo(() => gartuaBosses.map(boss => {
    const status = gartuaFeed?.kills[boss.feedId];
    const aliveTimestamp = status?.us ?? status?.mu;
    return { ...boss, status, spawnAt: status?.ns ? new Date(status.ns * 1000) : null, aliveSince: aliveTimestamp ? new Date(aliveTimestamp * 1000) : null };
  }), [gartuaFeed]);

  useEffect(() => {
    if (!playAlerts) return;
    if (alertSound === 'custom' && customAudio === undefined) return;
    const candidates = [
      ...entries.map(({ schedule, next }) => ({ id: schedule.id, next })),
      ...gartuaTimers.filter(boss => boss.status?.st === 'dead' && gartuaFeedStatus === 'ready').map(boss => ({ id: boss.id, next: boss.spawnAt })),
    ];
    for (const { id, next } of candidates) {
      if (!soundAlerts[id] || !next || !isWithinTimerAlertWindow(next, now, alertLeadMinutes * 60000)) continue;
      const firedKey = `aion2-timer-alert-fired:${id}`;
      const occurrence = String(next.getTime());
      const pendingKey = `${id}:${occurrence}`;
      if (stored(firedKey) === occurrence || firedAlerts.current.get(id) === occurrence || pendingAlerts.current.has(pendingKey)) continue;
      pendingAlerts.current.add(pendingKey);
      void playTimerAlert(alertSoundSource).then(played => {
        pendingAlerts.current.delete(pendingKey);
        if (played) { firedAlerts.current.set(id, occurrence); remember(firedKey, occurrence); }
      }, () => pendingAlerts.current.delete(pendingKey));
    }
  }, [playAlerts, entries, gartuaTimers, gartuaFeedStatus, now, soundAlerts, alertLeadMinutes, alertSoundSource, alertSound, customAudio]);

  function changeZone(value: string) {
    if (!serverZones.some(zone => zone.value === value)) return;
    setTimeZone(value);
    remember('aion2-timer-server-zone', value);
  }
  function changeGartuaServer(value: string) {
    const server = isSupportedGartuaServer(value) ? value : '';
    setGartuaServer(server);
    remember('aion2-gartua-server', server);
  }
  function toggleSoundAlert(id: string) {
    const enabled = !soundAlerts[id];
    if (enabled) preloadTimerAlertAudio(alertSoundSource);
    const updated = { ...soundAlerts, [id]: enabled };
    setSoundAlerts(updated);
    remember(soundAlertsStorageKey, JSON.stringify(updated));
  }
  function changeAlertLeadMinutes(value: number) {
    if (!validAlertLeadMinutes(value)) return;
    setAlertLeadMinutes(value);
    remember(TIMER_ALERT_LEAD_KEY, String(value));
  }
  function changeAlertSound(value: TimerAlertSound) {
    setAlertSound(value);
    remember(TIMER_ALERT_SOUND_KEY, value);
  }
  return { now, timeZone, soundAlerts, alertLeadMinutes, alertSound, alertSoundSource, customAudio, gartuaServer, gartuaFeedStatus, gartuaFeedUpdatedAt, entries, activeEntries, gartuaTimers, changeZone, changeGartuaServer, toggleSoundAlert, changeAlertLeadMinutes, changeAlertSound };
}

const TimerContext = createContext<ReturnType<typeof useTimerEngine> | null>(null);
export function TimerProvider({ children, playAlerts = true }: { children: ReactNode; playAlerts?: boolean }) {
  const timers = useTimerEngine(playAlerts);
  return <TimerContext.Provider value={timers}>{children}</TimerContext.Provider>;
}
export function useTimers() {
  const timers = useContext(TimerContext);
  if (!timers) throw new Error('TimerProvider is required');
  return timers;
}
