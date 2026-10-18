import { describe, expect, it } from 'vitest';
import { CONQUEST_TRACKER_ID, recommendedGlobalChecklists } from './checklists';

describe('recommended daily Conquest tracker', () => {
  it('offers one localized-ready generic counter with a limit of two', () => {
    const conquestTrackers = recommendedGlobalChecklists.filter((tracker) => tracker.frequency === 'daily' && tracker.category === 'Conquest');

    expect(conquestTrackers).toHaveLength(1);
    expect(conquestTrackers[0]).toMatchObject({
      id: CONQUEST_TRACKER_ID,
      name: 'Conquest',
      limit: 2,
      frequency: 'daily',
    });
    expect(recommendedGlobalChecklists).toHaveLength(21);
  });
});

describe('requested daily counters', () => {
  it('seeds the requested names and daily targets', () => {
    const daily = recommendedGlobalChecklists.filter((tracker) => tracker.frequency === 'daily');
    const byName = new Map(daily.map((tracker) => [tracker.name, tracker]));

    expect(daily.map((tracker) => tracker.name)).toEqual([
      'Misiones de Duty', 'Nightmare', 'Conquest', 'Mazmorras', 'Llaves Shugo', 'Llave de invasión Dimensional',
    ]);

    expect(byName.get('Misiones de Duty')?.limit).toBe(5);
    expect(byName.get('Nightmare')?.limit).toBe(2);
    expect(byName.get('Mazmorras')?.limit).toBe(1);
    expect(byName.get('Llaves Shugo')?.limit).toBe(3);
    expect(byName.get('Llave de invasión Dimensional')?.limit).toBe(1);
    expect(byName.get('Conquest')?.limit).toBe(2);
  });
});
