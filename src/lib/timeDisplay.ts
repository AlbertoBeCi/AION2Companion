export interface LocalClockLabel {
  weekday: string;
  time: string;
  zone: string;
}

/** Formats a scheduled instant in the visitor's device timezone. */
export function formatLocalClock(
  date: Date,
  language: 'es' | 'en',
  timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
): LocalClockLabel {
  const parts = new Intl.DateTimeFormat(language === 'es' ? 'es-ES' : 'en-GB', {
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone,
    timeZoneName: 'short',
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  return {
    weekday: get('weekday').toLocaleUpperCase(language === 'es' ? 'es-ES' : 'en-GB'),
    time: `${get('hour')}:${get('minute')}`,
    zone: get('timeZoneName'),
  };
}
