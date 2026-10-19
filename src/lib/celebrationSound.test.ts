import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { playCelebrationSound, waitForCelebrationSound } from './celebrationSound';

class TestAudio extends EventTarget {
  currentTime = 0;
  play = vi.fn().mockResolvedValue(undefined);
}
const player = new TestAudio();

beforeAll(() => vi.stubGlobal('Audio', class { constructor() { return player; } }));
beforeEach(() => {
  vi.useFakeTimers();
  player.play.mockResolvedValue(undefined);
});
afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); localStorage.removeItem('aion2-completion-playback'); });
afterAll(() => vi.unstubAllGlobals());

describe('completion sound lifetime', () => {
  it('waits for the real ended event, rather than the play promise or a guessed duration', async () => {
    const sound = playCelebrationSound('ended');
    const finished = vi.fn();
    void waitForCelebrationSound('ended').then(finished);
    await vi.advanceTimersByTimeAsync(5000);
    expect(finished).not.toHaveBeenCalled();
    const endedAt = Date.now();
    player.dispatchEvent(new Event('ended'));
    await expect(sound).resolves.toBe(endedAt);
    await expect(waitForCelebrationSound('ended')).resolves.toBe(endedAt);
  });

  it('settles interrupted playback independently when another mission restarts the sound', async () => {
    const first = playCelebrationSound('first');
    await vi.advanceTimersByTimeAsync(500);
    const interruptedAt = Date.now();
    const second = playCelebrationSound('second');
    await expect(first).resolves.toBe(interruptedAt);
    const secondFinished = vi.fn();
    void second.then(secondFinished);
    await vi.advanceTimersByTimeAsync(500);
    expect(secondFinished).not.toHaveBeenCalled();
    player.dispatchEvent(new Event('ended'));
    await expect(second).resolves.toBe(Date.now());
  });

  it('continues if playback is blocked or the audio fails', async () => {
    player.play.mockRejectedValueOnce(new Error('Autoplay denied'));
    await expect(playCelebrationSound('blocked')).resolves.toBe(Date.now());
    const failed = playCelebrationSound('failed');
    player.dispatchEvent(new Event('error'));
    await expect(failed).resolves.toBe(Date.now());
  });

  it('observes the end of sound played by the other native window', async () => {
    const event = { key: 'remote', startedAt: Date.now() };
    localStorage.setItem('aion2-completion-playback', JSON.stringify(event));
    const waiting = waitForCelebrationSound('remote');
    const finished = vi.fn();
    void waiting.then(finished);
    await vi.advanceTimersByTimeAsync(1200);
    expect(finished).not.toHaveBeenCalled();
    const endedAt = Date.now();
    window.dispatchEvent(new StorageEvent('storage', { key: 'aion2-completion-playback', newValue: JSON.stringify({ ...event, endedAt }) }));
    await expect(waiting).resolves.toBe(endedAt);
  });
});
