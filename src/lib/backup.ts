import { z } from 'zod';
import { db } from '../db/database';
import type { BackupFile } from '../types/domain';
import { clearLocalSettings, exportLocalSettings, importLocalSettings } from './localSettings';

const characterSchema = z.object({ id: z.string().min(1), name: z.string().min(1).max(60), region: z.enum(['global', 'korea', 'taiwan', 'unknown']), server: z.string().max(60), className: z.string().max(40), createdAt: z.string() });
const trackerSchema = z.object({
  id: z.string().min(1), name: z.string().min(1).max(80), description: z.string().max(200), category: z.string().max(40), limit: z.number().int().min(1).max(999),
  scope: z.enum(['account', 'server', 'character']), frequency: z.enum(['none', 'daily', 'weekly']), resetTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  resetWeekday: z.number().int().min(0).max(6), resetTimeZone: z.string().optional(), region: z.enum(['global', 'korea', 'taiwan', 'unknown']), provenance: z.enum(['user-defined', 'official', 'community']), sourceId: z.string().nullable(), createdAt: z.string(), archived: z.boolean().optional(),
});
const progressSchema = z.object({ id: z.string().min(1), trackerId: z.string(), ownerKey: z.string(), periodKey: z.string(), value: z.number().int().min(0), updatedAt: z.string() });
const preferencesSchema = z.object({ id: z.literal('main'), language: z.enum(['es', 'en']), theme: z.enum(['dark', 'light']), compact: z.boolean(), trackerSeedVersion: z.number().int().optional(), trackerOrder: z.object({ daily: z.array(z.string()), weekly: z.array(z.string()) }).optional() });
const scheduledTimerSchema = z.object({ id: z.string().min(1).max(100), name: z.string().min(1).max(80), kind: z.enum(['boss', 'event']), days: z.array(z.number().int().min(0).max(6)).max(7), time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/), region: z.enum(['global', 'korea', 'taiwan', 'unknown']), createdAt: z.string() });
const weeklyResetSchema = z.object({ id: z.literal('weekly-reset'), weekday: z.number().int().min(0).max(6), time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/), region: z.enum(['global', 'korea', 'taiwan', 'unknown']) });
const localSettingsSchema = z.record(z.string().max(120), z.string().max(2048)).optional().default({});
const backupSchema = z.object({ schemaVersion: z.literal(1), exportedAt: z.string(), characters: z.array(characterSchema), trackers: z.array(trackerSchema), progress: z.array(progressSchema), preferences: preferencesSchema, scheduledTimers: z.array(scheduledTimerSchema).optional().default([]), weeklyReset: z.array(weeklyResetSchema).optional().default([]), localSettings: localSettingsSchema }).superRefine((backup, context) => {
  const trackers = new Map(backup.trackers.map((tracker) => [tracker.id, tracker]));
  backup.progress.forEach((entry, index) => {
    const tracker = trackers.get(entry.trackerId);
    if (!tracker) context.addIssue({ code: 'custom', path: ['progress', index, 'trackerId'], message: 'Unknown tracker' });
    else if (entry.value > tracker.limit) context.addIssue({ code: 'custom', path: ['progress', index, 'value'], message: 'Progress exceeds tracker limit' });
  });
});

export async function exportBackup(): Promise<BackupFile> {
  const [characters, trackers, progress, preference, scheduledTimers, weeklyReset] = await Promise.all([db.characters.toArray(), db.trackers.toArray(), db.progress.toArray(), db.preferences.get('main'), db.scheduledTimers.toArray(), db.weeklyReset.toArray()]);
  return { schemaVersion: 1, exportedAt: new Date().toISOString(), characters, trackers, progress, preferences: preference ?? { id: 'main', language: 'es', theme: 'dark', compact: false }, scheduledTimers, weeklyReset, localSettings: exportLocalSettings() };
}

export async function importBackup(file: File, mode: 'merge' | 'replace'): Promise<void> {
  if (file.size > 5 * 1024 * 1024) throw new Error('too-large');
  const parsed: unknown = JSON.parse(await file.text());
  const backup = backupSchema.parse(parsed);
  await db.transaction('rw', [db.characters, db.trackers, db.progress, db.preferences, db.scheduledTimers, db.weeklyReset], async () => {
    if (mode === 'replace') {
      await Promise.all([db.characters.clear(), db.trackers.clear(), db.progress.clear(), db.scheduledTimers.clear(), db.weeklyReset.clear()]);
    }
    await Promise.all([
      db.characters.bulkPut(backup.characters), db.trackers.bulkPut(backup.trackers), db.progress.bulkPut(backup.progress),
      db.scheduledTimers.bulkPut(backup.scheduledTimers), db.weeklyReset.bulkPut(backup.weeklyReset),
      (() => { const { trackerOrder, ...preferences } = backup.preferences; return db.preferences.put({ ...preferences, ...(trackerOrder ? { trackerOrder } : {}), trackerSeedVersion: 1 }); })(),
    ]);
  });
  if (mode === 'replace') clearLocalSettings();
  importLocalSettings(backup.localSettings);
}
