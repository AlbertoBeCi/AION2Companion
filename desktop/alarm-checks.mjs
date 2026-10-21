import { expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export async function checkAlarmWidget({ app, main, daily, output, errors }) {
  const nativeState = kind => app.evaluate(({ BrowserWindow }, kind) => {
    const win = BrowserWindow.getAllWindows().find(win => win.webContents.getURL().includes(`widget=${kind}`));
    return win ? { opacity: win.getOpacity(), bounds: win.getBounds(), alwaysOnTop: win.isAlwaysOnTop() } : null;
  }, kind);
  const watchAudio = () => {
    window.alarmAudioCalls = [];
    HTMLMediaElement.prototype.play = function () { window.alarmAudioCalls.push(this.src); return Promise.resolve(); };
    HTMLMediaElement.prototype.load = function () {};
  };
  await main.evaluate(watchAudio);
  await app.context().addInitScript(watchAudio);
  // Stable schedule and lead window make countdown/progress/audio assertions deterministic.
  await main.clock.setFixedTime(new Date('2026-10-18T10:30:00Z'));
  await daily.locator('.widget-appearance summary').click(); // Close the daily settings left open by the other checks.
  const opened = app.waitForEvent('window');
  await main.getByRole('button', { name: 'Alarmas flotantes', exact: true }).click();
  let alarms = await opened;
  alarms.on('pageerror', error => errors.push(error.message));
  await alarms.clock.setFixedTime(new Date('2026-10-18T10:30:00Z'));
  await expect(alarms.getByRole('heading', { name: 'Mis alarmas', exact: true })).toBeVisible();
  await expect(alarms.getByText('No tienes alarmas activadas.')).toBeVisible();
  expect((await nativeState('alarms')).alwaysOnTop).toBe(true);
  expect((await nativeState('daily')).alwaysOnTop).toBe(true);
  await expect(alarms.locator('body')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  expect(await alarms.locator('.daily-overlay-header').evaluate(el => getComputedStyle(el).getPropertyValue('-webkit-app-region'))).toBe('drag');
  await expect(main.getByRole('button', { name: 'Mostrar alarmas flotantes', exact: true })).toBeVisible();
  await main.getByRole('button', { name: 'Mostrar alarmas flotantes', exact: true }).click();
  expect(await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().length)).toBe(3);

  await main.getByRole('button', { name: 'Temporizadores', exact: true }).first().click();
  const shugo = main.getByRole('switch', { name: 'Aviso sonoro para Shugo Festival, 5 minutos antes', exact: true });
  const rift = main.getByRole('switch', { name: 'Aviso sonoro para Spacetime Rift, 5 minutos antes', exact: true });
  await shugo.click();
  await rift.click();
  await expect(alarms.locator('.alarm-timer')).toHaveCount(2);
  await rift.click();
  await expect(alarms.locator('.alarm-timer')).toHaveCount(1);
  await expect(alarms.locator('.alarm-timer h3')).toHaveText('Shugo Festival');
  await expect(alarms.locator('.row-check, .row-hud-progress, .alarm-count, .alarm-timer h3 svg')).toHaveCount(0);
  const progress = alarms.getByRole('progressbar', { name: 'Shugo Festival · Tiempo transcurrido', exact: true });
  await expect(progress).toHaveAttribute('aria-valuenow', '40');
  const countdown = alarms.getByRole('timer');
  await expect(countdown).toHaveText('00:30:00');
  await alarms.clock.setFixedTime(new Date('2026-10-18T10:45:00Z'));
  await expect(progress).toHaveAttribute('aria-valuenow', '70');
  await expect(countdown).toHaveText('00:15:00');
  await alarms.clock.setFixedTime(new Date('2026-10-18T11:05:00Z'));
  await expect(alarms.locator('.alarm-timer p')).toHaveText('Termina en');
  await expect(countdown).toHaveText('00:05:00');
  await expect(progress).toHaveAttribute('aria-valuenow', '50');

  await alarms.locator('.widget-appearance summary').click();
  await alarms.getByRole('slider', { name: 'Opacidad' }).fill('70');
  await alarms.getByRole('combobox', { name: 'Tema', exact: true }).selectOption('game');
  await expect(alarms.locator('.alarm-overlay')).toHaveAttribute('data-widget-theme', 'game');
  await expect(alarms.locator('.alarm-timer h3')).toHaveCSS('color', 'rgb(244, 204, 98)');
  await expect.poll(async () => (await nativeState('alarms')).opacity).toBeCloseTo(.7, 1);
  expect((await nativeState('daily')).opacity).toBeCloseTo(1, 1);
  await expect(daily.locator('.daily-overlay')).toHaveAttribute('data-widget-theme', 'companion');
  await expect(alarms.locator('.widget-appearance-panel')).toBeInViewport();
  await alarms.screenshot({ path: path.join(output, 'alarms-game-settings.png'), omitBackground: true });
  await alarms.locator('.widget-appearance summary').click();
  const handle = alarms.getByRole('button', { name: 'Cambiar tamaño de las alarmas' });
  await handle.focus();
  const before = (await nativeState('alarms')).bounds.width;
  await handle.press('ArrowRight');
  await expect.poll(async () => (await nativeState('alarms')).bounds.width).toBe(before + 20);
  for (const theme of ['companion', 'game']) {
    await alarms.locator('.widget-appearance summary').click();
    await alarms.getByRole('combobox', { name: 'Tema', exact: true }).selectOption(theme);
    await alarms.locator('.widget-appearance summary').click();
    if (theme === 'companion') {
      const textColor = await alarms.locator('.alarm-panel').evaluate(el => getComputedStyle(el).color);
      await expect(alarms.locator('.alarm-timer h3')).toHaveCSS('color', textColor);
      await expect(alarms.getByRole('timer')).toHaveCSS('color', textColor);
    }
    for (const width of [300, 440, 650]) {
      await alarms.evaluate(width => window.aionDesktop.resizeAlarms(width, 480), width);
      await expect.poll(async () => (await nativeState('alarms')).bounds.width).toBe(width);
      expect(await alarms.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await expect(alarms.getByRole('button', { name: 'Cerrar alarmas flotantes' })).toBeInViewport();
      await alarms.locator('.widget-appearance summary').click();
      await expect(alarms.locator('.widget-appearance-panel')).toBeInViewport();
      await alarms.locator('.widget-appearance summary').click();
      if (width === 440) await alarms.screenshot({ path: path.join(output, `alarms-${theme}.png`), omitBackground: true });
    }
  }
  await alarms.evaluate(() => window.aionDesktop.resizeAlarms(400, 460));
  await expect.poll(async () => (await nativeState('alarms')).bounds.width).toBe(400);
  const savedBounds = (await nativeState('alarms')).bounds;
  await main.getByRole('button', { name: 'Resumen', exact: true }).first().click();
  await main.evaluate(() => window.aionDesktop.minimizeMain());
  await expect(alarms.getByRole('heading', { name: 'Mis alarmas', exact: true })).toBeVisible();
  await alarms.getByRole('button', { name: 'Mostrar la app principal' }).click();

  // Closing either widget leaves the other open; persisted appearance/bounds belong to each one.
  await daily.getByRole('button', { name: 'Cerrar diarias flotantes' }).click();
  expect(await nativeState('daily')).toBeNull();
  expect(await nativeState('alarms')).not.toBeNull();
  const dailyOpened = app.waitForEvent('window');
  await main.getByRole('button', { name: 'Diarias flotantes', exact: true }).click();
  daily = await dailyOpened;
  await expect(daily.locator('.daily-overlay')).toHaveAttribute('data-widget-theme', 'companion');
  await alarms.getByRole('button', { name: 'Cerrar alarmas flotantes' }).click();
  expect(await nativeState('daily')).not.toBeNull();
  expect(await nativeState('alarms')).toBeNull();
  await expect(main.getByRole('button', { name: 'Alarmas flotantes', exact: true })).toBeVisible();
  const reopened = app.waitForEvent('window');
  await main.getByRole('button', { name: 'Alarmas flotantes', exact: true }).click();
  alarms = await reopened;
  alarms.on('pageerror', error => errors.push(error.message));
  await alarms.clock.setFixedTime(new Date('2026-10-18T10:55:00Z'));
  await expect(alarms.locator('.alarm-timer')).toHaveCount(1);
  await expect(alarms.locator('.alarm-overlay')).toHaveAttribute('data-widget-theme', 'game');
  await expect.poll(async () => (await nativeState('alarms')).opacity).toBeCloseTo(.7, 1);
  expect((await nativeState('alarms')).bounds).toEqual(savedBounds);
  const saved = JSON.parse(await readFile(path.join(output, 'profile', 'alarms-window.json'), 'utf8'));
  expect(saved).toEqual(savedBounds);
  // Only the main app owns audio, even when both windows enter the same alert window.
  await main.clock.setFixedTime(new Date('2026-10-18T10:55:00Z'));
  await expect.poll(() => main.evaluate(() => window.alarmAudioCalls.length)).toBe(1);
  await expect(alarms.getByRole('timer')).toHaveText('00:05:00');
  expect(await alarms.evaluate(() => window.alarmAudioCalls)).toEqual([]);
  await main.getByRole('button', { name: 'Temporizadores', exact: true }).first().click();
  await shugo.click();
  await expect(alarms.locator('.alarm-timer')).toHaveCount(0);
  await expect(alarms.getByText('No tienes alarmas activadas.')).toBeVisible();
}
