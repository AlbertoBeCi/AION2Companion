import { describe, expect, it } from 'vitest';
import { isWithinTimerAlertWindow, TIMER_ALERT_LEAD_MS, validAlertLeadMinutes } from './timerAlerts';

describe('timer sound alert window', () => {
  const next = new Date('2026-10-16T12:00:00.000Z');

  it('opens at five minutes before the selected timer', () => {
    expect(isWithinTimerAlertWindow(next, new Date(next.getTime() - TIMER_ALERT_LEAD_MS))).toBe(true);
  });

  it('does not alert early or after the event starts', () => {
    expect(isWithinTimerAlertWindow(next, new Date(next.getTime() - TIMER_ALERT_LEAD_MS - 1))).toBe(false);
    expect(isWithinTimerAlertWindow(next, next)).toBe(false);
    expect(isWithinTimerAlertWindow(next, new Date(next.getTime() + 1))).toBe(false);
  });

  it('honors a custom lead time at its boundary without alerting after the event starts', () => {
    for (const minutes of [1, 3, 10, 15, 30, 60]) {
      const lead = minutes * 60_000;
      expect(isWithinTimerAlertWindow(next, new Date(next.getTime() - lead - 1), lead)).toBe(false);
      expect(isWithinTimerAlertWindow(next, new Date(next.getTime() - lead), lead)).toBe(true);
      expect(isWithinTimerAlertWindow(next, next, lead)).toBe(false);
    }
  });

  it('rejects invalid lead times', () => {
    for (const value of [0, -1, 61, 1.5, NaN, Infinity]) expect(validAlertLeadMinutes(value)).toBe(false);
    for (const value of [1, 5, 60]) expect(validAlertLeadMinutes(value)).toBe(true);
  });
});
