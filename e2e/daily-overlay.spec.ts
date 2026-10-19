import { expect, test } from '@playwright/test';

test('native Document PiP opens and closes from the daily button', async ({ page }) => {
  await page.goto('/');
  const supported = await page.evaluate(() => 'documentPictureInPicture' in window);
  test.skip(!supported, 'Document PiP is unavailable in this browser');
  await page.getByRole('button', { name: 'Diarias flotantes', exact: true }).click();
  const readFloating = () => page.evaluate(() => {
    const api = (window as Window & { documentPictureInPicture: { window?: Window } }).documentPictureInPicture;
    return api.window?.document.querySelector('.daily-overlay h1')?.textContent ?? null;
  });
  await expect.poll(readFloating).toContain('Diarias');
  await page.evaluate(() => {
    const api = (window as Window & { documentPictureInPicture: { window?: Window } }).documentPictureInPicture;
    api.window?.close();
  });
  await expect(page.getByRole('button', { name: 'Diarias flotantes', exact: true })).toBeVisible();
});

test('floating daily stays synchronized across navigation, characters and appearance changes', async ({ page, context }) => {
  await page.goto('/');
  // Use a regular secondary window to test portal interactions in headless Chromium.
  // Production uses the browser's native always-on-top Document PiP window.
  await page.evaluate(() => {
    Object.defineProperty(window, 'documentPictureInPicture', { configurable: true, value: {
      requestWindow: async () => window.open('about:blank', '', 'width=440,height=560'),
    } });
  });
  const opened = context.waitForEvent('page');
  await page.getByRole('button', { name: 'Diarias flotantes', exact: true }).click();
  const floating = await opened;
  await floating.setViewportSize({ width: 440, height: 560 });
  await expect(floating.getByRole('heading', { name: 'Diarias' })).toBeVisible();
  await expect(floating.getByRole('heading', { level: 3 })).toHaveCount(6);
  const mainDuty = page.locator('.companion-row').filter({ hasText: 'Misiones de Duty' });
  const floatingDuty = floating.locator('.companion-row').filter({ hasText: 'Misiones de Duty' });
  await floatingDuty.getByRole('button', { name: 'Aumentar progreso Misiones de Duty' }).click();
  await expect(mainDuty.locator('.row-progress>b')).toHaveText('1/5');
  await mainDuty.getByRole('button', { name: 'Aumentar progreso Misiones de Duty' }).click();
  await expect(floatingDuty.locator('.row-progress>b')).toHaveText('2/5');

  await page.getByRole('button', { name: 'Personajes', exact: true }).first().click();
  await page.getByRole('button', { name: 'Añadir personaje' }).first().click();
  await page.getByRole('textbox').nth(0).fill('Alt');
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(floating.getByRole('combobox')).toHaveText('Alt');
  await expect(floatingDuty.locator('.row-progress>b')).toHaveText('0/5');
  await page.getByRole('button', { name: 'Añadir personaje' }).first().click();
  await page.getByRole('textbox').nth(0).fill('Main');
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await floating.getByRole('combobox').selectOption({ label: 'Alt' });
  await floatingDuty.getByRole('checkbox').click();
  await expect(floatingDuty.locator('.row-progress>b')).toHaveText('5/5');
  await page.getByRole('button', { name: 'Resumen', exact: true }).first().click();
  await expect(mainDuty.locator('.row-progress>b')).toHaveText('5/5');
  await expect(page.locator('.character-select .neo-select-value')).toContainText('Alt');

  await page.getByRole('button', { name: /Idioma: English/ }).click();
  await expect(floating.getByRole('heading', { name: 'Daily', exact: false })).toBeVisible();
  await expect(floating.locator('html')).toHaveAttribute('lang', 'en');
  const themeBefore = await floating.locator('html').getAttribute('data-theme');
  await page.locator('.top-actions').getByRole('button', { name: /Switch to .* mode/i }).click();
  await expect(floating.locator('html')).not.toHaveAttribute('data-theme', themeBefore!);
  await floating.locator('.widget-appearance summary').click();
  await floating.getByRole('combobox', { name: 'Theme', exact: true }).selectOption('game');
  await expect(floating.locator('.daily-overlay')).toHaveAttribute('data-widget-theme', 'game');
  await expect(floating.getByRole('heading', { name: 'Duty Missions', exact: true })).toHaveCSS('color', 'rgb(222, 216, 186)');
  await expect(floating.getByRole('progressbar', { name: 'Daily', exact: true })).toHaveAttribute('aria-valuenow', '1');
  await floating.locator('.widget-appearance summary').click();
  await expect(page.locator('.daily-hud-progress')).toHaveCount(0);
  for (const width of [280, 440, 650]) {
    await floating.setViewportSize({ width, height: 560 });
    expect(await floating.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    if (width === 440) expect((await floating.locator('.companion-row').first().boundingBox())!.height).toBeLessThan(80);
    await floating.locator('.widget-appearance summary').click();
    await expect(floating.locator('.widget-appearance-panel')).toBeInViewport();
    await floating.locator('.widget-appearance summary').click();
    await floating.screenshot({ path: `test-results/daily-overlay-${width}.png`, fullPage: true });
  }
  await floating.getByRole('button', { name: 'Close floating daily' }).click();
  await expect(page.getByRole('button', { name: 'Floating daily', exact: true })).toBeVisible();
  const reopened = context.waitForEvent('page');
  await page.getByRole('button', { name: 'Floating daily', exact: true }).click();
  const restored = await reopened;
  await expect(restored.getByRole('heading', { name: 'Duty Missions' })).toBeVisible();
  await expect(restored.locator('.daily-overlay')).toHaveAttribute('data-widget-theme', 'game');
  await restored.locator('.widget-appearance summary').click();
  await restored.getByRole('combobox', { name: 'Theme', exact: true }).selectOption('companion');
  await expect(restored.locator('.daily-overlay')).toHaveAttribute('data-widget-theme', 'companion');
  await expect(restored.locator('.row-hud-progress')).toHaveCount(0);
});

test('unsupported browsers and denied opening show an actionable message', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => Object.defineProperty(window, 'documentPictureInPicture', { configurable: true, value: undefined }));
  await page.getByRole('button', { name: 'Diarias flotantes', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Este navegador no admite');
  await page.evaluate(() => Object.defineProperty(window, 'documentPictureInPicture', { configurable: true, value: {
    requestWindow: async () => { throw new Error('Denied'); },
  } }));
  await page.getByRole('button', { name: 'Diarias flotantes', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('No se pudo abrir');
  await expect(page.getByRole('button', { name: 'Diarias flotantes', exact: true })).toBeEnabled();
});
