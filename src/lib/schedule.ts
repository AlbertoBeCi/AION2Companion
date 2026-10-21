export interface RecurringSchedule {
  id: string;
  name: string;
  kind: 'boss' | 'event';
  days?: number[];
  times?: string[];
  intervalMinute?: 0 | 30;
  activeDurationMinute?: number;
}

export const globalSchedules: RecurringSchedule[] = [
  { id: 'spacetime-rift', name: 'Spacetime Rift', kind: 'event', activeDurationMinute: 60, times: ['02:00', '05:00', '08:00', '11:00', '14:00', '17:00', '20:00', '23:00'] },
  { id: 'shugo-festival', name: 'Shugo Festival', kind: 'event', activeDurationMinute: 10, intervalMinute: 0 },
  { id: 'dimensional-invasion', name: 'Dimensional Invasion', kind: 'event', activeDurationMinute: 15, intervalMinute: 30 },
  { id: 'artifact-siege', name: 'Artifact Siege', kind: 'event', activeDurationMinute: 30, days: [1, 4, 6], times: ['21:00'] },
  { id: 'executor-tamasa', name: 'Executor Tamasa', kind: 'boss', activeDurationMinute: 30, days: [1, 4, 6], times: ['21:30'] },
  { id: 'executor-argo', name: 'Executor Argo', kind: 'boss', activeDurationMinute: 30, days: [1, 4, 6], times: ['21:30'] },
  { id: 'executor-kaira', name: 'Executor Kaira', kind: 'boss', activeDurationMinute: 30, days: [1, 4, 6], times: ['21:30'] },
  { id: 'guardian-lord-nahma', name: 'Guardian Lord Nahma', kind: 'boss', activeDurationMinute: 30, days: [5, 0], times: ['21:00'] },
  { id: 'enraged-nahma', name: 'Enraged Guardian Lord Nahma', kind: 'boss', activeDurationMinute: 30, days: [5, 0], times: ['21:00'] },
  { id: 'watcher-kaira', name: 'Watcher Kaira', kind: 'boss', activeDurationMinute: 30, times: ['01:00', '04:00', '07:00', '10:00', '13:00', '16:00', '19:00', '22:00'] },
];

interface ZonedParts { year: number; month: number; day: number; hour: number; minute: number; second: number; }
function partsAt(date: Date, timeZone: string): ZonedParts {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(date);
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  return { year: get('year'), month: get('month'), day: get('day'), hour: get('hour'), minute: get('minute'), second: get('second') };
}

function localDateTimeToInstant(parts: ZonedParts, timeZone: string): Date | null {
  const desired = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  let instant = desired;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const actual = partsAt(new Date(instant), timeZone);
    const actualAsUtc = Date.UTC(actual.year, actual.month - 1, actual.day, actual.hour, actual.minute, actual.second);
    instant += desired - actualAsUtc;
  }
  const resolved = partsAt(new Date(instant), timeZone);
  const matches = resolved.year === parts.year && resolved.month === parts.month && resolved.day === parts.day && resolved.hour === parts.hour && resolved.minute === parts.minute;
  return matches ? new Date(instant) : null;
}

function weekday(year: number, month: number, day: number): number {
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

function nextFixedTime(days: number[], times: string[], now: Date, timeZone: string, direction = 1): Date | null {
  const current = partsAt(now, timeZone);
  const start = Date.UTC(current.year, current.month - 1, current.day);
  const candidates: Date[] = [];
  for (let offset = 0; offset <= 7; offset += 1) {
    const dayDate = new Date(start + direction * offset * 86400000);
    const year = dayDate.getUTCFullYear();
    const month = dayDate.getUTCMonth() + 1;
    const day = dayDate.getUTCDate();
    if (days.length && !days.includes(weekday(year, month, day))) continue;
    for (const time of times) {
      const [hour, minute] = time.split(':').map(Number);
      const candidate = localDateTimeToInstant({ year, month, day, hour: hour ?? 0, minute: minute ?? 0, second: 0 }, timeZone);
      if (candidate && (direction === 1 ? candidate.getTime() > now.getTime() : candidate.getTime() <= now.getTime())) candidates.push(candidate);
    }
  }
  return candidates.sort((a, b) => direction * (a.getTime() - b.getTime()))[0] ?? null;
}

export function previousScheduleOccurrence(schedule: RecurringSchedule, now: Date, timeZone: string): Date | null {
  if (schedule.intervalMinute !== undefined) {
    const currentMinute = Math.floor(now.getTime() / 60000) * 60000;
    for (let elapsed = 0; elapsed < 60; elapsed += 1) {
      const candidate = new Date(currentMinute - elapsed * 60000);
      if (partsAt(candidate, timeZone).minute === schedule.intervalMinute) return candidate;
    }
    return null;
  }
  return nextFixedTime(schedule.days ?? [], schedule.times ?? [], now, timeZone, -1);
}

export function nextScheduleOccurrence(schedule: RecurringSchedule, now: Date, timeZone: string): Date | null {
  if (schedule.intervalMinute !== undefined) {
    const first = Math.floor(now.getTime() / 60000) * 60000 + 60000;
    for (let step = 0; step < 7 * 48; step += 1) {
      const candidate = new Date(first + step * 60000);
      const local = partsAt(candidate, timeZone);
      if (local.minute === schedule.intervalMinute && local.second === 0) return candidate;
    }
    return null;
  }
  return nextFixedTime(schedule.days ?? [], schedule.times ?? [], now, timeZone);
}

export function currentScheduleOccurrence(schedule: RecurringSchedule, now: Date, timeZone: string): Date | null {
  if (!schedule.activeDurationMinute) return null;
  const currentMinute = Math.floor(now.getTime() / 60000) * 60000;
  const duration = schedule.activeDurationMinute;
  for (let elapsed = 0; elapsed < duration; elapsed += 1) {
    const candidate = new Date(currentMinute - elapsed * 60000);
    const local = partsAt(candidate, timeZone);
    if (schedule.intervalMinute !== undefined) {
      if (local.minute === schedule.intervalMinute) return candidate;
      continue;
    }
    if (schedule.days?.length && !schedule.days.includes(weekday(local.year, local.month, local.day))) continue;
    const localTime = `${String(local.hour).padStart(2, '0')}:${String(local.minute).padStart(2, '0')}`;
    if (schedule.times?.includes(localTime)) return candidate;
  }
  return null;
}

export function nextWeeklyGlobalReset(now: Date): Date {
  return nextFixedTime([3], ['16:00'], now, 'Asia/Seoul')!;
}
