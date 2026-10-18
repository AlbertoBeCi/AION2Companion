import Dexie, { type EntityTable } from 'dexie';
import type { Character, Preferences, ProgressEntry, ScheduledTimer, Tracker, WeeklyResetSetting } from '../types/domain';

class CompanionDatabase extends Dexie {
  characters!: EntityTable<Character, 'id'>;
  trackers!: EntityTable<Tracker, 'id'>;
  progress!: EntityTable<ProgressEntry, 'id'>;
  preferences!: EntityTable<Preferences, 'id'>;
  scheduledTimers!: EntityTable<ScheduledTimer, 'id'>;
  weeklyReset!: EntityTable<WeeklyResetSetting, 'id'>;

  constructor() {
    super('aion2-companion');
    this.version(1).stores({
      characters: 'id, name, region, server',
      trackers: 'id, scope, region, frequency, provenance, createdAt',
      progress: 'id, trackerId, ownerKey, periodKey',
      preferences: 'id',
    });
    this.version(2).stores({
      characters: 'id, name, region, server',
      trackers: 'id, scope, region, frequency, provenance, createdAt',
      progress: 'id, trackerId, ownerKey, periodKey',
      preferences: 'id',
      scheduledTimers: 'id, kind, region, createdAt',
      weeklyReset: 'id',
    });
  }
}

export const db = new CompanionDatabase();

function initialThemePreference(): 'dark' | 'light' {
  try {
    const saved = localStorage.getItem('aion2-theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export async function ensurePreferences(): Promise<Preferences> {
  const existing = await db.preferences.get('main');
  if (existing) return existing;
  const defaults: Preferences = { id: 'main', language: 'es', theme: initialThemePreference(), compact: false };
  await db.preferences.put(defaults);
  return defaults;
}
