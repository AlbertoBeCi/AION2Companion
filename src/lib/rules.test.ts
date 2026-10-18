import { afterAll, describe, expect, it } from 'vitest';
import { clampProgress, nextReset, ownerKey, periodKey, progressPercent } from './rules';

const runtime = globalThis as typeof globalThis & { process?: { env: Record<string, string | undefined> } };
const originalTimezone = runtime.process?.env.TZ;
if (runtime.process) runtime.process.env.TZ = 'Europe/Madrid';

describe('periodKey', () => {
  it('keeps progress in the previous daily period until the configured local boundary', () => {
    expect(periodKey('daily', '07:00', 3, new Date(2026, 9, 16, 6, 59))).toBe('day:2026-10-15');
    expect(periodKey('daily', '07:00', 3, new Date(2026, 9, 16, 7, 0))).toBe('day:2026-10-16');
  });

  it('starts a weekly period on the selected local weekday at its boundary', () => {
    expect(periodKey('weekly', '07:00', 3, new Date(2026, 9, 21, 6, 59))).toBe('week:2026-10-14');
    expect(periodKey('weekly', '07:00', 3, new Date(2026, 9, 21, 7, 0))).toBe('week:2026-10-21');
  });

  it('uses the Global KST reset boundary and Wednesday week across local time zones', () => {
    expect(periodKey('daily', '16:00', 3, new Date('2026-10-16T06:59:00.000Z'), 'Asia/Seoul')).toBe('day:2026-10-15');
    expect(periodKey('daily', '16:00', 3, new Date('2026-10-16T07:00:00.000Z'), 'Asia/Seoul')).toBe('day:2026-10-16');
    expect(periodKey('weekly', '16:00', 3, new Date('2026-10-21T06:59:00.000Z'), 'Asia/Seoul')).toBe('week:2026-10-14');
    expect(periodKey('weekly', '16:00', 3, new Date('2026-10-21T07:00:00.000Z'), 'Asia/Seoul')).toBe('week:2026-10-21');
    expect(nextReset('weekly', '16:00', 3, new Date('2026-10-16T12:00:00.000Z'), 'Asia/Seoul')?.toISOString()).toBe('2026-10-21T07:00:00.000Z');
  });

  it('uses local calendar dates across spring and autumn daylight-saving changes', () => {
    const spring = nextReset('daily', '07:00', 3, new Date(2026, 2, 28, 12, 0));
    const autumn = nextReset('daily', '07:00', 3, new Date(2026, 9, 24, 12, 0));
    expect(spring?.getHours()).toBe(7);
    expect(spring?.getDate()).toBe(29);
    expect(autumn?.getHours()).toBe(7);
    expect(autumn?.getDate()).toBe(25);
  });
});

describe('ownership and progress', () => {
  it('keeps character, account, and region/server scopes separate', () => {
    expect(ownerKey({ scope: 'character', region: 'global' }, 'char-1', 'A')).toBe('character:char-1');
    expect(ownerKey({ scope: 'account', region: 'global' }, 'char-1', 'A')).toBe('account');
    expect(ownerKey({ scope: 'server', region: 'global' }, 'char-1', 'A')).toBe('server:global:a');
    expect(ownerKey({ scope: 'server', region: 'korea' }, 'char-1', 'A')).toBe('server:korea:a');
    expect(ownerKey({ scope: 'server', region: 'unknown' }, 'char-1', 'A', 'global')).toBe('server:global:a');
    expect(ownerKey({ scope: 'server', region: 'global' }, 'char-1', '')).toBe('local:default');
  });

  it('uses the local profile when no character or server was configured', () => {
    expect(ownerKey({ scope: 'character', region: 'global' }, null, null)).toBe('local:default');
    expect(ownerKey({ scope: 'server', region: 'global' }, null, null)).toBe('local:default');
    expect(ownerKey({ scope: 'character', region: 'global' }, 'char-1', null)).toBe('character:char-1');
  });

  it('clamps manual progress and returns a bounded percentage', () => {
    expect(clampProgress(-1, 5)).toBe(0);
    expect(clampProgress(8.7, 5)).toBe(5);
    expect(progressPercent(2, 5)).toBe(40);
  });
});

afterAll(() => {
  if (!runtime.process) return;
  if (originalTimezone === undefined) delete runtime.process.env.TZ;
  else runtime.process.env.TZ = originalTimezone;
});
