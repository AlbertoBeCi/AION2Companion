import { describe, expect, it } from 'vitest';
import { formatLocalClock } from './timeDisplay';

describe('nav timer local clock labels', () => {
  it('converts the Global KST reset into Madrid summer time', () => {
    const label = formatLocalClock(new Date('2026-10-21T07:00:00.000Z'), 'es', 'Europe/Madrid');
    expect(label).toEqual({ weekday: 'MIÉ', time: '09:00', zone: 'CEST' });
  });

  it('uses Madrid winter time after daylight saving ends', () => {
    const label = formatLocalClock(new Date('2026-10-28T07:00:00.000Z'), 'es', 'Europe/Madrid');
    expect(label).toEqual({ weekday: 'MIÉ', time: '08:00', zone: 'CET' });
  });

  it('can display a schedule in the device timezone even when it comes from another zone', () => {
    const label = formatLocalClock(new Date('2026-10-28T22:00:00.000Z'), 'en', 'Europe/Madrid');
    expect(label).toEqual({ weekday: 'WED', time: '23:00', zone: 'CET' });
  });
});
