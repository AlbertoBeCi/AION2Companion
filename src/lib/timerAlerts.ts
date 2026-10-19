export const TIMER_ALERT_LEAD_MS = 5 * 60 * 1000;
export const TIMER_ALERT_LEAD_KEY = 'aion2-timer-alert-lead-minutes';
export const TIMER_ALERT_SOUND_KEY = 'aion2-timer-alert-sound';
export const timerAlertSounds = {
  default: '/sounds/timer-alert.mp3',
  completion: '/sounds/counter-complete.mp3',
};
export type TimerAlertSound = keyof typeof timerAlertSounds | 'custom';

export function validAlertLeadMinutes(value: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= 60;
}
export { playCelebrationSound } from './celebrationSound';
let timerAlertAudio: HTMLAudioElement | null = null;

function alertAudio(source: string): HTMLAudioElement {
  if (!timerAlertAudio || timerAlertAudio.getAttribute('src') !== source) {
    timerAlertAudio?.pause();
    timerAlertAudio = new Audio(source);
  }
  return timerAlertAudio;
}

export function preloadTimerAlertAudio(source = timerAlertSounds.default): void {
  if (typeof window === 'undefined') return;
  const audio = alertAudio(source);
  audio.preload = 'auto';
  audio.load();
}

export function isWithinTimerAlertWindow(next: Date, now: Date, leadMs = TIMER_ALERT_LEAD_MS): boolean {
  const remaining = next.getTime() - now.getTime();
  return remaining > 0 && remaining <= leadMs;
}

export async function playTimerAlert(source = timerAlertSounds.default): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const audio = alertAudio(source);
  audio.currentTime = 0;
  try {
    await audio.play();
    return true;
  } catch {
    return false;
  }
}
