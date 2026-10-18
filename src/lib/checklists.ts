import { db } from '../db/database';
import type { Region, ResetFrequency, Tracker, TrackerScope } from '../types/domain';

const DATA_SOURCE = 'aion2data-global-client-25800038-2026-10-09';
const REVIEWED_AT = '2026-10-16';
export const CONQUEST_TRACKER_ID = 'community-global-checklist-v1-daily-4';
type Seed = { name: string; description: string; category: string; limit: number; scope?: TrackerScope; frequency: ResetFrequency; legacyIndex?: number; };

const dailySeeds: Seed[] = [
  { name: 'Misiones de Duty', description: 'Objetivo diario: 5 misiones. Registra el progreso manualmente.', category: 'Misiones', limit: 5, scope: 'server', frequency: 'daily', legacyIndex: 1 },
  { name: 'Nightmare', description: 'Objetivo diario: 2 intentos. Registra el progreso manualmente.', category: 'Nightmare', limit: 2, frequency: 'daily', legacyIndex: 3 },
  { name: 'Conquest', description: 'Contador general de seguimiento diario. Objetivo: 2; algunas modalidades del juego pueden mantener cargas separadas.', category: 'Conquest', limit: 2, frequency: 'daily', legacyIndex: 4 },
  { name: 'Mazmorras', description: 'Marca una vez al día cuando hayas hecho tus mazmorras. Este contador es una casilla de seguimiento, no un límite del juego.', category: 'Mazmorras', limit: 1, frequency: 'daily', legacyIndex: 16 },
  { name: 'Llaves Shugo', description: 'Objetivo diario: 3 llaves. Registra el progreso manualmente.', category: 'Eventos', limit: 3, scope: 'server', frequency: 'daily', legacyIndex: 12 },
  { name: 'Llave de invasión Dimensional', description: 'Objetivo diario: 1 llave. Registra el progreso manualmente.', category: 'Eventos', limit: 1, scope: 'server', frequency: 'daily', legacyIndex: 14 },
];

const weeklySeeds: Seed[] = [
  { name: 'Unknown Fissure: Daily Dungeon', description: '14 entradas por semana. La asignación semanal se comparte con los otros Daily Dungeons; nivel 30+.', category: 'Daily Dungeon', limit: 14, frequency: 'weekly' },
  { name: 'Ascension Trial', description: '3 entradas semanales compartidas entre las pruebas disponibles. Nivel 45+.', category: 'Pruebas', limit: 3, frequency: 'weekly' },
  { name: 'Subjugation', description: '3 entradas semanales compartidas entre las cuatro mazmorras de Subjugation. Nivel 45+.', category: 'Subjugation', limit: 3, frequency: 'weekly' },
  { name: 'Abyssal Forge: intentos', description: 'Hasta 4 intentos semanales; el botín de jefe final tiene su propio límite. Nivel 45+.', category: 'Sanctuary', limit: 4, frequency: 'weekly' },
  { name: 'Chalice of Muspel: intentos', description: 'Hasta 4 intentos semanales. Comprueba el límite de recompensas de jefe final en el juego. Nivel 45+.', category: 'Sanctuary', limit: 4, frequency: 'weekly' },
  { name: 'Corroded Decontamination Facility: intentos', description: 'Hasta 4 intentos semanales. Comprueba el límite de recompensas de jefe final en el juego. Nivel 45+.', category: 'Sanctuary', limit: 4, frequency: 'weekly' },
  { name: 'Krao Cave: Exploration', description: '7 reclamaciones semanales. Se desbloquea al nivel 20.', category: 'Exploration', limit: 7, frequency: 'weekly' },
  { name: 'Urugugu Canyon: Exploration', description: '7 reclamaciones semanales. Se desbloquea al nivel 28.', category: 'Exploration', limit: 7, frequency: 'weekly' },
  { name: 'Fire Temple: Exploration', description: '7 reclamaciones semanales. Se desbloquea al nivel 35.', category: 'Exploration', limit: 7, frequency: 'weekly' },
  { name: 'Draupnir: Exploration', description: '7 reclamaciones semanales. Se desbloquea al nivel 45.', category: 'Exploration', limit: 7, frequency: 'weekly' },
  { name: 'Vakron Sky Island: Exploration', description: '7 reclamaciones semanales. Se desbloquea al nivel 45.', category: 'Exploration', limit: 7, frequency: 'weekly' },
  { name: 'Ferocious Horn Den: Exploration', description: '7 reclamaciones semanales. Se desbloquea al nivel 45.', category: 'Exploration', limit: 7, frequency: 'weekly' },
  { name: 'Lower Abyss: horas de acceso', description: 'Hasta 7 horas semanales de acceso; registra las horas aproximadas manualmente. Nivel 45+.', category: 'Abyss', limit: 7, frequency: 'weekly' },
  { name: 'Middle Abyss: horas de acceso', description: 'Hasta 7 horas semanales de acceso; registra las horas aproximadas manualmente. Nivel 45+.', category: 'Abyss', limit: 7, frequency: 'weekly' },
  { name: 'Upper Abyss: horas de acceso', description: 'Hasta 7 horas semanales de acceso; registra las horas aproximadas manualmente. Nivel 45+.', category: 'Abyss', limit: 7, frequency: 'weekly' },
];

