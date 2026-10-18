import { db } from '../db/database';
import { ownerKey } from './rules';

/** Legacy shared entries have no author; preserve them for one matching character only. */
export async function migrateCharacterProgress(): Promise<void> {
  await db.transaction('rw', [db.preferences, db.characters, db.trackers, db.progress], async () => {
    const preferences = await db.preferences.get('main');
    if (!preferences || (preferences.progressOwnershipVersion ?? 0) >= 1) return;
    const characters = await db.characters.orderBy('name').toArray();
    const trackers = new Map((await db.trackers.toArray()).map(tracker => [tracker.id, tracker]));
    const entries = (await db.progress.toArray()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    for (const entry of entries) {
      if (entry.ownerKey.startsWith('character:')) continue;
      const tracker = trackers.get(entry.trackerId);
      if (!tracker) continue;
      const character = entry.ownerKey.startsWith('server:')
        ? characters.find(person => {
          const region = person.region === 'unknown' ? tracker.region : person.region;
          return entry.ownerKey === `server:${region}:${person.server.trim().toLocaleLowerCase()}`;
        })
        : characters[0];
      const owner = ownerKey(character?.id ?? null);
      const id = `${entry.trackerId}|${owner}|${entry.periodKey}`;
      // An existing individual entry is authoritative, even when explicitly reset to zero.
      if (!await db.progress.get(id)) await db.progress.put({ ...entry, id, ownerKey: owner });
    }
    // Original shared records remain recoverable in backups and are never copied again.
    await db.preferences.update('main', { progressOwnershipVersion: 1 });
  });
}
