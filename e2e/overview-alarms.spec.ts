import { expect, test } from '@playwright/test';

test.use({ reducedMotion: 'reduce', screenshot: 'only-on-failure' });

test('overview shows only enabled alerts and keeps weekly tasks in Trackers', async ({ page }) => {
  await page.goto('/');
  const panel = page.getByRole('region', { name: 'Mis alarmas' });
  await expect(panel.getByText('No tienes alarmas activadas.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Semanales', exact: true })).toHaveCount(0);
  await panel.getByRole('button', { name: 'Configurar' }).click();
  await page.getByRole('switch', { name: 'Aviso sonoro para Shugo Festival, 5 minutos antes', exact: true }).click();
  await page.getByRole('switch', { name: 'Aviso sonoro para Spacetime Rift, 5 minutos antes', exact: true }).click();
  await page.getByRole('button', { name: 'Resumen', exact: true }).first().click();
  await expect(panel.locator('.alarm-timer')).toHaveCount(2);
  await expect(panel.getByRole('heading', { name: 'Shugo Festival', exact: true })).toBeVisible();
  await expect(panel.getByRole('heading', { name: 'Spacetime Rift', exact: true })).toBeVisible();
  await expect(panel.getByRole('heading', { name: 'Watcher Kaira' })).toHaveCount(0);
  const before = await panel.locator('[data-alarm-id="shugo-festival"] [role="timer"]').textContent();
  await expect(panel.locator('[data-alarm-id="shugo-festival"] [role="timer"]')).not.toHaveText(before!);
  await page.reload();
  await expect(panel.locator('.alarm-timer')).toHaveCount(2);
  for (const width of [320, 375, 768, 947, 1280, 1600]) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  }
  await page.getByRole('button', { name: 'Contadores', exact: true }).first().click();
  await page.getByRole('tab', { name: /Semanales/ }).click();
  await expect(page.locator('.tracker-card').first()).toBeVisible();
});

test('the timer MP3 plays once per event from every app page', async ({ page }) => {
  await page.addInitScript(() => {
    const state = window as Window & { timerAudioCalls: string[] };
    state.timerAudioCalls = [];
    HTMLMediaElement.prototype.play = function () { state.timerAudioCalls.push(this.src); return Promise.resolve(); };
    HTMLMediaElement.prototype.load = function () {};
  });
  await page.clock.setFixedTime(new Date('2026-10-18T10:54:00Z'));
  await page.goto('/');
  await page.getByRole('button', { name: 'Temporizadores', exact: true }).first().click();
  await page.getByRole('switch', { name: 'Aviso sonoro para Shugo Festival, 5 minutos antes', exact: true }).click();
  await page.getByRole('button', { name: 'Resumen', exact: true }).first().click();
  const calls = () => page.evaluate(() => (window as Window & { timerAudioCalls: string[] }).timerAudioCalls);
  await expect.poll(async () => (await calls()).length).toBe(0);
  await page.clock.setFixedTime(new Date('2026-10-18T10:55:00Z'));
  await expect.poll(async () => (await calls()).length).toBe(1);
  expect((await calls())[0]).toMatch(/\/sounds\/timer-alert\.mp3$/);
  await page.clock.setFixedTime(new Date('2026-10-18T10:55:15Z'));
  await expect.poll(async () => (await calls()).length).toBe(1);
  const sections = ['Contadores', 'Personajes', 'Fuentes', 'Ajustes', 'Temporizadores', 'Resumen'];
  for (const [index, section] of sections.entries()) {
    await page.getByRole('button', { name: section, exact: true }).first().click();
    await page.clock.setFixedTime(new Date(Date.parse('2026-10-18T10:55:15Z') + (index + 1) * 3_600_000));
    await expect.poll(async () => (await calls()).length).toBe(index + 2);
  }
  await page.getByRole('button', { name: 'Temporizadores', exact: true }).first().click();
  await page.getByRole('switch', { name: 'Aviso sonoro para Shugo Festival, 5 minutos antes', exact: true }).click();
  await page.getByRole('button', { name: 'Resumen', exact: true }).first().click();
  await page.clock.setFixedTime(new Date('2026-10-18T17:55:15Z'));
  await page.waitForTimeout(1200);
  await expect.poll(async () => (await calls()).length).toBe(7);
  await expect(page.locator('.alarm-timer')).toHaveCount(0);
});

test('enabled Gartua alerts use the selected server feed on Overview', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('aion2-gartua-server', 'eu-siel');
    localStorage.setItem('aion2-timer-sound-alerts', JSON.stringify({ 'gartua-eternal': true }));
  });
  await page.route('**/fbapi/api/fieldboss.php?**', route => route.fulfill({
    json: { ok: true, kills: { elyos24: { st: 'dead', ns: Math.floor(Date.now() / 1000) + 1200, est: true }, asmo24: { st: 'up' } } },
  }));
  await page.goto('/');
  const row = page.locator('[data-alarm-id="gartua-eternal"]');
  await expect(row.getByRole('heading', { name: 'Gartua Eterno' })).toBeVisible();
  await expect(row.getByRole('timer')).toBeVisible();
  await expect(row.locator('time')).toContainText('≈');
  await expect(page.locator('[data-alarm-id="gartua-immortal"]')).toHaveCount(0);
});
