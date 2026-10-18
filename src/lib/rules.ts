import type { ResetFrequency } from '../types/domain';

const datePart = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const timeParts = (time: string): [number, number] => {
  const [hours = '0', minutes = '0'] = time.split(':');
  return [Number(hours), Number(minutes)];
};

interface CalendarParts { year: number; month: number; day: number; hour: number; minute: number; second: number; }
function partsAt(date: Date, timeZone: string): CalendarParts {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(date);
  const get = (key: string) => Number(parts.find((part) => part.type === key)?.value ?? 0);
  return { year: get('year'), month: get('month'), day: get('day'), hour: get('hour'), minute: get('minute'), second: get('second') };
}
function zonedDate(parts: CalendarParts, timeZone: string): Date | null {
  const desired = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  let timestamp = desired;
  for (let i = 0; i < 4; i += 1) {
    const actual = partsAt(new Date(timestamp), timeZone);
    timestamp += desired - Date.UTC(actual.year, actual.month - 1, actual.day, actual.hour, actual.minute, actual.second);
  }
  const result = partsAt(new Date(timestamp), timeZone);
  return result.year === parts.year && result.month === parts.month && result.day === parts.day && result.hour === parts.hour && result.minute === parts.minute ? new Date(timestamp) : null;
}
function shiftDate(parts: CalendarParts, days: number): CalendarParts {
  const shifted = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days));
  return { ...parts, year: shifted.getUTCFullYear(), month: shifted.getUTCMonth() + 1, day: shifted.getUTCDate() };
}
function civilDatePart(parts: CalendarParts): string { return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`; }
function civilWeekday(parts: CalendarParts): number { return new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay(); }

/** User-configured boundaries use the device's local timezone and calendar. */
export function periodKey(frequency: ResetFrequency, resetTime: string, resetWeekday: number, now = new Date(), timeZone?: string): string {
  if (frequency === 'none') return 'ever';
  const [hours, minutes] = timeParts(resetTime);
  if (timeZone) {
    const current = partsAt(now, timeZone);
    const anchor = shiftDate(current, current.hour * 60 + current.minute < hours * 60 + minutes ? -1 : 0);
    if (frequency === 'daily') return `day:${civilDatePart(anchor)}`;
    const weekday = Math.max(0, Math.min(6, resetWeekday));
    const daysSince = (civilWeekday(anchor) - weekday + 7) % 7;
    return `week:${civilDatePart(shiftDate(anchor, -daysSince))}`;
  }
  const boundary = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);
  if (frequency === 'daily') {
    if (now < boundary) boundary.setDate(boundary.getDate() - 1);
    return `day:${datePart(boundary)}`;
  }
  const weekday = Math.max(0, Math.min(6, resetWeekday));
  const daysSince = (boundary.getDay() - weekday + 7) % 7;
  boundary.setDate(boundary.getDate() - daysSince);
  if (now < boundary) boundary.setDate(boundary.getDate() - 7);
  return `week:${datePart(boundary)}`;
}

export function nextReset(frequency: ResetFrequency, resetTime: string, resetWeekday: number, now = new Date(), timeZone?: string): Date | null {
  if (frequency === 'none') return null;
  const [hours, minutes] = timeParts(resetTime);
  if (timeZone) {
    const current = partsAt(now, timeZone);
    const weekdays = frequency === 'daily' ? null : Math.max(0, Math.min(6, resetWeekday));
    for (let offset = 0; offset <= 7; offset += 1) {
      const date = shiftDate(current, offset);
      if (weekdays !== null && civilWeekday(date) !== weekdays) continue;
      const candidate = zonedDate({ ...date, hour: hours, minute: minutes, second: 0 }, timeZone);
      if (candidate && candidate.getTime() > now.getTime()) return candidate;
    }
    return null;
  }
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);
  if (frequency === 'daily') {
    if (next <= now) next.setDate(next.getDate() + 1);
    return next;
  }
  const weekday = Math.max(0, Math.min(6, resetWeekday));
  let delta = (weekday - next.getDay() + 7) % 7;
  if (delta === 0 && next <= now) delta = 7;
  next.setDate(next.getDate() + delta);
  return next;
}

export function ownerKey(characterId: string | null): string {
  return characterId ? `character:${characterId}` : 'local:default';
}

export function clampProgress(value: number, limit: number): number {
  return Math.max(0, Math.min(limit, Math.floor(value)));
}

export function progressPercent(value: number, limit: number): number {
  return limit > 0 ? Math.round((clampProgress(value, limit) / limit) * 100) : 0;
}
