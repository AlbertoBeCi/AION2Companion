import { describe, expect, it } from 'vitest';
import { currentScheduleOccurrence, globalSchedules, nextScheduleOccurrence, nextWeeklyGlobalReset } from './schedule';

describe('Global community schedules', () => {
  it('finds the next rift using the selected server time zone', () => {
    const rift = globalSchedules.find((schedule) => schedule.id === 'spacetime-rift')!;
    const now = new Date('2026-10-16T12:00:00.000Z');
    expect(nextScheduleOccurrence(rift, now, 'Europe/Berlin')?.toISOString()).toBe('2026-10-16T15:00:00.000Z');
  });

  it('converts scheduled wall time across European daylight saving time', () => {
    const rift = globalSchedules.find((schedule) => schedule.id === 'spacetime-rift')!;
    const now = new Date('2027-03-27T23:30:00.000Z');
    expect(nextScheduleOccurrence(rift, now, 'Europe/Berlin')?.toISOString()).toBe('2027-03-28T03:00:00.000Z');
  });

  it('computes Global weekly reset as Wednesday 16:00 Korea time', () => {
    const now = new Date('2026-10-16T12:00:00.000Z');
    expect(nextWeeklyGlobalReset(now).toISOString()).toBe('2026-10-21T07:00:00.000Z');
  });

  it('moves hourly events to the following hour at their configured minute', () => {
    const shugo = globalSchedules.find((schedule) => schedule.id === 'shugo-festival')!;
    const now = new Date('2026-10-16T10:00:00.000Z');
    expect(nextScheduleOccurrence(shugo, now, 'Europe/Berlin')?.toISOString()).toBe('2026-10-16T11:00:00.000Z');
  });

  it('marks an hourly event active only within its published duration', () => {
    const shugo = globalSchedules.find((schedule) => schedule.id === 'shugo-festival')!;
    expect(currentScheduleOccurrence(shugo, new Date('2026-10-16T10:05:00.000Z'), 'Europe/Berlin')?.toISOString()).toBe('2026-10-16T10:00:00.000Z');
    expect(currentScheduleOccurrence(shugo, new Date('2026-10-16T10:10:00.000Z'), 'Europe/Berlin')).toBeNull();
  });

  it('marks fixed-time events active through their duration and honors their weekday', () => {
    const rift = globalSchedules.find((schedule) => schedule.id === 'spacetime-rift')!;
    expect(currentScheduleOccurrence(rift, new Date('2026-10-16T09:59:00.000Z'), 'Europe/Berlin')?.toISOString()).toBe('2026-10-16T09:00:00.000Z');
    expect(currentScheduleOccurrence(rift, new Date('2026-10-16T10:00:00.000Z'), 'Europe/Berlin')).toBeNull();
    const siege = globalSchedules.find((schedule) => schedule.id === 'artifact-siege')!;
    expect(currentScheduleOccurrence(siege, new Date('2026-10-16T19:10:00.000Z'), 'Europe/Berlin')).toBeNull();
  });
});
