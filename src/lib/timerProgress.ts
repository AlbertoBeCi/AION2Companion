export function timerElapsedPercent(start: Date | null, end: Date | null, now: Date): number | null {
  if (!start || !end) return null;
  const duration = end.getTime() - start.getTime();
  if (!Number.isFinite(duration) || duration <= 0 || !Number.isFinite(now.getTime())) return null;
  return Math.max(0, Math.min(100, (now.getTime() - start.getTime()) / duration * 100));
}
