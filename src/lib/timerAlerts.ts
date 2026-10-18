export const TIMER_ALERT_LEAD_MS = 5 * 60 * 1000;

let completionAudio: HTMLAudioElement | null = null;
let timerAlertAudio: HTMLAudioElement | null = null;

export function preloadTimerAlertAudio(): void {
  if (typeof window === 'undefined') return;
  timerAlertAudio ??= new Audio('/sounds/timer-alert.mp3');
  timerAlertAudio.preload = 'auto';
  timerAlertAudio.load();
}

export function isWithinTimerAlertWindow(next: Date, now: Date): boolean {
  const remaining = next.getTime() - now.getTime();
  return remaining > 0 && remaining <= TIMER_ALERT_LEAD_MS;
}

export async function playTimerAlert(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  timerAlertAudio ??= new Audio('/sounds/timer-alert.mp3');
  timerAlertAudio.currentTime = 0;
  try {
    await timerAlertAudio.play();
    return true;
  } catch {
    return false;
  }
}

export function playCelebrationSound(): void {
  if (typeof window === 'undefined') return;
  completionAudio ??= new Audio('/sounds/counter-complete.mp3');
  completionAudio.currentTime = 0;
  void completionAudio.play().catch(() => undefined);
}
