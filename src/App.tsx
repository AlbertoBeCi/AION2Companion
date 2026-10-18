import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowDownToLine, ArrowUpFromLine, BookOpen, Check, Clock3, Coffee, Download, ExternalLink, Flame, Gauge, GripVertical, Languages, LayoutDashboard, Moon, Pencil, Plus, RotateCcw, Settings2, ShieldCheck, Sun, TimerReset, Trash2, Users, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import i18n from './i18n';
import { db, ensurePreferences } from './db/database';
import { clampProgress, nextReset, ownerKey, periodKey, progressPercent } from './lib/rules';
import { characterInputSchema, trackerInputSchema } from './lib/validation';
import { exportBackup, importBackup } from './lib/backup';
import { sourceRecords } from './lib/sources';
import { useUiStore, type Page } from './stores/uiStore';
import type { Character, Preferences, ProgressEntry, Tracker, TrackerScope, ResetFrequency, Region } from './types/domain';
import { PwaPrompt } from './components/PwaPrompt';
import { TimersPage } from './components/TimersPage';
import { AlarmTimersPanel } from './components/AlarmTimersPanel';
import { CONQUEST_TRACKER_ID, seedGlobalChecklists } from './lib/checklists';
import { globalSchedules, nextScheduleOccurrence } from './lib/schedule';
import { playCelebrationSound } from './lib/timerAlerts';
import { NeoSelect } from './components/NeoSelect';
import { LegalPage } from './components/LegalPages';
import { clearLocalSettings } from './lib/localSettings';
import { creatorSupportUrl } from './lib/siteConfig';
import { formatLocalClock } from './lib/timeDisplay';
import { trackerCopy } from './lib/trackerCopy';

const id = () => crypto.randomUUID();
const initialCharacter = { name: '', server: '', region: 'global' as Region, className: '' };
const initialTracker = { name: '', description: '', category: '', limit: 1, scope: 'character' as TrackerScope, frequency: 'none' as ResetFrequency, resetTime: '00:00', resetWeekday: 3, resetTimeZone: undefined as string | undefined, region: 'global' as Region };
const pageIcon = { dashboard: LayoutDashboard, trackers: Gauge, timers: TimerReset, characters: Users, sources: BookOpen, settings: Settings2 };
const pageTitleKey: Record<Page, string> = { dashboard: 'dashboard', trackers: 'trackers', timers: 'timers', characters: 'characters', sources: 'sources', settings: 'settings', privacy: 'privacyPolicy', 'fan-notice': 'fanNotice', about: 'aboutContact' };
const mainPages = ['dashboard', 'trackers', 'timers', 'characters', 'sources', 'settings'] as const;
const themeStorageKey = 'aion2-theme';
const legalHashPage: Record<string, Page> = { '#privacy': 'privacy', '#fan-notice': 'fan-notice', '#about': 'about' };
function applyTheme(theme: 'dark' | 'light', remember = true) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  if (remember) {
    try { localStorage.setItem(themeStorageKey, theme); } catch { /* Theme remains active for this session. */ }
  }
  document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute('content', getComputedStyle(root).getPropertyValue('--theme-color').trim());
}
function initialTheme(): 'dark' | 'light' {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}
const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const confettiPieces = Array.from({ length: 30 }, (_, index) => ({
  x: `${(index * 37 + 11) % 100}%`,
  delay: `${(index % 7) * 0.035}s`,
  rotation: `${(index * 67) % 540}deg`,
}));
const fireworkBursts = [0, 1].map((burst) => ({
  className: burst === 0 ? 'burst-left' : 'burst-right',
  delay: `${burst * 0.13}s`,
  particles: Array.from({ length: 12 }, (_, index) => ({ angle: `${index * 30}deg`, distance: `${34 + (index % 3) * 7}px` })),
}));

function useLocale() {
  const { t } = useTranslation();
  return t;
}

