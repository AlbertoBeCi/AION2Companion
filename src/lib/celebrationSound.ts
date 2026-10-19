type SoundEvent = { key: string; startedAt: number; endedAt?: number };
type Playback = SoundEvent & { finished: Promise<number>; finish: (at: number) => void };

// Transient playback information lets the native widget wait for sound played by the main window.
const soundEventKey = 'aion2-completion-playback';
const playbacks = new Map<string, Playback>();
let audio: HTMLAudioElement | null = null;
let stopPrevious: (() => void) | undefined;

function receive(event: SoundEvent) {
  let playback = playbacks.get(event.key);
  if (!playback || playback.startedAt !== event.startedAt) {
    let finish!: (at: number) => void;
    const finished = new Promise<number>((resolve) => { finish = resolve; });
    playback = { ...event, finished, finish };
    playbacks.set(event.key, playback);
    if (playbacks.size > 32) playbacks.delete(playbacks.keys().next().value!);
  }
  if (event.endedAt !== undefined) {
    playback.endedAt = event.endedAt;
    playback.finish(event.endedAt);
  }
}

function parseEvent(value: string | null): SoundEvent | null {
  try {
    const event = JSON.parse(value ?? 'null') as SoundEvent | null;
    return event && typeof event.key === 'string' && Number.isFinite(event.startedAt)
      && (event.endedAt === undefined || Number.isFinite(event.endedAt)) ? event : null;
  } catch { return null; }
}

function announce(event: SoundEvent) {
  receive(event);
  try { localStorage.setItem(soundEventKey, JSON.stringify(event)); } catch { /* Playback still works in this window. */ }
}

if (typeof window !== 'undefined') window.addEventListener('storage', (event) => {
  if (event.key !== soundEventKey) return;
  const playback = parseEvent(event.newValue);
  if (playback) receive(playback);
});

export function waitForCelebrationSound(key: string): Promise<number> {
  try {
    const event = parseEvent(localStorage.getItem(soundEventKey));
    if (event?.key === key) receive(event);
  } catch { /* Use this window's playback information. */ }
  const playback = playbacks.get(key);
  // No sound accompanies bulk updates; they still get the full two-second pause.
  if (!playback || Date.now() - playback.startedAt > 60_000) return Promise.resolve(Date.now());
  return playback.finished;
}

export function playCelebrationSound(key = ''): Promise<number> {
  if (typeof window === 'undefined') return Promise.resolve(Date.now());
  stopPrevious?.();
  audio ??= new Audio('/sounds/counter-complete.mp3');
  const player = audio;
  const startedAt = Date.now();
  if (key) announce({ key, startedAt });
  return new Promise<number>((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(watchdog);
      player.removeEventListener('ended', finish);
      player.removeEventListener('error', finish);
      if (stopPrevious === finish) stopPrevious = undefined;
      const endedAt = Date.now();
      if (key) announce({ key, startedAt, endedAt });
      resolve(endedAt);
    };
    const watchdog = setTimeout(finish, 30_000);
    stopPrevious = finish;
    player.addEventListener('ended', finish);
    player.addEventListener('error', finish);
    try {
      player.currentTime = 0;
      void player.play().catch(finish);
    } catch { finish(); }
  });
}
