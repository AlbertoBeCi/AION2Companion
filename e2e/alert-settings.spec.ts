import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test.use({ reducedMotion: 'reduce', screenshot: 'only-on-failure' });

test('custom lead time and chosen sound persist and fire on Overview only once', async ({ page }) => {
  await page.addInitScript(() => {
    const state = window as Window & { audioCalls: string[] };
    state.audioCalls = [];
    HTMLMediaElement.prototype.play = function () { state.audioCalls.push(this.src); return Promise.resolve(); };
  });
  await page.clock.setFixedTime(new Date('2026-10-18T10:49:00Z'));
  await page.goto('/');
  await page.getByRole('button', { name: 'Temporizadores', exact: true }).first().click();
  const leadButton = page.getByRole('button', { name: 'Antelación del aviso', exact: true });
  await leadButton.click();
  let dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: '10 min', exact: true }).click();
  await dialog.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(leadButton).toBeFocused();
  await expect(page.getByRole('switch', { name: 'Aviso sonoro para Shugo Festival, 10 minutos antes', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Sonido de las alertas', exact: true }).click();
  dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Sonido', exact: true }).click();
  await page.getByRole('option', { name: 'Sonido de misión completada', exact: true }).click();
  await dialog.getByRole('button', { name: 'Escuchar sonido' }).click();
  await dialog.getByRole('button', { name: 'Detener prueba' }).click();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await page.reload();
  await page.getByRole('button', { name: 'Temporizadores', exact: true }).first().click();
  const enabledAlert = page.getByRole('switch', { name: 'Aviso sonoro para Shugo Festival, 10 minutos antes', exact: true });
  await enabledAlert.click();
  await expect(enabledAlert).toHaveAttribute('aria-checked', 'true');
  await page.getByRole('button', { name: 'Resumen', exact: true }).first().click();
  await expect(page.locator('.alarm-panel-note')).toContainText('10 min');
  await page.clock.setFixedTime(new Date('2026-10-18T10:50:00Z'));
  const calls = () => page.evaluate(() => (window as Window & { audioCalls: string[] }).audioCalls);
  await expect.poll(async () => (await calls()).length).toBe(1);
  expect((await calls())[0]).toMatch(/\/sounds\/counter-complete\.mp3$/);
  await page.clock.setFixedTime(new Date('2026-10-18T10:55:00Z'));
  await page.waitForTimeout(1200);
  expect((await calls()).length).toBe(1);
});

test('uploaded audio is validated, saved, included in backups and used by global alerts', async ({ page }) => {
  await page.addInitScript(() => {
    const state = window as Window & { audioCalls: string[] };
    state.audioCalls = [];
    HTMLMediaElement.prototype.play = function () { state.audioCalls.push(this.src); return Promise.resolve(); };
  });
  await page.clock.setFixedTime(new Date('2026-10-18T10:54:00Z'));
  await page.goto('/');
  await page.getByRole('button', { name: 'Temporizadores', exact: true }).first().click();
  await page.getByRole('button', { name: 'Sonido de las alertas', exact: true }).click();
  const dialog = page.getByRole('dialog');
  const fileInput = dialog.locator('input[type="file"]');
  await fileInput.setInputFiles({ name: 'invalid.mp3', mimeType: 'audio/mpeg', buffer: Buffer.from('not audio') });
  await expect(dialog.getByRole('alert')).toBeVisible();
  await fileInput.setInputFiles('public/sounds/timer-alert.mp3');
  await expect(dialog.getByRole('button', { name: 'Sonido', exact: true })).toContainText('timer-alert.mp3');
  await expect(dialog.getByRole('alert')).toHaveCount(0);
  await dialog.getByRole('button', { name: 'Cerrar', exact: true }).last().click();
  await page.getByRole('switch', { name: 'Aviso sonoro para Shugo Festival, 5 minutos antes', exact: true }).click();
  await page.getByRole('button', { name: 'Ajustes', exact: true }).first().click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar copia' }).click();
  const download = await downloadPromise;
  const backup = JSON.parse(await readFile((await download.path())!, 'utf8'));
  expect(backup.preferences.timerAlertAudio.name).toBe('timer-alert.mp3');
  expect(backup.preferences.timerAlertAudio.dataUrl).toMatch(/^data:audio\//);
  expect(backup.localSettings['aion2-timer-alert-sound']).toBe('custom');
  await page.getByLabel('Al importar').click();
  await page.getByRole('option', { name: 'Reemplazar los datos locales' }).click();
  await page.locator('input[type="file"]').setInputFiles((await download.path())!);
  await expect(page.getByRole('status')).toHaveText('Copia importada');
  await page.reload();
  await page.clock.setFixedTime(new Date('2026-10-18T10:55:00Z'));
  await expect.poll(() => page.evaluate(() => (window as Window & { audioCalls: string[] }).audioCalls)).toHaveLength(1);
  expect(await page.evaluate(() => (window as Window & { audioCalls: string[] }).audioCalls[0])).toMatch(/^data:audio\//);
});

for (const language of ['es', 'en']) {
  for (const theme of ['light', 'dark']) {
    test(`timer controls and dialogs fit at mobile and desktop sizes in ${language}, ${theme}`, async ({ page }) => {
      await page.addInitScript(savedTheme => localStorage.setItem('aion2-theme', savedTheme), theme);
      await page.goto('/');
      if (language === 'en') await page.locator('.top-actions .icon-button:not(.theme-toggle)').click();
      await page.getByRole('button', { name: language === 'es' ? 'Temporizadores' : 'Timers', exact: true }).first().click();
      for (const width of [320, 375, 768, 1024, 1280, 1600]) {
        await page.setViewportSize({ width, height: 900 });
        const controls = page.locator('.timer-alert-controls');
        const lead = controls.locator(':scope > button').first();
        const sound = controls.locator(':scope > button').last();
        const zone = controls.locator('.server-zone-picker');
        const a = (await lead.boundingBox())!;
        const b = (await sound.boundingBox())!;
        const c = (await zone.boundingBox())!;
        expect(a.x + a.width).toBeLessThanOrEqual(b.x);
        expect(b.x + b.width).toBeLessThanOrEqual(c.x);
        expect(c.x + c.width).toBeLessThanOrEqual(width);
        for (const button of [lead, sound]) {
          await button.click();
          const dialog = page.getByRole('dialog');
          await expect(dialog).toBeVisible();
          const box = (await dialog.boundingBox())!;
          expect(box.x).toBeGreaterThanOrEqual(0);
          expect(box.x + box.width).toBeLessThanOrEqual(width);
          expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
          if (language === 'es' && theme === 'dark' && width === 375 && button === sound) await dialog.screenshot({ path: test.info().outputPath('sound-settings-mobile.png') });
          await page.keyboard.press('Escape');
          await expect(dialog).toHaveCount(0);
          await expect(button).toBeFocused();
        }
      }
    });
  }
}
