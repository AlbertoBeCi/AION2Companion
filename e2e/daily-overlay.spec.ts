import { expect, test } from '@playwright/test';

test('completed floating missions wait for audio, then fade and close the gap smoothly', async ({ page, context }) => {
  await page.addInitScript(() => {
    const OriginalAudio = window.Audio;
    window.Audio = function (source?: string) {
      const audio = new OriginalAudio(source);
      if (source === '/sounds/counter-complete.mp3') {
        audio.play = async () => {};
        (window as Window & { completionTestAudio?: HTMLAudioElement }).completionTestAudio = audio;
      }
      return audio;
    } as typeof Audio;
  });
  await page.clock.install({ time: new Date('2026-10-19T12:00:00Z') });
  await page.clock.pauseAt(new Date('2026-10-19T12:00:01Z'));
  await page.goto('/');
  await page.clock.runFor(1000);
  await page.evaluate(() => Object.defineProperty(window, 'documentPictureInPicture', { configurable: true, value: {
    requestWindow: async () => window.open('about:blank', '', 'width=440,height=560'),
  } }));
  const opened = context.waitForEvent('page');
  await page.getByRole('button', { name: 'Diarias flotantes', exact: true }).click();
  const floating = await opened;
  const first = floating.locator('.companion-row').filter({ hasText: 'Conquista' });
  const next = floating.locator('.companion-row').filter({ has: floating.getByRole('heading', { name: 'Nightmare', exact: true }) });
  const originalTop = (await first.boundingBox())!.y;
  const nextTop = (await next.boundingBox())!.y;
  await first.getByRole('checkbox').click();
  await expect(first.locator('.tracker-celebration')).toBeVisible();
  await page.clock.runFor(5000);
  await expect(first).toBeVisible();
  await expect(first.locator('..')).toHaveAttribute('data-completion-phase', 'waiting');
  await expect(first.locator('.tracker-celebration')).toHaveCount(0);
  await page.evaluate(() => (window as Window & { completionTestAudio: HTMLAudioElement }).completionTestAudio.dispatchEvent(new Event('ended')));
  await page.clock.runFor(1999);
  await expect(first).toBeVisible();
  await expect(first.locator('..')).toHaveAttribute('data-completion-phase', 'waiting');
  await expect(first.locator('..')).toHaveCSS('opacity', '1');
  // Let the browser's compositor animate in real time after the exact timer check.
  await page.clock.resume();
  await expect.poll(() => first.locator('..').getAttribute('data-completion-phase'), { intervals: [25] }).toBe('leaving');
  await expect.poll(async () => (await next.boundingBox())!.y, { intervals: [25] }).toBeLessThan(nextTop - 1);
  const fading = await first.locator('..').evaluate((element) => Number(getComputedStyle(element).opacity));
  expect(fading).toBeGreaterThan(0);
  expect(fading).toBeLessThan(1);
  const movingTop = (await next.boundingBox())!.y;
  expect(movingTop).toBeLessThan(nextTop);
  expect(movingTop).toBeGreaterThan(originalTop);
  await floating.screenshot({ path: 'test-results/daily-fading.png' });
  await expect(first).toHaveCount(0);
  expect((await next.boundingBox())!.y).toBeCloseTo(originalTop, 0);
  const mainFirst = page.locator('.companion-row').filter({ has: page.getByRole('heading', { name: 'Conquista', exact: true }) });
  await expect(mainFirst.locator('.row-progress>b')).toHaveText('2/2');
  await mainFirst.getByRole('button', { name: 'Reinicio Conquista', exact: true }).click();
  await expect(first.getByRole('checkbox')).toHaveAttribute('aria-checked', 'false');
  // A reset during the two-second pause cancels the pending removal.
  await first.getByRole('checkbox').click();
  await page.evaluate(() => (window as Window & { completionTestAudio: HTMLAudioElement }).completionTestAudio.dispatchEvent(new Event('ended')));
  await page.clock.runFor(1000);
  await mainFirst.getByRole('button', { name: 'Reinicio Conquista', exact: true }).click();
  await expect(first.getByRole('checkbox')).toHaveAttribute('aria-checked', 'false');
  await page.clock.runFor(5000);
  await expect(first.getByRole('checkbox')).toHaveAttribute('aria-checked', 'false');
});

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
  await expect(floating.getByRole('heading', { level: 3 }).first()).toHaveCSS('color', 'rgb(244, 204, 98)');
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
  await expect(restored.getByRole('heading', { name: 'Duty Missions' })).toHaveCount(0);
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