function makeTracker(seed: Seed, index: number): Tracker {
  const legacyIndex = seed.legacyIndex ?? index + 1;
  const id = seed.frequency === 'daily' && seed.name === 'Conquest' ? CONQUEST_TRACKER_ID : `community-global-checklist-v1-${seed.frequency}-${legacyIndex}`;
  return {
    name: seed.name,
    description: seed.description,
    category: seed.category,
    limit: seed.limit,
    frequency: seed.frequency,
    id,
    scope: seed.scope ?? 'character',
    resetTime: '16:00',
    resetWeekday: 3,
    resetTimeZone: 'Asia/Seoul',
    region: 'global' as Region,
    provenance: 'community',
    sourceId: DATA_SOURCE,
    createdAt: `${REVIEWED_AT}T00:00:00.000Z`,
  };
}

export const recommendedGlobalChecklists: Tracker[] = [
  ...dailySeeds.map((seed, index) => makeTracker(seed, index)),
  ...weeklySeeds.map((seed, index) => makeTracker(seed, index)),
];

export async function seedGlobalChecklists(): Promise<void> {
  await db.transaction('rw', db.trackers, db.progress, db.preferences, async () => {
    const preferences = await db.preferences.get('main');
    const version = preferences?.trackerSeedVersion ?? 0;
    if (version >= 4) return;

    if (version === 0) {
      await db.trackers.bulkPut(recommendedGlobalChecklists);
    } else if (version === 1) {
      const conquestTracker = recommendedGlobalChecklists.find((tracker) => tracker.id === CONQUEST_TRACKER_ID)!;
      const oldIds = Array.from({ length: 6 }, (_, index) => `community-global-checklist-v1-daily-${index + 4}`);
      const oldEntries = await db.progress.where('trackerId').anyOf(oldIds).toArray();
      const progressByPeriod = new Map<string, { ownerKey: string; periodKey: string; value: number; updatedAt: string }>();
      for (const entry of oldEntries) {
        const key = JSON.stringify([entry.ownerKey, entry.periodKey]);
        const current = progressByPeriod.get(key);
        progressByPeriod.set(key, {
          ownerKey: entry.ownerKey,
          periodKey: entry.periodKey,
          value: (current?.value ?? 0) + entry.value,
          updatedAt: current && current.updatedAt > entry.updatedAt ? current.updatedAt : entry.updatedAt,
        });
      }

      const oldTrackers = await db.trackers.bulkGet(oldIds);
      const obsoleteIds = oldIds.slice(1).filter((_, index) => oldTrackers[index + 1]?.sourceId === DATA_SOURCE && oldTrackers[index + 1]?.provenance === 'community');
      await db.progress.where('trackerId').anyOf(oldIds).delete();
      if (obsoleteIds.length) await db.trackers.bulkDelete(obsoleteIds);
      await db.trackers.put(conquestTracker);
      const migratedProgress = [...progressByPeriod.values()].map((entry) => ({
        id: `${conquestTracker.id}|${entry.ownerKey}|${entry.periodKey}`,
        trackerId: conquestTracker.id,
        ownerKey: entry.ownerKey,
        periodKey: entry.periodKey,
        value: Math.min(conquestTracker.limit, entry.value),
        updatedAt: entry.updatedAt,
      }));
      if (migratedProgress.length) await db.progress.bulkPut(migratedProgress);
    }

    // Update the requested daily defaults for existing installations while keeping
    // their progress and any user-created trackers intact.
    for (const tracker of recommendedGlobalChecklists.filter((entry) => entry.frequency === 'daily')) {
      const existing = await db.trackers.get(tracker.id);
      if (!existing) {
        await db.trackers.put(tracker);
      } else if (existing.sourceId === DATA_SOURCE && existing.provenance === 'community') {
        await db.trackers.put({ ...tracker, createdAt: existing.createdAt, archived: false });
      }
    }

    // Keep retired defaults and their local progress recoverable, but remove them
    // from the active daily list. Never archive user-created trackers.
    const retiredDailyIds = [2, 10, 11, 13, 15].map((index) => `community-global-checklist-v1-daily-${index}`);
    const retired = await db.trackers.bulkGet(retiredDailyIds);
    for (const tracker of retired) {
      if (tracker?.sourceId === DATA_SOURCE && tracker.provenance === 'community') {
        await db.trackers.put({ ...tracker, archived: true });
      }
    }

    await db.preferences.put({ ...(preferences ?? { id: 'main', language: 'es', theme: 'dark', compact: false }), trackerSeedVersion: 4 });
  });
}
