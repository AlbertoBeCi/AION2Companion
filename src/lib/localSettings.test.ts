import { afterEach, describe, expect, it } from 'vitest';
import { clearLocalSettings, exportLocalSettings, importLocalSettings } from './localSettings';

afterEach(() => localStorage.clear());

describe('local app settings backup', () => {
  it('exports only recognized AION2Companion keys', () => {
    localStorage.setItem('aion2-theme', 'dark');
    localStorage.setItem('unrelated-app-key', 'leave out');

    expect(exportLocalSettings()).toEqual({ 'aion2-theme': 'dark' });
  });

  it('validates known settings and ignores unknown or malformed values on import', () => {
    importLocalSettings({
      'aion2-theme': 'dark',
      'aion2-timer-server-zone': 'Europe/Berlin',
      'aion2-gartua-server': 'invalid-server!/',
      'aion2-timer-sound-alerts': '{"spacetime-rift":true}',
      'aion2-timer-alert-lead-minutes': '15',
      'aion2-timer-alert-sound': 'completion',
      'unrelated-app-key': 'should not be restored',
    });

    expect(localStorage.getItem('aion2-theme')).toBe('dark');
    expect(localStorage.getItem('aion2-timer-server-zone')).toBe('Europe/Berlin');
    expect(localStorage.getItem('aion2-gartua-server')).toBeNull();
    expect(localStorage.getItem('aion2-timer-sound-alerts')).toBe('{"spacetime-rift":true}');
    expect(localStorage.getItem('aion2-timer-alert-lead-minutes')).toBe('15');
    expect(localStorage.getItem('aion2-timer-alert-sound')).toBe('completion');
    expect(localStorage.getItem('unrelated-app-key')).toBeNull();
  });

  it('rejects invalid alert settings on import', () => {
    importLocalSettings({ 'aion2-timer-alert-lead-minutes': '61', 'aion2-timer-alert-sound': 'https://invalid.example/audio.mp3' });
    expect(localStorage.getItem('aion2-timer-alert-lead-minutes')).toBeNull();
    expect(localStorage.getItem('aion2-timer-alert-sound')).toBeNull();
  });

  it('clears all app-owned settings while preserving keys owned by other code', () => {
    localStorage.setItem('aion2-theme', 'light');
    localStorage.setItem('aion2-timer-alert-fired:spacetime-rift', '1792350000000');
    localStorage.setItem('unrelated-app-key', 'keep');

    clearLocalSettings();

    expect(exportLocalSettings()).toEqual({});
    expect(localStorage.getItem('unrelated-app-key')).toBe('keep');
  });
});
