import { _electron as electron, expect } from '@playwright/test';
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'test-results', `desktop-${Date.now()}`);
await mkdir(output, { recursive: true });
const env = { ...process.env, AION2_DESKTOP_TEST_DATA: path.join(output, 'profile') };
delete env.ELECTRON_RUN_AS_NODE;
const app = await electron.launch({
  ...(process.env.AION2_DESKTOP_EXECUTABLE ? { executablePath: process.env.AION2_DESKTOP_EXECUTABLE, args: [] } : { args: [root] }),
  cwd: root, env, timeout: 30_000,
});
const childProcess = app.process();
try {
  const main = await app.firstWindow();
  const errors = [];
  main.on('pageerror', (error) => errors.push(error.message));
  await expect(main.getByRole('button', { name: 'Diarias flotantes', exact: true })).toBeVisible();
  await expect(main.locator('.desktop-titlebar')).toBeVisible();
  expect(await main.locator('.desktop-titlebar').evaluate((element) => getComputedStyle(element).getPropertyValue('-webkit-app-region'))).toBe('drag');
  expect(await main.getByRole('button', { name: 'Cerrar la app', exact: true }).evaluate((element) => getComputedStyle(element).getPropertyValue('-webkit-app-region'))).toBe('no-drag');
  expect(await main.locator('html').evaluate((element) => getComputedStyle(element).scrollbarWidth)).toBe('none');
  expect(await main.locator('.desktop-main-content').evaluate((element) => getComputedStyle(element).scrollbarWidth)).toBe('none');
  await main.getByRole('button', { name: 'Maximizar la app', exact: true }).click();
  await expect(main.getByRole('button', { name: 'Restaurar tamaño de la app', exact: true })).toBeVisible();
  await main.getByRole('button', { name: 'Restaurar tamaño de la app', exact: true }).click();
  await expect(main.getByRole('button', { name: 'Maximizar la app', exact: true })).toBeVisible();
  const appResize = main.getByRole('button', { name: 'Cambiar tamaño de la app', exact: true });
  const mainWidth = await main.evaluate(() => window.outerWidth);
  await appResize.focus();
  await appResize.press('ArrowLeft');
  await expect.poll(() => main.evaluate(() => window.outerWidth)).toBe(Math.max(800, mainWidth - 20));
  await main.getByRole('button', { name: 'Ajustes', exact: true }).first().click();
  const scrolling = main.locator('.desktop-main-content');
  await scrolling.evaluate((element) => element.scrollBy(0, 500));
  await expect.poll(() => scrolling.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  await expect(main.locator('.desktop-titlebar')).toBeInViewport();
  await main.getByRole('button', { name: 'Resumen', exact: true }).first().click();
  await expect.poll(() => scrolling.evaluate((element) => element.scrollTop)).toBe(0);
  await expect(main.locator('.companion-overview')).toBeVisible();
  await expect(main.locator('#page-content')).toHaveCSS('opacity', '1');
  await main.mouse.move(500, 300);
  await main.screenshot({ path: path.join(output, 'desktop-app.png') });
  expect(await main.evaluate(() => [typeof window.require, typeof window.process])).toEqual(['undefined', 'undefined']);
  const opened = app.waitForEvent('window');
  await main.getByRole('button', { name: 'Diarias flotantes', exact: true }).click();
  const widget = await opened;
  widget.on('pageerror', (error) => errors.push(error.message));
  await expect(widget.getByRole('heading', { name: 'Diarias', exact: false })).toBeVisible();
  await expect(widget.locator('.companion-row')).toHaveCount(6);
  await expect(widget.locator('.sidebar, .app-footer')).toHaveCount(0);
  expect(await widget.locator('.daily-overlay-header').evaluate((element) => getComputedStyle(element).getPropertyValue('-webkit-app-region'))).toBe('drag');
  expect(await widget.getByRole('button', { name: 'Cerrar diarias flotantes' }).evaluate((element) => getComputedStyle(element).getPropertyValue('-webkit-app-region'))).toBe('no-drag');
  await expect.poll(() => app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().filter((win) => win.webContents.getURL().includes('widget=daily')).map((win) => win.isAlwaysOnTop()))).toEqual([true]);
  expect(await widget.locator('html').evaluate((element) => getComputedStyle(element).scrollbarWidth)).toBe('none');
  await expect.poll(() => widget.locator('body').evaluate((element) => getComputedStyle(element).backgroundColor)).toBe('rgba(0, 0, 0, 0)');
  expect(await widget.locator('.companion-row').first().evaluate((element) => getComputedStyle(element).backgroundColor)).toBe('rgba(0, 0, 0, 0)');
  await widget.locator('.widget-appearance summary').click();
  await widget.getByRole('slider', { name: 'Opacidad' }).fill('55');
  await expect.poll(() => app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().find((win) => win.webContents.getURL().includes('widget=daily')).getOpacity())).toBeCloseTo(0.55, 1);
  await widget.getByRole('combobox', { name: 'Tema', exact: true }).selectOption('game');
  await expect(widget.locator('.daily-overlay')).toHaveAttribute('data-widget-theme', 'game');
  await expect(widget.locator('.daily-overlay h3').first()).toHaveCSS('color', 'rgb(244, 204, 98)');
  await expect(widget.locator('body')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await expect(widget.locator('.widget-appearance-panel')).toBeInViewport();
  await widget.screenshot({ path: path.join(output, 'daily-game-settings.png'), omitBackground: true });
  await widget.locator('.widget-appearance summary').click();

  const duty = (page) => page.locator('.companion-row').filter({ has: page.getByRole('heading', { name: 'Misiones de Duty', exact: true }) });
  await duty(widget).getByRole('button', { name: 'Aumentar progreso Misiones de Duty' }).click();
  await expect(duty(main).locator('.row-progress>b')).toHaveText('1/5');
  await expect(duty(widget).locator('.row-hud-progress>span')).toHaveAttribute('style', 'width: 20%;');
  await duty(main).getByRole('button', { name: 'Aumentar progreso Misiones de Duty' }).click();
  await expect(duty(widget).locator('.row-progress>b')).toHaveText('2/5');
  await main.getByRole('button', { name: 'Personajes', exact: true }).first().click();
  for (const name of ['Alt', 'Main']) {
    await main.getByRole('button', { name: 'Añadir personaje' }).first().click();
    await main.getByRole('textbox').nth(0).fill(name);
    await main.getByRole('button', { name: 'Guardar', exact: true }).click();
  }
  await widget.getByRole('combobox').selectOption({ label: 'Main' });
  await expect(main.locator('.character-select .neo-select-value')).toContainText('Main');
  await expect(duty(widget).locator('.row-progress>b')).toHaveText('0/5');
  await duty(widget).getByRole('checkbox').click();
  await main.getByRole('button', { name: 'Resumen', exact: true }).first().click();
  await expect(duty(main).locator('.row-progress>b')).toHaveText('5/5');
  await main.locator('.theme-toggle').click();
  await expect(widget.locator('html')).toHaveAttribute('data-theme', await main.locator('html').getAttribute('data-theme'));
  await expect(widget.locator('.daily-overlay h3').first()).toHaveCSS('color', 'rgb(244, 204, 98)');

  // Minimize the full app and keep using the independent always-on-top widget.
  await widget.screenshot({ path: path.join(output, 'daily-game-progress.png'), omitBackground: true });
  await main.getByRole('button', { name: 'Minimizar la app', exact: true }).click();
  await duty(widget).getByRole('button', { name: 'Reinicio Misiones de Duty' }).click();
  await expect(duty(widget).locator('.row-progress>b')).toHaveText('0/5');
  await widget.getByRole('button', { name: 'Mostrar la app principal' }).click();
  await expect.poll(() => app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().find((win) => !win.webContents.getURL().includes('widget=daily')).isMinimized())).toBe(false);

  const resize = widget.getByRole('button', { name: 'Cambiar tamaño de las diarias' });
  await resize.focus();
  const widthBefore = await widget.evaluate(() => window.outerWidth);
  await resize.press('ArrowRight');
  await expect.poll(() => widget.evaluate(() => window.outerWidth)).toBe(widthBefore + 20);
  for (const width of [320, 440, 650]) {
    await widget.evaluate((value) => window.aionDesktop.resizeDaily(value, 600), width);
    await expect.poll(() => widget.evaluate(() => window.outerWidth)).toBe(width);
    await expect.poll(() => widget.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await widget.locator('.widget-appearance summary').click();
    await expect(widget.locator('.widget-appearance-panel')).toBeInViewport();
    await widget.locator('.widget-appearance summary').click();
  }
  await widget.evaluate(() => window.aionDesktop.resizeDaily(440, 600));
  await expect.poll(() => widget.evaluate(() => window.outerWidth)).toBe(440);
  await widget.screenshot({ path: path.join(output, 'daily-widget.png'), omitBackground: true });

  // No arbitrary local-file access or Node APIs from the renderer.
  const traversal = await main.evaluate(async () => (await fetch('aion2://app/%2e%2e%5cpackage.json')).status);
  expect(traversal).toBe(404);
  await widget.evaluate(() => window.aionDesktop.resizeDaily(420, 580));
  await expect.poll(() => widget.evaluate(() => window.outerWidth)).toBe(420);
  await widget.getByRole('button', { name: 'Cerrar diarias flotantes' }).click();
  await expect(main.getByRole('button', { name: 'Diarias flotantes', exact: true })).toBeVisible();
  const reopened = app.waitForEvent('window');
  await main.getByRole('button', { name: 'Diarias flotantes', exact: true }).click();
  const restored = await reopened;
  await expect(restored.locator('.daily-overlay')).toHaveAttribute('data-widget-theme', 'game');
  await expect(restored.getByRole('combobox')).toHaveValue(await widgetValue(main));
  await expect.poll(() => app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().find((win) => win.webContents.getURL().includes('widget=daily')).getOpacity())).toBeCloseTo(0.55, 1);
  await expect.poll(() => restored.evaluate(() => window.outerWidth)).toBe(420);
  const bounds = JSON.parse(await readFile(path.join(output, 'profile', 'daily-window.json'), 'utf8'));
  expect(bounds.width).toBe(420);
  await restored.locator('.widget-appearance summary').click();
  await restored.getByRole('combobox', { name: 'Tema', exact: true }).selectOption('companion');
  await expect(restored.locator('.daily-overlay')).toHaveAttribute('data-widget-theme', 'companion');
  expect(await restored.locator('.companion-row').first().evaluate((element) => getComputedStyle(element).backgroundColor)).toBe('rgba(0, 0, 0, 0)');
  await restored.getByRole('button', { name: 'Restaurar al 100%' }).click();
  await expect.poll(() => app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().find((win) => win.webContents.getURL().includes('widget=daily')).getOpacity())).toBeCloseTo(1, 1);
  expect(errors).toEqual([]);
  const applicationClosed = app.waitForEvent('close');
  await main.getByRole('button', { name: 'Cerrar la app', exact: true }).click();
  await applicationClosed;
  console.log(`Desktop checks passed. Preview: ${path.join(output, 'daily-widget.png')}`);
} finally {
  if (childProcess.exitCode === null) await app.close();
}

async function widgetValue(page) {
  return page.evaluate(() => localStorage.getItem('aion2-desktop-active-character'));
}