function App() {
  const { t } = useTranslation();
  const page = useUiStore((state) => state.page);
  const setPage = useUiStore((state) => state.setPage);
  const toast = useUiStore((state) => state.toast);
  const notify = useUiStore((state) => state.notify);
  const characters = useLiveQuery(() => db.characters.orderBy('name').toArray(), []) ?? [];
  const trackers = useLiveQuery(() => db.trackers.orderBy('createdAt').reverse().toArray(), []) ?? [];
  const progress = useLiveQuery(() => db.progress.toArray(), []) ?? [];
  const preferences = useLiveQuery(() => db.preferences.get('main'), []) ?? { id: 'main', language: 'es', theme: initialTheme(), compact: false };
  const [activeCharacter, setActiveCharacter] = useState('');
  const [modal, setModal] = useState<'character' | 'tracker' | null>(null);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [editingTracker, setEditingTracker] = useState<Tracker | null>(null);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const previousPage = useRef(page);
  const active = characters.find((character) => character.id === activeCharacter) ?? characters[0] ?? null;

  useEffect(() => {
    const syncLegalPage = () => {
      const targetPage = legalHashPage[window.location.hash];
      if (targetPage) setPage(targetPage);
    };
    syncLegalPage();
    window.addEventListener('hashchange', syncLegalPage);
    return () => window.removeEventListener('hashchange', syncLegalPage);
  }, [setPage]);

  useEffect(() => {
    let savedTheme: string | null = null;
    try { savedTheme = localStorage.getItem(themeStorageKey); } catch { /* Use the system preference when storage is unavailable. */ }
    const theme = savedTheme === 'dark' || savedTheme === 'light' ? savedTheme : initialTheme();
    applyTheme(theme, savedTheme === 'dark' || savedTheme === 'light');
    if (preferences.theme !== theme) void db.preferences.put({ ...preferences, theme });
    document.documentElement.lang = preferences.language;
    if (i18n.language !== preferences.language) void i18n.changeLanguage(preferences.language);
  }, [preferences.language, preferences.theme]);

  useEffect(() => {
    document.title = `${t(pageTitleKey[page])} · AION2Companion`;
  }, [page, preferences.language, t]);

  useEffect(() => { void seedGlobalChecklists(); }, []);

  async function savePreferences(patch: Partial<Preferences>) {
    if (patch.theme) applyTheme(patch.theme);
    const current = await ensurePreferences();
    await db.preferences.put({ ...current, ...patch });
  }

  async function changeProgress(tracker: Tracker, delta: number) {
    const selectedCharacter = active;
    const owner = ownerKey(tracker, selectedCharacter?.id ?? null, selectedCharacter?.server ?? null, selectedCharacter?.region);
    const period = periodKey(tracker.frequency, tracker.resetTime, tracker.resetWeekday, new Date(), tracker.resetTimeZone);
    const entryId = `${tracker.id}|${owner}|${period}`;
    const current = await db.progress.get(entryId);
    const value = clampProgress((current?.value ?? 0) + delta, tracker.limit);
    await db.progress.put({ id: entryId, trackerId: tracker.id, ownerKey: owner, periodKey: period, value, updatedAt: new Date().toISOString() });
  }

  async function deleteCharacter(character: Character) {
    if (!window.confirm(t('deleteWarning'))) return;
    await db.transaction('rw', db.characters, db.progress, async () => {
      await db.characters.delete(character.id);
      await db.progress.where('ownerKey').equals(`character:${character.id}`).delete();
    });
    if (activeCharacter === character.id) setActiveCharacter('');
    notify(t('saved'));
  }

  async function deleteTracker(tracker: Tracker) {
    if (!window.confirm(t('deleteWarning'))) return;
    await db.transaction('rw', db.trackers, db.progress, async () => {
      await db.trackers.delete(tracker.id);
      await db.progress.where('trackerId').equals(tracker.id).delete();
    });
    notify(t('saved'));
  }

  async function downloadBackup() {
    const data = await exportBackup();
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `aion2-companion-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    notify(t('exported'));
  }

  async function handleImport(file?: File) {
    if (!file) return;
    try {
      await importBackup(file, importMode);
      notify(t('imported'));
    } catch {
      notify(t('invalidFile'));
    }
  }

  async function clearData(which: 'trackers' | 'characters' | 'all') {
    if (!window.confirm(t('deleteWarning'))) return;
    let notification = t('saved');
    if (which === 'all') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      await db.transaction('rw', [db.characters, db.trackers, db.progress, db.preferences, db.scheduledTimers, db.weeklyReset], async () => {
        await Promise.all([db.characters.clear(), db.trackers.clear(), db.progress.clear(), db.preferences.clear(), db.scheduledTimers.clear(), db.weeklyReset.clear()]);
        await db.preferences.put({ id: 'main', language: 'es', theme: systemTheme, compact: false, trackerSeedVersion: 4 });
      });
      clearLocalSettings();
      applyTheme(systemTheme, false);
      if (i18n.resolvedLanguage !== 'es') await i18n.changeLanguage('es');
      notification = t('allDataDeleted');
    }
    if (which === 'trackers') await db.transaction('rw', db.trackers, db.progress, async () => { await Promise.all([db.trackers.clear(), db.progress.clear()]); });
    if (which === 'characters') await db.transaction('rw', db.characters, db.progress, async () => { await Promise.all([db.characters.clear(), db.progress.where('ownerKey').startsWith('character:').delete()]); });
    setActiveCharacter('');
    notify(notification);
  }

  function openCharacter(character?: Character) {
    setEditingCharacter(character ?? null);
    setModal('character');
  }
  function openTracker(tracker?: Tracker) {
    setEditingTracker(tracker ?? null);
    setModal('tracker');
  }

  const pageContent = page === 'dashboard'
    ? <Dashboard trackers={trackers} characters={characters} progress={progress} active={active} trackerOrder={preferences.trackerOrder} savePreferences={savePreferences} onProgress={changeProgress} onAddTracker={() => openTracker()} onNavigate={setPage} onSelectCharacter={setActiveCharacter} onEditTracker={openTracker} onDeleteTracker={deleteTracker} />
    : page === 'trackers'
      ? <TrackersPage trackers={trackers} characters={characters} progress={progress} active={active} onProgress={changeProgress} onAdd={() => openTracker()} onEdit={openTracker} onDelete={deleteTracker} />
      : page === 'timers'
        ? <TimersPage />
      : page === 'characters'
        ? <CharactersPage characters={characters} activeId={active?.id ?? ''} onAdd={() => openCharacter()} onEdit={openCharacter} onDelete={deleteCharacter} onSelect={setActiveCharacter} />
        : page === 'sources'
          ? <SourcesPage />
          : page === 'settings'
            ? <SettingsPage preferences={preferences} importMode={importMode} setImportMode={setImportMode} savePreferences={savePreferences} downloadBackup={downloadBackup} handleImport={handleImport} clearData={clearData} />
            : <LegalPage page={page} />;

  return <div className={`app-shell ${preferences.compact ? 'is-compact' : ''}`}>
    <a className="skip-link" href="#main-content">{t('skipToContent')}</a>
    <header className="sidebar">
      <button className="brand" onClick={() => setPage('dashboard')} aria-label={t('home')}><span className="brand-mark" aria-hidden="true">A</span><span><b>AION2</b><small>COMPANION</small></span></button>
      <div className="sidebar-caption">{t('eyebrow')}</div>
      <nav aria-label={t('mainNavigation')} className="main-nav icon-nav">
        {mainPages.map((item) => {
          const Icon = pageIcon[item];
          const activeTrackerCount = trackers.filter((tracker) => !tracker.archived).length;
          return <button key={item} type="button" title={t(pageTitleKey[item])} data-label={t(pageTitleKey[item])} aria-label={t(pageTitleKey[item])} aria-current={page === item ? 'page' : undefined} className={`nav-link icon-btn ${page === item ? 'active' : ''}`} onClick={() => setPage(item)}><Icon size={22} strokeWidth={2.5} aria-hidden="true" /><span>{t(pageTitleKey[item])}</span>{item === 'trackers' && activeTrackerCount > 0 && <span className="nav-count" aria-hidden="true">{activeTrackerCount}</span>}</button>;
        })}
      </nav>
      <div className="sidebar-spacer" />
      <div className="privacy-card"><ShieldCheck size={17} /><span>{t('localData')}</span><i /></div>
      <div className="sidebar-footer">{t('projectNotice')}</div>
      <ResetTicker trackers={trackers} language={preferences.language} />
      <div className="top-actions">
        <div className="character-select"><NeoSelect ariaLabel={t('selectCharacter')} value={active?.id ?? ''} onChange={(value) => setActiveCharacter(String(value))} leadingIcon={<Users size={15} />} options={[{ value: '', label: characters.length ? t('allCharacters') : t('localProfile') }, ...characters.map((character) => ({ value: character.id, label: `${character.name} · ${character.server || t('unknown')}` }))]} /></div>
        {creatorSupportUrl && <a className="support-nav-link" href={creatorSupportUrl} target="_blank" rel="noopener noreferrer" aria-label={t('supportCreator')} title={t('supportCreator')}><Coffee size={18} strokeWidth={2.5} aria-hidden="true" /><span>Ko-fi</span></a>}
        <button className="icon-button" title={t('language')} aria-label={`${t('language')}: ${preferences.language === 'es' ? 'English' : 'Español'}`} onClick={() => void savePreferences({ language: preferences.language === 'es' ? 'en' : 'es' })}><Languages size={17} aria-hidden="true" /><span className="lang-short">{preferences.language.toUpperCase()}</span></button>
        <button type="button" className="icon-button theme-toggle" title={t('theme')} aria-label={preferences.theme === 'dark' ? t('switchToLightMode') : t('switchToDarkMode')} aria-pressed={preferences.theme === 'dark'} onClick={() => void savePreferences({ theme: preferences.theme === 'dark' ? 'light' : 'dark' })}>{preferences.theme === 'dark' ? <Sun size={17} aria-hidden="true" /> : <Moon size={17} aria-hidden="true" />}</button>
      </div>
    </header>
    <main className="main-area" id="main-content" tabIndex={-1}>
      <div className="page-wrap"><AnimatePresence mode="wait"><motion.div id="page-content" key={page} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.16 }} onAnimationComplete={() => { if (previousPage.current !== page) { document.querySelector<HTMLElement>('#page-content h1')?.focus(); previousPage.current = page; } }}>{pageContent}</motion.div></AnimatePresence></div>
    </main>
    <nav className="mobile-nav" aria-label={t('mainNavigation')}>{mainPages.map((item) => { const Icon = pageIcon[item]; return <button type="button" key={item} aria-current={page === item ? 'page' : undefined} aria-label={t(pageTitleKey[item])} className={page === item ? 'active' : ''} onClick={() => setPage(item)}><Icon size={18} aria-hidden="true" /><small>{t(pageTitleKey[item])}</small></button>; })}{creatorSupportUrl && <a className="mobile-support-link" href={creatorSupportUrl} target="_blank" rel="noopener noreferrer" aria-label={t('supportCreator')}><Coffee size={17} strokeWidth={2.5} aria-hidden="true" /><small>Ko-fi</small></a>}</nav>
    <footer className="app-footer"><span className="footer-brand">AION2COMPANION</span><nav aria-label={t('legalNavigation')}><a href="#privacy" aria-current={page === 'privacy' ? 'page' : undefined}>{t('privacyPolicy')}</a><a href="#fan-notice" aria-current={page === 'fan-notice' ? 'page' : undefined}>{t('fanNotice')}</a><a href="#about" aria-current={page === 'about' ? 'page' : undefined}>{t('aboutContact')}</a>{creatorSupportUrl && <a href={creatorSupportUrl} target="_blank" rel="noopener noreferrer"><Coffee size={15} aria-hidden="true" />{t('supportCreator')}<ExternalLink size={12} aria-hidden="true" /></a>}</nav><small>{t('footerFanNotice')}</small></footer>
    {modal === 'character' && <CharacterDialog initial={editingCharacter} onClose={() => setModal(null)} onSaved={(character) => { if (!activeCharacter) setActiveCharacter(character.id); setModal(null); notify(t('saved')); }} />}
    {modal === 'tracker' && <TrackerDialog initial={editingTracker} onClose={() => setModal(null)} onSaved={() => { setModal(null); notify(t('saved')); }} />}
    <AnimatePresence>{toast && <motion.div className="toast" role="status" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><Check size={16} aria-hidden="true" />{toast}</motion.div>}</AnimatePresence>
    <PwaPrompt />
  </div>;
}

function ResetTicker({ trackers, language }: { trackers: Tracker[]; language: 'es' | 'en' }) {
  const t = useLocale();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const daily = trackers.find((tracker) => !tracker.archived && tracker.frequency === 'daily');
  const weekly = trackers.find((tracker) => !tracker.archived && tracker.frequency === 'weekly');
  const dailyAt = nextReset('daily', daily?.resetTime ?? '16:00', daily?.resetWeekday ?? 3, now, daily?.resetTimeZone ?? 'Asia/Seoul');
  const weeklyAt = nextReset('weekly', weekly?.resetTime ?? '16:00', weekly?.resetWeekday ?? 3, now, weekly?.resetTimeZone ?? 'Asia/Seoul');
  const dailyFrom = nextReset('daily', daily?.resetTime ?? '16:00', daily?.resetWeekday ?? 3, new Date(now.getTime() - 25 * 60 * 60 * 1000), daily?.resetTimeZone ?? 'Asia/Seoul');
  const weeklyFrom = nextReset('weekly', weekly?.resetTime ?? '16:00', weekly?.resetWeekday ?? 3, new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000), weekly?.resetTimeZone ?? 'Asia/Seoul');
  const rift = globalSchedules.find((schedule) => schedule.id === 'spacetime-rift');
  const riftZone = localStorage.getItem('aion2-timer-server-zone') || 'Europe/Berlin';
  const riftAt = rift ? nextScheduleOccurrence(rift, now, riftZone) : null;
  const riftFrom = rift ? nextScheduleOccurrence(rift, new Date(now.getTime() - 4 * 60 * 60 * 1000), riftZone) : null;
  const remainingFraction = (target: Date | null, start: Date | null) => {
    if (!target || !start) return 0;
    const duration = target.getTime() - start.getTime();
    return duration > 0 ? Math.max(0, Math.min(1, (target.getTime() - now.getTime()) / duration)) : 0;
  };
  const countdown = (date: Date | null) => {
    if (!date) return '—';
    const seconds = Math.max(0, Math.floor((date.getTime() - now.getTime()) / 1000));
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainder = seconds % 60;
    return `${days ? `${days}d ` : ''}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
  };
  const dailyLabel = t('dailyTicker');
  const weeklyLabel = t('weeklyTicker');
  const dailyLocal = dailyAt ? formatLocalClock(dailyAt, language) : null;
  const weeklyLocal = weeklyAt ? formatLocalClock(weeklyAt, language) : null;
  const riftLocal = riftAt ? formatLocalClock(riftAt, language) : null;
  const clock = new Intl.DateTimeFormat(language === 'es' ? 'es-ES' : 'en-GB', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(now);
  const timer = (kind: string, label: string, time: string, target: Date | null, start: Date | null) => {
    const progress = remainingFraction(target, start);
    const circumference = 2 * Math.PI * 12;
    const remaining = countdown(target);
    const [days, value] = remaining.includes(' ') ? remaining.split(' ') : ['', remaining];
    return <div className={`header-timer ${kind}`} key={kind} title={`${label} · ${time}`}><span className="header-timer-ring" aria-hidden="true"><svg viewBox="0 0 32 32"><circle className="header-timer-track" cx="16" cy="16" r="12" /><circle className="header-timer-progress" cx="16" cy="16" r="12" style={{ strokeDashoffset: circumference * (1 - progress) }} /></svg></span><span className="header-timer-copy"><small><span className="header-timer-name">{label}</span><span className="header-timer-schedule"> · {time}</span></small><b>{days && <><span className="header-timer-days">{days}</span>{' '}</>}<span className="header-timer-value">{value}</span></b></span></div>;
  };

  return <div className="reset-ticker" role="group" aria-label={t('clockAndTimers')}>
    <span className="game-clock"><Clock3 size={12} aria-hidden="true" />{clock}</span>
    {timer('daily', dailyLabel, dailyLocal ? `${dailyLocal.time} ${dailyLocal.zone}` : '—', dailyAt, dailyFrom)}
    {timer('weekly', weeklyLabel, weeklyLocal ? `${weeklyLocal.weekday} ${weeklyLocal.time} ${weeklyLocal.zone}` : '—', weeklyAt, weeklyFrom)}
    {timer('rift', 'Rift', riftLocal ? `${riftLocal.time} ${riftLocal.zone}` : '—', riftAt, riftFrom)}
  </div>;
}

interface DashboardProps {
  trackers: Tracker[]; characters: Character[]; progress: ProgressEntry[]; active: Character | null;
  trackerOrder?: Preferences['trackerOrder']; savePreferences: (patch: Partial<Preferences>) => Promise<void>;
  onProgress: (tracker: Tracker, delta: number) => void; onAddTracker: () => void; onNavigate: (page: Page) => void;
  onSelectCharacter: (id: string) => void; onEditTracker: (tracker: Tracker) => void; onDeleteTracker: (tracker: Tracker) => void;
}
function Dashboard({ trackers, characters, progress, active, trackerOrder, savePreferences, onProgress, onAddTracker, onNavigate, onSelectCharacter, onEditTracker, onDeleteTracker }: DashboardProps) {
  const t = useLocale();
  const sortByPreference = (items: Tracker[], order: string[] = []) => {
    const positions = new Map(order.map((trackerId, index) => [trackerId, index]));
    return [...items].sort((a, b) => (positions.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (positions.get(b.id) ?? Number.MAX_SAFE_INTEGER));
  };
  const daily = sortByPreference(trackers.filter((tracker) => !tracker.archived && tracker.frequency === 'daily'), trackerOrder?.daily);
  const weekly = sortByPreference(trackers.filter((tracker) => !tracker.archived && tracker.frequency === 'weekly'), trackerOrder?.weekly);
  const reorder = (frequency: 'daily' | 'weekly', ids: string[]) => {
    void savePreferences({ trackerOrder: { daily: trackerOrder?.daily ?? daily.map((tracker) => tracker.id), weekly: trackerOrder?.weekly ?? weekly.map((tracker) => tracker.id), [frequency]: ids } });
  };
  const timed = [...daily, ...weekly];
  const done = timed.filter((tracker) => currentValue(tracker, active, progress) >= tracker.limit).length;
  const remaining = timed.length - done;
  const dailyDone = daily.filter((tracker) => currentValue(tracker, active, progress) >= tracker.limit).length;
  const weeklyDone = weekly.filter((tracker) => currentValue(tracker, active, progress) >= tracker.limit).length;
  const percent = timed.length ? Math.round(done / timed.length * 100) : 0;
  const dailyReset = nextReset('daily', daily[0]?.resetTime ?? '16:00', daily[0]?.resetWeekday ?? 3, new Date(), daily[0]?.resetTimeZone ?? 'Asia/Seoul');
  const resetCountdown = shortCountdown(dailyReset);
  const perScope = (person: Character | null, items: Tracker[]) => {
    const complete = items.filter((tracker) => currentValue(tracker, person, progress) >= tracker.limit).length;
    return items.length ? Math.round(complete / items.length * 100) : 0;
  };
  const welcome = remaining === 0 ? t('allDone') : t('startDay');
  const overviewCircumference = 2 * Math.PI * 44;
  return <div className="companion-home">
    <section className="companion-overview" aria-label={t('summaryMetrics')}>
      <div className="overview-total"><div className="overview-ring" role="progressbar" aria-label={t('summaryMetrics')} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} aria-valuetext={`${percent}% · ${done} ${t('of')} ${timed.length}`}><svg viewBox="0 0 100 100" aria-hidden="true"><circle className="overview-ring-track" cx="50" cy="50" r="44" /><circle className="overview-ring-progress" cx="50" cy="50" r="44" style={{ strokeDashoffset: overviewCircumference * (1 - percent / 100) }} /></svg><span aria-hidden="true">{percent}%</span><small aria-hidden="true">{done}/{timed.length}</small></div><div className="overview-copy"><span>{t('totalProgress')}</span><h1 tabIndex={-1}>{welcome}</h1><p>{t('leftToDo', { count: remaining })}</p></div></div>
      <div className="overview-bars"><ProgressSummary label={t('todayShort')} value={dailyDone} total={daily.length} characters={characters} active={active} progress={progress} trackers={daily} /><ProgressSummary label={t('weekShort')} value={weeklyDone} total={weekly.length} characters={characters} active={active} progress={progress} trackers={weekly} /></div>
      <div className="overview-stats"><div><Flame size={16} /><b>{done}</b><span>{t('donePlural')}</span></div><div><Users size={16} /><b>{characters.length || '—'}</b><span>{t('characters')}</span></div><div><Clock3 size={16} /><b>{resetCountdown}</b><span>{t('dailyResetCountdown')}</span></div></div>
    </section>

    <section className="companion-character-strip" aria-label={t('characters')}>
      <div className="character-chips">{characters.length ? characters.map((character) => <button type="button" key={character.id} className={`character-chip${active?.id === character.id ? ' selected' : ''}`} aria-pressed={active?.id === character.id} onClick={() => onSelectCharacter(character.id)}><span className="character-avatar">{character.name.slice(0, 1).toUpperCase()}</span><span><b>{character.name}</b><small>{t('todayShort')} {perScope(character, daily)}% · {t('weekShort')} {perScope(character, weekly)}%</small></span><strong>{perScope(character, timed)}%</strong></button>) : <div className="character-chip selected"><span className="character-avatar">A</span><span><b>{t('localProfile')}</b><small>{t('noCharactersDesc')}</small></span><strong>{percent}%</strong></div>}</div>
      <button className="button button-secondary roster-button" onClick={() => onNavigate('characters')}><Users size={15} />{t('characters')}</button>
    </section>

    <section className="companion-lists" aria-label={t('recordProgress')}>
      <ChecklistPanel title={t('dailySection')} records={daily} active={active} progress={progress} onProgress={onProgress} onReorder={(ids) => reorder('daily', ids)} onAdd={onAddTracker} onEdit={onEditTracker} onDelete={onDeleteTracker} resetText={resetCountdown} emptyText={t('noTrackersDesc')} />
      <AlarmTimersPanel onManage={() => onNavigate('timers')} />
    </section>
  </div>;
}

function shortCountdown(target: Date | null): string {
  if (!target) return '—';
  const seconds = Math.max(0, Math.floor((target.getTime() - Date.now()) / 1000));
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${days ? `${days}d ` : ''}${hours}h ${String(minutes).padStart(2, '0')}m`;
}

function ProgressSummary({ label, value, total, characters, active, progress, trackers }: { label: string; value: number; total: number; characters: Character[]; active: Character | null; progress: ProgressEntry[]; trackers: Tracker[] }) {
  const t = useLocale();
  const pct = total ? Math.round(value / total * 100) : 0;
  const others = characters.filter((character) => character.id !== active?.id);
  const altPercent = others.length ? `${Math.round(others.reduce((sum, character) => sum + (trackers.length ? trackers.filter((tracker) => currentValue(tracker, character, progress) >= tracker.limit).length / trackers.length * 100 : 0), 0) / others.length)}%` : '—';
  const accountTrackers = trackers.filter((tracker) => tracker.scope === 'account');
  const accountPercent = accountTrackers.length ? `${Math.round(accountTrackers.filter((tracker) => currentValue(tracker, active, progress) >= tracker.limit).length / accountTrackers.length * 100)}%` : '—';
  return <div className="overview-progress-row"><div className="overview-progress-top"><b>{label}</b><strong>{value}/{total}</strong></div><div className="overview-progress-track"><span style={{ width: `${pct}%` }} /></div><div className="overview-progress-legend"><span><i className="legend-main" />{active?.name ?? t('mainCharacter')} <b>{pct}%</b></span><span><i className="legend-alt" />{t('alternateCharacters')} <b>{altPercent}</b></span><span><i className="legend-account" />{t('account')} <b>{accountPercent}</b></span></div></div>;
}

function ChecklistPanel({ title, records, active, progress, onProgress, onReorder, onAdd, onEdit, onDelete, resetText, emptyText }: { title: string; records: Tracker[]; active: Character | null; progress: ProgressEntry[]; onProgress: (tracker: Tracker, delta: number) => void; onReorder: (ids: string[]) => void; onAdd: () => void; onEdit: (tracker: Tracker) => void; onDelete: (tracker: Tracker) => void; resetText: string; emptyText: string }) {
  const t = useLocale();
  const [category, setCategory] = useState('all');
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [reorderEnabled, setReorderEnabled] = useState(false);
  const [reorderAnnouncement, setReorderAnnouncement] = useState('');
  const completed = records.filter((tracker) => currentValue(tracker, active, progress) >= tracker.limit).length;
  const filtered = category === 'all' ? records : records.filter((tracker) => tracker.category === category);
  const label = title === t('dailySection') ? 'daily' : 'weekly';
  const move = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    const ids = records.map((tracker) => tracker.id);
    const from = ids.indexOf(fromId);
    const to = ids.indexOf(toId);
    if (from < 0 || to < 0) return;
    ids.splice(from, 1);
    ids.splice(to, 0, fromId);
    onReorder(ids);
    const moved = records.find((tracker) => tracker.id === fromId);
    if (moved) setReorderAnnouncement(t('movedToPosition', { name: moved.id === CONQUEST_TRACKER_ID ? t('conquest') : moved.name, position: to + 1, total: records.length }));
  };
  const moveBy = (trackerId: string, delta: number) => {
    const index = records.findIndex((tracker) => tracker.id === trackerId);
    const target = records[index + delta];
    if (target) move(trackerId, target.id);
  };
  return <section className="checklist-panel">
    <div className="checklist-panel-head"><div><h2>{title}</h2><span className="panel-count">{completed}/{records.length}</span><span className="panel-reset"><RotateCcw size={12} aria-hidden="true" />{resetText}</span></div><div className="panel-tools"><NeoSelect className="panel-category-select" ariaLabel={t('filterCategory')} value={category} onChange={(value) => setCategory(String(value))} options={[{ value: 'all', label: t('all') }, ...[...new Set(records.map((tracker) => tracker.category))].map((item) => ({ value: item, label: trackerCopy(records.find((tracker) => tracker.category === item)!, i18n.resolvedLanguage?.startsWith('en') ? 'en' : 'es').category }))]} /><button type="button" className="reorder-toggle" aria-pressed={reorderEnabled} aria-label={t(reorderEnabled ? 'disableReordering' : 'enableReordering')} title={t(reorderEnabled ? 'disableReordering' : 'enableReordering')} onClick={() => { setReorderEnabled((enabled) => !enabled); setDraggingId(null); }}><GripVertical size={17} strokeWidth={3} aria-hidden="true" /></button><button type="button" aria-label={t(label === 'daily' ? 'resetAllDaily' : 'resetAllWeekly')} onClick={() => records.forEach((tracker) => { const value = currentValue(tracker, active, progress); if (value) onProgress(tracker, -value); })}><RotateCcw size={13} aria-hidden="true" />{t('reset')}</button><button type="button" className="complete-all" aria-label={t(label === 'daily' ? 'completeVisibleDaily' : 'completeVisibleWeekly')} onClick={() => filtered.forEach((tracker) => { const value = currentValue(tracker, active, progress); if (value < tracker.limit) onProgress(tracker, tracker.limit - value); })}><Check size={13} aria-hidden="true" />{t('complete')}</button></div></div>
    <div className="companion-list">{filtered.length ? filtered.map((tracker) => <TrackerRow key={tracker.id} tracker={tracker} value={currentValue(tracker, active, progress)} reorderEnabled={reorderEnabled} dragging={draggingId === tracker.id} onDragStart={() => setDraggingId(tracker.id)} onDragEnd={() => setDraggingId(null)} onDrop={() => { if (reorderEnabled && draggingId) move(draggingId, tracker.id); setDraggingId(null); }} onMove={(delta) => moveBy(tracker.id, delta)} onProgress={onProgress} onEdit={() => onEdit(tracker)} onDelete={() => onDelete(tracker)} />) : <div className="companion-empty">{emptyText} <button type="button" onClick={onAdd}>{t('addTracker')}</button></div>}</div>
    <span className="visually-hidden" aria-live="polite" aria-atomic="true">{reorderAnnouncement}</span>
    <button type="button" className="add-list-item" onClick={onAdd}><Plus size={14} />{t(label === 'daily' ? 'addDaily' : 'addWeekly')}</button>
  </section>;
}

function TrackerRow({ tracker, value, reorderEnabled, dragging, onDragStart, onDragEnd, onDrop, onMove, onProgress, onEdit, onDelete }: { tracker: Tracker; value: number; reorderEnabled: boolean; dragging: boolean; onDragStart: () => void; onDragEnd: () => void; onDrop: () => void; onMove: (delta: number) => void; onProgress: (tracker: Tracker, delta: number) => void; onEdit: () => void; onDelete: () => void }) {
  const t = useLocale();
  const language = i18n.resolvedLanguage?.startsWith('en') ? 'en' : 'es';
  const copy = trackerCopy(tracker, language);
  const [celebration, setCelebration] = useState(false);
  const complete = value >= tracker.limit;
  const name = tracker.id === CONQUEST_TRACKER_ID ? t('conquest') : copy.name;
  useEffect(() => {
    if (!celebration) return;
    const timer = window.setTimeout(() => setCelebration(false), 1500);
    return () => window.clearTimeout(timer);
  }, [celebration]);
  async function change(delta: number) {
    const completes = delta > 0 && value < tracker.limit && value + delta >= tracker.limit;
    if (completes) playCelebrationSound();
    await onProgress(tracker, delta);
    if (completes) setCelebration(true);
  }
  return <article className={`companion-row${reorderEnabled ? ' reorder-enabled' : ''}${complete ? ' is-complete' : ''}${celebration ? ' celebrating' : ''}${dragging ? ' is-dragging' : ''}`} draggable={reorderEnabled} onDragStart={(event) => { if (!reorderEnabled) { event.preventDefault(); return; } event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', tracker.id); onDragStart(); }} onDragOver={(event) => { if (reorderEnabled) event.preventDefault(); }} onDrop={(event) => { if (!reorderEnabled) return; event.preventDefault(); onDrop(); }} onDragEnd={onDragEnd}>
    {celebration && <div className="tracker-celebration" aria-hidden="true">{fireworkBursts.map((burst) => <span className={`firework-burst ${burst.className}`} key={burst.className}>{burst.particles.map((particle, index) => <i key={index} style={{ '--firework-angle': particle.angle, '--firework-distance': particle.distance, '--firework-delay': burst.delay } as React.CSSProperties} />)}</span>)}{confettiPieces.map((piece, index) => <i className="confetti-piece" key={index} style={{ '--confetti-x': piece.x, '--confetti-delay': piece.delay, '--confetti-rotation': piece.rotation } as React.CSSProperties} />)}</div>}
    <button type="button" className="row-check" role="checkbox" aria-checked={complete} aria-label={`${complete ? t('decrease') : t('complete')} ${name}`} onClick={() => void change(complete ? -value : tracker.limit - value)}>{complete && <Check size={15} />}</button>
    {reorderEnabled && <button type="button" className="row-drag-handle" aria-label={`${t('reorder')} ${name}`} title={`${t('reorder')} ${name}`} onKeyDown={(event) => { if (event.key === 'ArrowUp') { event.preventDefault(); onMove(-1); } else if (event.key === 'ArrowDown') { event.preventDefault(); onMove(1); } }}><GripVertical size={15} aria-hidden="true" /></button>}
    <div className="row-copy"><div className="row-title-line"><h3 title={name}>{name}</h3></div></div>
    <div className="row-progress"><div className="row-segments" role="group" aria-label={`${name}: ${value} ${t('of')} ${tracker.limit}`}>{Array.from({ length: Math.min(tracker.limit, 20) }, (_, index) => <button type="button" key={index} className={index < value ? 'filled' : ''} aria-label={`${t('setProgress')} ${name}: ${index + 1} ${t('of')} ${tracker.limit}`} aria-current={value === index + 1 ? 'step' : undefined} onClick={() => void change(index + 1 - value)} />)}</div><b aria-hidden="true">{value}/{tracker.limit}</b><button type="button" className="row-increment" aria-label={`${t('increase')} ${name}`} title={t('increase')} disabled={complete} onClick={() => void change(1)}><Plus size={18} strokeWidth={3} aria-hidden="true" /></button></div>
    <div className="row-actions"><button type="button" aria-label={`${t('reset')} ${name}`} title={t('reset')} onClick={() => value && void change(-value)}><RotateCcw size={14} /></button><button type="button" aria-label={`${t('edit')} ${name}`} title={t('edit')} onClick={onEdit}><Pencil size={14} /></button><button type="button" aria-label={`${t('delete')} ${name}`} title={t('delete')} onClick={onDelete}><Trash2 size={14} /></button></div>
  </article>;
}

function EmptyCard({ icon, title, body, action, onClick }: { icon: React.ReactNode; title: string; body: string; action: string; onClick: () => void }) {
  return <div className="empty-card"><span className="empty-icon">{icon}</span><h3>{title}</h3><p>{body}</p><button className="button button-secondary" onClick={onClick}><Plus size={16} />{action}</button></div>;
}

function currentValue(tracker: Tracker, active: Character | null, entries: ProgressEntry[]): number {
  const key = ownerKey(tracker, active?.id ?? null, active?.server ?? null, active?.region);
  if (!key) return 0;
  const period = periodKey(tracker.frequency, tracker.resetTime, tracker.resetWeekday, new Date(), tracker.resetTimeZone);
  return entries.find((entry) => entry.trackerId === tracker.id && entry.ownerKey === key && entry.periodKey === period)?.value ?? 0;
}

function TrackerCard({ tracker, value, active, onProgress, onEdit }: { tracker: Tracker; value: number; active: Character | null; onProgress: (tracker: Tracker, delta: number) => void; onEdit?: () => void }) {
  const t = useLocale();
  const language = i18n.resolvedLanguage?.startsWith('en') ? 'en' : 'es';
  const copy = trackerCopy(tracker, language);
  const [celebration, setCelebration] = useState(0);
  const displayName = tracker.id === CONQUEST_TRACKER_ID ? t('conquest') : copy.name;
  const displayDescription = tracker.id === CONQUEST_TRACKER_ID ? t('conquestDescription') : copy.description || t('noDescription');
  const percent = progressPercent(value, tracker.limit);
  const isComplete = value >= tracker.limit;
  const due = nextReset(tracker.frequency, tracker.resetTime, tracker.resetWeekday, new Date(), tracker.resetTimeZone);
  const ownerLabel = tracker.scope === 'account' ? t('scopeAccount') : tracker.scope === 'server' && active?.server ? `${t('scopeServer')} · ${active.server}` : active ? tracker.scope === 'server' ? `${t('scopeServer')} · ${t('localProfile')}` : active.name : t('localProfile');
  useEffect(() => {
    if (!celebration) return;
    const timeout = window.setTimeout(() => setCelebration(0), 1550);
    return () => window.clearTimeout(timeout);
  }, [celebration]);

  async function recordProgress(delta: number) {
    const completesTracker = delta > 0 && value < tracker.limit && value + delta >= tracker.limit;
    const saved = onProgress(tracker, delta);
    if (completesTracker) playCelebrationSound();
    await saved;
    if (completesTracker) setCelebration((current) => current + 1);
  }

  return <article className={`tracker-card${isComplete ? ' is-complete' : ''}`}>
    {celebration > 0 && <div className="tracker-celebration" key={celebration} aria-hidden="true">
      {fireworkBursts.map((burst) => <span className={`firework-burst ${burst.className}`} key={burst.className}>{burst.particles.map((particle, index) => <i key={index} style={{ '--firework-angle': particle.angle, '--firework-distance': particle.distance, '--firework-delay': burst.delay } as React.CSSProperties} />)}</span>)}
      {confettiPieces.map((piece, index) => <i className="confetti-piece" key={index} style={{ '--confetti-x': piece.x, '--confetti-delay': piece.delay, '--confetti-rotation': piece.rotation } as React.CSSProperties} />)}
    </div>}
    <div className="tracker-card-head"><div className="tracker-glyph"><Gauge size={16} /></div><span className="scope-badge">{tracker.frequency === 'none' ? t('noReset') : tracker.frequency === 'daily' ? t('dailyReset') : t('weeklyReset')}</span>{onEdit && <button className="micro-action" aria-label={`${t('edit')} ${displayName}`} onClick={onEdit}>···</button>}</div>
    <h3>{displayName}</h3><p className="tracker-desc">{displayDescription}</p>
    <div className="tracker-meta"><span>{copy.category}</span><span>{ownerLabel}</span><span className={`user-made ${tracker.provenance === 'community' ? 'community-made' : ''}`}>{tracker.provenance === 'community' ? t('statusCommunity') : t('userDefined')}</span></div>
    <div className="progress-label"><strong>{value}<span> / {tracker.limit}</span></strong><small>{percent}%</small></div>
    <div className={`progress-track${isComplete ? ' is-complete' : ''}`} role="progressbar" aria-label={displayName} aria-valuemin={0} aria-valuemax={tracker.limit} aria-valuenow={value} aria-valuetext={`${value} ${t('of')} ${tracker.limit}`}><span aria-hidden="true" style={{ width: `${percent}%` }} /></div>
    <div className="tracker-card-foot"><small>{due ? `${t(tracker.resetTimeZone ? 'nextGlobalReset' : 'nextReset')}: ${new Intl.DateTimeFormat(language === 'es' ? 'es-ES' : 'en-GB', { dateStyle: 'short', timeStyle: 'short' }).format(due)}` : t('notGameSync')}</small><div className="stepper"><button type="button" aria-label={`${t('decrease')} ${displayName}`} disabled={value <= 0} onClick={() => void recordProgress(-1)}>−</button><button type="button" aria-label={`${t('increase')} ${displayName}`} disabled={value >= tracker.limit} onClick={() => void recordProgress(1)}>+</button></div></div>
  </article>;
}

interface TrackersPageProps { trackers: Tracker[]; characters: Character[]; progress: ProgressEntry[]; active: Character | null; onProgress: (tracker: Tracker, delta: number) => void; onAdd: () => void; onEdit: (tracker: Tracker) => void; onDelete: (tracker: Tracker) => void; }
function TrackersPage({ trackers, characters, progress, active, onProgress, onAdd, onEdit, onDelete }: TrackersPageProps) {
  const t = useLocale();
  const language = i18n.resolvedLanguage?.startsWith('en') ? 'en' : 'es';
  const [section, setSection] = useState<ResetFrequency | 'archived'>('daily');
  const [category, setCategory] = useState('all');
  const activeTrackers = trackers.filter((item) => !item.archived);
  const archivedTrackers = trackers.filter((item) => item.archived);
  const sections: Array<{ id: ResetFrequency | 'archived'; title: string }> = [{ id: 'daily', title: t('dailySection') }, { id: 'weekly', title: t('weeklySection') }];
  if (activeTrackers.some((item) => item.frequency === 'none')) sections.push({ id: 'none', title: t('otherTrackers') });
  if (archivedTrackers.length) sections.push({ id: 'archived', title: t('archived') });
  useEffect(() => {
    if (!sections.some((item) => item.id === section)) {
      setSection('daily');
      setCategory('all');
    }
  }, [trackers, section]);
  const sectionTrackers = section === 'archived' ? archivedTrackers : activeTrackers.filter((item) => item.frequency === section);
  const categories = useMemo(() => [...new Set(sectionTrackers.map((item) => item.category))], [sectionTrackers]);
  const filtered = category === 'all' ? sectionTrackers : sectionTrackers.filter((item) => item.category === category);
  const sectionDone = sectionTrackers.filter((tracker) => currentValue(tracker, active, progress) >= tracker.limit).length;
  return <>
    <PageHeading eyebrow={t('recordProgress')} title={t('trackers')} action={t('addTracker')} onAction={onAdd} />
    <div className="checklist-intro"><div><ShieldCheck size={17} /><span>{t('checklistSourceNotice')}</span></div><a href="https://aion2data.com/checklist" target="_blank" rel="noreferrer">{t('checklistSource')} ↗</a></div>
    {activeTrackers.length > 0 && characters.length === 0 && <p className="inline-note checklist-character-note">{t('addCharacterToTrack')}</p>}
    <div className="checklist-tabs" role="tablist" aria-label={t('trackers')} onKeyDown={(event) => {
      const currentIndex = sections.findIndex((item) => item.id === section);
      let nextIndex = currentIndex;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (currentIndex + 1) % sections.length;
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (currentIndex + sections.length - 1) % sections.length;
      else if (event.key === 'Home') nextIndex = 0;
      else if (event.key === 'End') nextIndex = sections.length - 1;
      else return;
      event.preventDefault();
      const nextSection = sections[nextIndex]!;
      setSection(nextSection.id);
      setCategory('all');
      document.getElementById(`trackers-tab-${nextSection.id}`)?.focus();
    }}>
      {sections.map((item) => { const count = item.id === 'archived' ? archivedTrackers.length : activeTrackers.filter((tracker) => tracker.frequency === item.id).length; return <button id={`trackers-tab-${item.id}`} type="button" role="tab" aria-controls={`trackers-panel-${item.id}`} aria-selected={section === item.id} tabIndex={section === item.id ? 0 : -1} className={section === item.id ? 'selected' : ''} onClick={() => { setSection(item.id); setCategory('all'); }} key={item.id}><span>{item.title}</span><small aria-hidden="true">{count}</small><span className="sr-only">{count} {t('trackers').toLocaleLowerCase()}</span></button>; })}
    </div>
    <p className="checklist-summary" role="status">{sectionDone}/{sectionTrackers.length} {t('trackersCompleted')}</p>
    <div id={`trackers-panel-${section}`} role="tabpanel" aria-labelledby={`trackers-tab-${section}`} tabIndex={0}>
      <h2 className="sr-only">{sections.find((item) => item.id === section)?.title ?? t('dailySection')}</h2>
      <div className="filters-row" role="group" aria-label={t('filterCategory')}><span className="filter-label">{t('filterCategory')}</span><button type="button" aria-pressed={category === 'all'} className={`filter-chip ${category === 'all' ? 'selected' : ''}`} onClick={() => setCategory('all')}>{t('all')}</button>{categories.map((item) => <button type="button" key={item} aria-pressed={category === item} className={`filter-chip ${category === item ? 'selected' : ''}`} onClick={() => setCategory(item)}>{trackerCopy(sectionTrackers.find((tracker) => tracker.category === item)!, language).category}</button>)}<span className="filter-count" aria-live="polite">{filtered.length} / {sectionTrackers.length}</span></div>
      {filtered.length ? section === 'archived' ? <div className="tracker-grid">{filtered.map((tracker) => { const copy = trackerCopy(tracker, language); return <article className="tracker-card archived-tracker" key={tracker.id}><span className="scope-badge">{t('archived')}</span><h3>{copy.name}</h3><p className="tracker-desc">{copy.description}</p><div className="tracker-actions"><button type="button" onClick={() => { void db.trackers.put({ ...tracker, archived: false }); }}>{t('restore')}</button><button type="button" onClick={() => onEdit(tracker)}>{t('edit')}</button><button type="button" className="danger-text icon-only" aria-label={`${t('delete')} ${copy.name}`} title={t('delete')} onClick={() => onDelete(tracker)}><Trash2 size={13} aria-hidden="true" /></button></div></article>; })}</div> : <div className="tracker-grid">{filtered.map((tracker) => <div className="tracker-wrap" key={tracker.id}><TrackerCard tracker={tracker} value={currentValue(tracker, active, progress)} active={active} onProgress={onProgress} onEdit={() => onEdit(tracker)} /><div className="tracker-actions"><button type="button" onClick={() => onEdit(tracker)}>{t('edit')}</button><button type="button" className="danger-text icon-only" aria-label={`${t('delete')} ${trackerCopy(tracker, language).name}`} title={t('delete')} onClick={() => onDelete(tracker)}><Trash2 size={13} aria-hidden="true" /></button></div></div>)}</div> : <EmptyCard icon={<Gauge size={21} />} title={t('noTrackers')} body={section === 'none' ? t('noUnresetTrackers') : t('noTrackersDesc')} action={t('addTracker')} onClick={onAdd} />}
    </div>
    {sections.filter((item) => item.id !== section).map((item) => <div key={item.id} id={`trackers-panel-${item.id}`} role="tabpanel" aria-labelledby={`trackers-tab-${item.id}`} hidden />)}
  </>;
}

function PageHeading({ eyebrow, title, action, onAction }: { eyebrow: string; title: string; action?: string; onAction?: () => void }) {
  return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1 tabIndex={-1}>{title}</h1></div>{action && onAction && <button className="button button-primary" onClick={onAction}><Plus size={17} aria-hidden="true" />{action}</button>}</div>;
}

function CharactersPage({ characters, activeId, onAdd, onEdit, onDelete, onSelect }: { characters: Character[]; activeId: string; onAdd: () => void; onEdit: (character: Character) => void; onDelete: (character: Character) => void; onSelect: (id: string) => void }) {
  const t = useLocale();
  return <>
    <PageHeading eyebrow={t('recordProgress')} title={t('characters')} action={t('addCharacter')} onAction={onAdd} />
    {!characters.length ? <EmptyCard icon={<Users size={21} />} title={t('noCharacters')} body={t('noCharactersDesc')} action={t('addCharacter')} onClick={onAdd} /> : <div className="character-grid">{characters.map((character) => <article key={character.id} className={`character-card ${activeId === character.id ? 'chosen' : ''}`}><div className="character-top"><div className="avatar-mark">{character.name.slice(0, 1).toUpperCase()}</div><button className="micro-action" aria-label={`${t('edit')} ${character.name}`} onClick={() => onEdit(character)}>···</button></div><h3>{character.name}</h3><p>{character.className || t('classPlaceholder')}</p><div className="character-tags"><span>{regionName(character.region, t)}</span><span>{character.server || t('unknown')}</span></div><div className="character-card-actions"><button className="button button-secondary" onClick={() => onSelect(character.id)}>{activeId === character.id ? <><Check size={15} />{t('selectedCharacter')}</> : t('selectCharacter')}</button><button className="icon-button danger" aria-label={`${t('delete')} ${character.name}`} onClick={() => onDelete(character)}><Trash2 size={15} /></button></div></article>)}</div>}
  </>;
}

function SourcesPage() {
  const t = useLocale();
  return <>
    <PageHeading eyebrow={t('officialOnly')} title={t('sourceTitle')} />
    <div className="notice-card"><div className="notice-icon"><ShieldCheck size={20} /></div><div><h2>{t('noOfficialRules')}</h2><p>{t('noOfficialRulesDesc')}</p></div><span className="pending-pill">{t('pending')}</span></div>
    <div className="sources-heading"><h2>{t('sources')}</h2><span>{sourceRecords.filter((source) => source.type === 'official').length} {t('official').toLocaleLowerCase()} · {sourceRecords.filter((source) => source.type === 'community').length} {t('community').toLocaleLowerCase()}</span></div>
    <div className="source-list">{sourceRecords.map((source) => { const english = i18n.resolvedLanguage?.startsWith('en'); const title = english ? source.titleEn : source.title; return <article className="source-item" key={source.id}><span className={`source-kind ${source.type}`}>{source.type === 'official' ? 'NC' : t('community').toLocaleUpperCase()}</span><div className="source-copy"><div className="source-title-line"><h3>{title}</h3><span className={`source-status ${source.status}`}>{source.status === 'official-publication' ? t('statusOfficial') : source.status === 'internal-undocumented' ? t('statusInternal') : t('statusCommunity')}</span></div><p>{english ? source.noteEn : source.note}</p><small>{t('region')}: {english ? source.regionEn : source.region} · {t('scope')}: {english ? source.scopeEn : source.scope}</small><small className="source-validity">{t('validity')}: {english ? source.validityEn : source.validity} · {t('reviewed')} {source.reviewed}</small></div><a className="icon-button" href={source.url} target="_blank" rel="noreferrer" aria-label={`${t('open')} ${title}`}>↗</a></article>; })}</div>
    <div className="footnote-card"><Clock3 size={17} /><p><b>{t('noRulesTitle')}.</b> {t('nextReset')}. {t('configuredResetFootnote')}</p></div>
  </>;
}

function SettingsPage({ preferences, importMode, setImportMode, savePreferences, downloadBackup, handleImport, clearData }: { preferences: Preferences; importMode: 'merge' | 'replace'; setImportMode: (mode: 'merge' | 'replace') => void; savePreferences: (patch: Partial<Preferences>) => Promise<void>; downloadBackup: () => void; handleImport: (file?: File) => void; clearData: (which: 'trackers' | 'characters' | 'all') => void }) {
  const t = useLocale();
  return <>
    <PageHeading eyebrow={t('localData')} title={t('settings')} />
    <section className="settings-card"><div className="settings-title"><div className="settings-icon"><Settings2 size={18} /></div><div><h2>{t('settings')}</h2><p>{t('localDataDesc')}</p></div></div>
      <div className="setting-row"><div><b>{t('language')}</b><small>Español / English</small></div><NeoSelect ariaLabel={t('language')} value={preferences.language} onChange={(value) => void savePreferences({ language: String(value) as 'es' | 'en' })} options={[{ value: 'es', label: 'Español' }, { value: 'en', label: 'English' }]} /></div>
      <div className="setting-row"><div><b>{t('theme')}</b><small>{preferences.theme === 'dark' ? t('dark') : t('light')}</small></div><NeoSelect ariaLabel={t('theme')} value={preferences.theme} onChange={(value) => void savePreferences({ theme: String(value) as 'dark' | 'light' })} options={[{ value: 'dark', label: t('dark') }, { value: 'light', label: t('light') }]} /></div>
      <div className="setting-row"><div><b>{t('compact')}</b><small>{t('subtitle')}</small></div><button className={`switch ${preferences.compact ? 'on' : ''}`} role="switch" aria-checked={preferences.compact} aria-label={t('compact')} onClick={() => void savePreferences({ compact: !preferences.compact })}><span /></button></div>
    </section>
    <section className="settings-card"><div className="settings-title"><div className="settings-icon blue"><ArrowDownToLine size={18} /></div><div><h2>{t('localData')}</h2><p>{t('localDataDesc')}</p></div></div><div className="setting-row"><div><b>{t('export')}</b><small>JSON · schema 1</small></div><button className="button button-secondary" onClick={() => void downloadBackup()}><Download size={15} />{t('export')}</button></div>
      <div className="setting-row"><div><b>{t('import')}</b><small>{t('importMode')}</small></div><NeoSelect ariaLabel={t('importMode')} value={importMode} onChange={(value) => setImportMode(String(value) as 'merge' | 'replace')} options={[{ value: 'merge', label: t('merge') }, { value: 'replace', label: t('replace') }]} /></div>
      <div className="setting-row"><div><b>{t('chooseFile')}</b><small>{t('maxFile')}</small></div><label className="button button-secondary file-button"><ArrowUpFromLine size={15} />{t('import')}<input type="file" accept="application/json,.json" onChange={(event) => { void handleImport(event.target.files?.[0]); event.target.value = ''; }} /></label></div>
    </section>
    <section className="settings-card"><div className="settings-title"><div className="settings-icon danger-bg"><Trash2 size={17} /></div><div><h2>{t('resetData')}</h2><p>{t('deleteWarning')}</p></div></div><div className="danger-actions"><button onClick={() => void clearData('trackers')}>{t('resetTrackers')}</button><button onClick={() => void clearData('characters')}>{t('resetCharacters')}</button><button onClick={() => void clearData('all')}><Trash2 size={14} />{t('resetAll')}</button></div></section>
  </>;
}

function CharacterDialog({ initial, onClose, onSaved }: { initial: Character | null; onClose: () => void; onSaved: (character: Character) => void }) {
  const t = useLocale();
  const [form, setForm] = useState(initial ? { name: initial.name, server: initial.server, region: initial.region, className: initial.className } : initialCharacter);
  const [error, setError] = useState('');
  async function submit(event: FormEvent) {
    event.preventDefault();
    const result = characterInputSchema.safeParse(form);
    if (!result.success) { setError(t('characterError')); return; }
    const character: Character = { ...result.data, id: initial?.id ?? id(), createdAt: initial?.createdAt ?? new Date().toISOString() };
    await db.characters.put(character);
    onSaved(character);
  }
  const set = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  return <Modal title={initial ? t('edit') : t('addCharacter')} onClose={onClose}><form onSubmit={(event) => void submit(event)} className="form-grid">
    <label className="field full"><span>{t('name')} *</span><input autoFocus maxLength={60} value={form.name} onChange={(event) => set('name', event.target.value)} required /></label>
    <label className="field"><span>{t('region')}</span><NeoSelect value={form.region} onChange={(value) => set('region', String(value))} options={[{ value: 'global', label: t('global') }, { value: 'korea', label: t('korea') }, { value: 'taiwan', label: t('taiwan') }, { value: 'unknown', label: t('unknown') }]} /></label>
    <label className="field"><span>{t('server')}</span><input maxLength={60} value={form.server} onChange={(event) => set('server', event.target.value)} /></label>
    <label className="field full"><span>{t('className')}</span><input maxLength={40} placeholder={t('classPlaceholder')} value={form.className} onChange={(event) => set('className', event.target.value)} /></label>
    {error && <p className="form-error full" role="alert">{error}</p>}<div className="form-actions full"><button type="button" className="button button-quiet" onClick={onClose}>{t('cancel')}</button><button className="button button-primary" type="submit"><Check size={15} />{t('save')}</button></div>
  </form></Modal>;
}

function TrackerDialog({ initial, onClose, onSaved }: { initial: Tracker | null; onClose: () => void; onSaved: () => void }) {
  const t = useLocale();
  const [form, setForm] = useState(initial ? { name: initial.name, description: initial.description, category: initial.category, limit: initial.limit, scope: initial.scope, frequency: initial.frequency, resetTime: initial.resetTime, resetWeekday: initial.resetWeekday, resetTimeZone: initial.resetTimeZone, region: initial.region } : initialTracker);
  const [error, setError] = useState('');
  async function submit(event: FormEvent) {
    event.preventDefault();
    const result = trackerInputSchema.safeParse(form);
    if (!result.success) { setError(t('trackerError')); return; }
    const tracker: Tracker = { ...result.data, id: initial?.id ?? id(), provenance: initial?.provenance ?? 'user-defined', sourceId: initial?.sourceId ?? null, createdAt: initial?.createdAt ?? new Date().toISOString() };
    await db.trackers.put(tracker);
    onSaved();
  }
  const set = (key: keyof typeof form, value: string | number) => setForm((current) => ({ ...current, [key]: value }));
  return <Modal title={initial ? t('edit') : t('addTracker')} onClose={onClose}><form onSubmit={(event) => void submit(event)} className="form-grid">
    <label className="field full"><span>{t('name')} *</span><input autoFocus maxLength={80} value={form.name} onChange={(event) => set('name', event.target.value)} required /></label>
    <label className="field full"><span>{t('description')}</span><input maxLength={200} value={form.description} onChange={(event) => set('description', event.target.value)} /></label>
    <label className="field"><span>{t('category')}</span><input maxLength={40} placeholder={t('categoryPlaceholder')} value={form.category} onChange={(event) => set('category', event.target.value)} required /></label>
    <label className="field"><span>{t('limit')}</span><input type="number" min={1} max={999} value={form.limit} onChange={(event) => set('limit', Number(event.target.value))} required /></label>
    <label className="field"><span>{t('scope')}</span><NeoSelect value={form.scope} onChange={(value) => set('scope', String(value))} options={[{ value: 'character', label: t('scopeCharacter') }, { value: 'server', label: t('scopeServer') }, { value: 'account', label: t('scopeAccount') }]} /></label>
    <label className="field"><span>{t('region')}</span><NeoSelect value={form.region} onChange={(value) => set('region', String(value))} options={[{ value: 'global', label: t('global') }, { value: 'korea', label: t('korea') }, { value: 'taiwan', label: t('taiwan') }, { value: 'unknown', label: t('unknown') }]} /></label>
    <label className="field full"><span>{t('reset')}</span><NeoSelect value={form.frequency} onChange={(value) => set('frequency', String(value))} options={[{ value: 'none', label: t('noReset') }, { value: 'daily', label: t('dailyReset') }, { value: 'weekly', label: t('weeklyReset') }]} /></label>
    {form.frequency !== 'none' && <><label className="field"><span>{t('resetTime')}</span><input type="time" value={form.resetTime} onChange={(event) => set('resetTime', event.target.value)} /></label>{form.frequency === 'weekly' && <label className="field"><span>{t('resetDay')}</span><NeoSelect value={form.resetWeekday} onChange={(value) => set('resetWeekday', Number(value))} options={weekdays.map((day, i) => ({ value: i, label: t(day) }))} /></label>}<p className="field-help full">{t('trackerResetDisclaimer')}</p></>}
    {error && <p className="form-error full" role="alert">{error}</p>}<div className="form-actions full"><button type="button" className="button button-quiet" onClick={onClose}>{t('cancel')}</button><button className="button button-primary" type="submit"><Check size={15} />{t('save')}</button></div>
  </form></Modal>;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const t = useLocale();
  const modalRef = useRef<HTMLElement | null>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = modalRef.current;
    const focusable = () => [...(dialog?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])') ?? [])].filter((item) => item.getAttribute('aria-hidden') !== 'true' && item.offsetParent !== null);
    if (dialog && !dialog.contains(document.activeElement)) (focusable()[0] ?? dialog).focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { closeRef.current(); return; }
      if (event.key !== 'Tab' || !dialog) return;
      const items = focusable();
      if (!items.length) { event.preventDefault(); dialog.focus(); return; }
      const first = items[0]!;
      const last = items.at(-1)!;
      if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); previousFocus?.focus(); };
  }, []);
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><motion.section ref={modalRef} tabIndex={-1} className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}><div className="modal-head"><div><div className="eyebrow">AION2Companion</div><h2 id="modal-title">{title}</h2></div><button type="button" className="icon-button" aria-label={t('close')} onClick={onClose}><X size={18} aria-hidden="true" /></button></div>{children}</motion.section></div>;
}

function regionName(region: Region, t: ReturnType<typeof useLocale>): string { return t(region); }

export default App;
