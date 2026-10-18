import { describe, expect, it } from 'vitest';
import { isWithinTimerAlertWindow, TIMER_ALERT_LEAD_MS } from './timerAlerts';

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
});
