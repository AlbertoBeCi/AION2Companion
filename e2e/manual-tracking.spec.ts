import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('manual character tracker persists through reload and offers a backup', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Empieza el día' })).toBeVisible();

  await page.getByRole('button', { name: 'Personajes' }).first().click();
  await page.getByRole('button', { name: 'Añadir personaje' }).first().click();
  await page.getByRole('textbox').nth(0).fill('Prueba local');
  await page.getByRole('textbox').nth(1).fill('Test');
  await page.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.locator('.character-select .neo-select-value')).toHaveText('Prueba local · Test');

  await page.getByRole('button', { name: 'Crear contador' }).first().click();
  await page.getByRole('textbox').nth(0).fill('Tarea de prueba');
  await page.getByRole('textbox').nth(2).fill('Manual');
  await page.getByRole('spinbutton').fill('3');
  await page.getByRole('button', { name: 'Guardar' }).click();
  await page.getByRole('button', { name: 'Aumentar progreso Tarea de prueba' }).click();
  await expect(page.getByText('1').first()).toBeVisible();

  await page.reload();
  await expect(page.getByText('Tarea de prueba')).toBeVisible();
  await expect(page.getByText('1 / 3')).toBeVisible();
  await page.getByRole('button', { name: 'Ajustes' }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar copia' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/aion2-companion-.*\.json/);
  const filePath = await download.path();
  expect(filePath).toBeTruthy();
  const backup = JSON.parse(await readFile(filePath!, 'utf8')) as { schemaVersion: number; characters: unknown[]; trackers: Array<{ name: string; provenance: string }>; progress: Array<{ value: number }> };
  expect(backup.schemaVersion).toBe(1);
  expect(backup.characters).toHaveLength(1);
  expect(backup.trackers.some((tracker) => tracker.name === 'Tarea de prueba' && tracker.provenance === 'user-defined')).toBe(true);
  expect(backup.trackers.some((tracker) => tracker.provenance === 'community')).toBe(true);
  expect(backup.progress[0]?.value).toBe(1);

  await page.getByLabel('Al importar').click();
  await page.getByRole('option', { name: 'Reemplazar los datos locales' }).click();
  await page.locator('input[type="file"]').setInputFiles(filePath!);
  await expect(page.getByRole('status')).toHaveText('Copia importada');
  await page.reload();
  await expect(page.getByText('Tarea de prueba')).toBeVisible();
  await expect(page.getByText('1 / 3')).toBeVisible();
});

test('counters page starts with separate Global daily and weekly checklists', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Contadores' }).first().click();
  await expect(page.getByRole('tab', { name: /Diarias/ })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('heading', { name: 'Misiones de Duty' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Nightmare' })).toBeVisible();
  const conquest = page.locator('.tracker-card').filter({ has: page.getByRole('heading', { name: 'Conquista', exact: true }) });
  await expect(conquest).toHaveCount(1);
  await expect(conquest.locator('.progress-label strong')).toHaveText('0 / 2');
  const dailyTab = page.getByRole('tab', { name: /Diarias/ });
  await dailyTab.focus();
  await dailyTab.press('ArrowRight');
  await expect(page.getByRole('tab', { name: /Semanales/ })).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('tab', { name: /Semanales/ }).click();
  await expect(page.getByRole('heading', { name: 'Ascension Trial' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Krao Cave: Exploration' })).toBeVisible();
  await expect(page.getByText('Referencia comunitaria', { exact: false })).toBeVisible();
});

test('preloaded counters work and persist without a character or server', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Contadores' }).first().click();
  await expect(page.getByText('Puedes llevar el progreso en este dispositivo', { exact: false })).toBeVisible();
  const dutyTracker = page.locator('.tracker-card').filter({ has: page.getByRole('heading', { name: 'Misiones de Duty' }) });
  await dutyTracker.getByRole('button', { name: 'Aumentar progreso Misiones de Duty' }).click();
  await expect(dutyTracker.getByText('1 / 5')).toBeVisible();
  await page.reload();
  const restoredDutyTracker = page.locator('.tracker-card').filter({ has: page.getByRole('heading', { name: 'Misiones de Duty' }) });
  await expect(restoredDutyTracker.getByText('1 / 5')).toBeVisible();
});
