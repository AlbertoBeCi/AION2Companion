import { describe, expect, it } from 'vitest';
import type { Tracker } from '../types/domain';
import { trackerCopy } from './trackerCopy';

const seededDuty: Tracker = {
  id: 'community-global-checklist-v1-daily-1', name: 'Misiones de Duty', description: 'Objetivo diario: 5 misiones. Registra el progreso manualmente.', category: 'Misiones',
  limit: 5, scope: 'server', frequency: 'daily', resetTime: '16:00', resetWeekday: 3, resetTimeZone: 'Asia/Seoul', region: 'global',
  provenance: 'community', sourceId: 'aion2data-global-client-25800038-2026-10-09', createdAt: '2026-10-16T00:00:00.000Z',
};

describe('trackerCopy', () => {
  it('localizes seeded trackers without changing their saved data', () => {
    expect(trackerCopy(seededDuty, 'en')).toEqual({
      name: 'Duty Missions',
      description: 'Daily target: 5 missions. Track your progress manually.',
      category: 'Missions',
    });
    expect(seededDuty.name).toBe('Misiones de Duty');
  });

  it('preserves names and copy customized by the user', () => {
    const custom = { ...seededDuty, name: 'My routine', description: 'Personal note', category: 'Personal' };
    expect(trackerCopy(custom, 'es')).toEqual({ name: 'My routine', description: 'Personal note', category: 'Personal' });
  });
});
