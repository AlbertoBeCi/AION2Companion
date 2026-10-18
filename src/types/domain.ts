export type Region = 'global' | 'korea' | 'taiwan' | 'unknown';
export type ResetFrequency = 'none' | 'daily' | 'weekly';
export type TrackerScope = 'account' | 'server' | 'character';

export interface Character {
  id: string;
  name: string;
  region: Region;
  server: string;
  className: string;
  createdAt: string;
}

export interface Tracker {
  id: string;
  name: string;
  description: string;
  category: string;
  limit: number;
  scope: TrackerScope;
  frequency: ResetFrequency;
  resetTime: string;
  resetWeekday: number;
  resetTimeZone?: string | undefined;
  region: Region;
  provenance: 'user-defined' | 'official' | 'community';
  sourceId: string | null;
  createdAt: string;
  archived?: boolean | undefined;
}

export interface ProgressEntry {
  id: string;
  trackerId: string;
  ownerKey: string;
  periodKey: string;
  value: number;
  updatedAt: string;
}

export interface Preferences {
  id: 'main';
  language: 'es' | 'en';
  theme: 'dark' | 'light';
  compact: boolean;
  trackerSeedVersion?: number;
  trackerOrder?: { daily: string[]; weekly: string[] };
}

export interface ScheduledTimer {
  id: string;
  name: string;
  kind: 'boss' | 'event';
  days: number[];
  time: string;
  region: Region;
  createdAt: string;
}

export interface WeeklyResetSetting {
  id: 'weekly-reset';
  weekday: number;
  time: string;
  region: Region;
}

export interface BackupFile {
  schemaVersion: 1;
  exportedAt: string;
  characters: Character[];
  trackers: Tracker[];
  progress: ProgressEntry[];
  preferences: Preferences;
}
