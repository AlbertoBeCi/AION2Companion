import { z } from 'zod';

export const MAX_ALERT_AUDIO_BYTES = 2 * 1024 * 1024;
export const customAlertAudioSchema = z.object({
  name: z.string().min(1).max(100),
  dataUrl: z.string().max(Math.ceil(MAX_ALERT_AUDIO_BYTES / 3) * 4 + 100).regex(/^data:audio\/[a-z0-9.+-]+;base64,[A-Za-z0-9+/]+={0,2}$/),
});

export async function readCustomAlertAudio(file: File): Promise<z.infer<typeof customAlertAudioSchema>> {
  if (!file.size || file.size > MAX_ALERT_AUDIO_BYTES || !file.type.startsWith('audio/')) throw new Error('invalid-audio');
  const url = URL.createObjectURL(file);
  const audio = new Audio();
  try {
    await new Promise<void>((resolve, reject) => {
      const timeout = window.setTimeout(() => reject(new Error('invalid-audio')), 10_000);
      audio.onloadedmetadata = () => { window.clearTimeout(timeout); resolve(); };
      audio.onerror = () => { window.clearTimeout(timeout); reject(new Error('invalid-audio')); };
      audio.src = url;
      audio.preload = 'metadata';
    });
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('invalid-audio'));
      reader.readAsDataURL(file);
    });
    return customAlertAudioSchema.parse({ name: file.name.slice(0, 100), dataUrl });
  } finally {
    audio.onloadedmetadata = null;
    audio.onerror = null;
    audio.removeAttribute('src');
    audio.load();
    URL.revokeObjectURL(url);
  }
}
