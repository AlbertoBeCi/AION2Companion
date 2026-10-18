const APP_LOCAL_KEYS = new Set([
  'aion2-theme',
  'aion2-timer-server-zone',
  'aion2-gartua-server',
  'aion2-timer-sound-alerts',
  'aion2-timer-alert-lead-minutes',
  'aion2-timer-alert-sound',
]);
export const LOCAL_SETTINGS_CHANGED = 'aion2-local-settings-changed';

function isAppLocalKey(key: string): boolean {
  return APP_LOCAL_KEYS.has(key) || /^aion2-timer-alert-fired:[a-z0-9-]+$/i.test(key);
}

export function exportLocalSettings(): Record<string, string> {
  const settings: Record<string, string> = {};
  try {
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (!key || !isAppLocalKey(key)) continue;
      const value = localStorage.getItem(key);
      if (value !== null) settings[key] = value;
    }
  } catch {
    return settings;
  }
  return settings;
}

function isValidLocalSetting(key: string, value: string): boolean {
  if (value.length > 2048) return false;
  if (key === 'aion2-theme') return value === 'dark' || value === 'light';
  if (key === 'aion2-timer-alert-lead-minutes') return /^\d+$/.test(value) && Number(value) >= 1 && Number(value) <= 60;
  if (key === 'aion2-timer-alert-sound') return ['default', 'completion', 'custom'].includes(value);
  if (key === 'aion2-timer-server-zone') {
    return ['Europe/Berlin', 'America/New_York', 'America/Los_Angeles', 'America/Sao_Paulo', 'Asia/Seoul'].includes(value);
  }
  if (key === 'aion2-gartua-server') return value === '' || /^(eu|nae|naw|sa)-[a-z0-9]{2,20}$/.test(value);
  if (key === 'aion2-timer-sound-alerts') {
    try {
      const parsed: unknown = JSON.parse(value);
      return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
        && Object.values(parsed).every((enabled) => typeof enabled === 'boolean');
    } catch {
      return false;
    }
  }
  return /^\d{10,16}$/.test(value);
}

export function importLocalSettings(settings: Record<string, string>): void {
  for (const [key, value] of Object.entries(settings)) {
    if (isAppLocalKey(key) && isValidLocalSetting(key, value)) {
      try {
        localStorage.setItem(key, value);
      } catch {
        break;
      }
    }
  }
  window.dispatchEvent(new Event(LOCAL_SETTINGS_CHANGED));
}

export function clearLocalSettings(): void {
  try {
    for (let index = localStorage.length - 1; index >= 0; index -= 1) {
      const key = localStorage.key(index);
      if (key && isAppLocalKey(key)) localStorage.removeItem(key);
    }
  } catch {
    // If local storage is disabled, there is no app localStorage data to remove.
  }
  window.dispatchEvent(new Event(LOCAL_SETTINGS_CHANGED));
}
