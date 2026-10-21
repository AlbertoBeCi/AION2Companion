import { describe, expect, it } from 'vitest';
import { timerElapsedPercent } from './timerProgress';

describe('timer elapsed bar', () => {
  const start = new Date('2026-10-20T10:00:00Z');
  const end = new Date('2026-10-20T11:00:00Z');
  it('fills as the countdown approaches zero and stays within its bounds', () => {
    expect(timerElapsedPercent(start, end, new Date('2026-10-20T09:00:00Z'))).toBe(0);
    expect(timerElapsedPercent(start, end, new Date('2026-10-20T10:15:00Z'))).toBe(25);
    expect(timerElapsedPercent(start, end, end)).toBe(100);
    expect(timerElapsedPercent(start, end, new Date('2026-10-20T12:00:00Z'))).toBe(100);
  });
  it('omits progress when a feed has no reliable countdown', () => {
    expect(timerElapsedPercent(null, end, start)).toBeNull();
    expect(timerElapsedPercent(start, null, start)).toBeNull();
    expect(timerElapsedPercent(end, start, start)).toBeNull();
    expect(timerElapsedPercent(start, start, start)).toBeNull();
  });
});
