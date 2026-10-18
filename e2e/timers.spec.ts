import { expect, test } from '@playwright/test';

test('Global timers are preloaded and timezone choice persists', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Temporizadores' }).first().click();
  await expect(page.getByRole('heading', { name: 'Jefes, eventos y reinicios' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Watcher Kaira' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Spacetime Rift' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Executor Argo' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Executor Kaira' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Executor Tamasa' })).toBeVisible();
  await expect(page.getByText('Fuente comunitaria.', { exact: false })).toBeVisible();
  await expect(page.getByText('Próximo reinicio:', { exact: false })).toBeVisible();

  await page.getByLabel('Zona horaria del servidor').click();
  await page.getByRole('option', { name: 'NA East · New York' }).click();
  await page.reload();
  await page.getByRole('button', { name: 'Temporizadores' }).first().click();
  await expect(page.getByLabel('Zona horaria del servidor')).toHaveText('NA East · New York');
  await expect(page.getByRole('heading', { name: 'Watcher Kaira' })).toBeVisible();
});

test('mobile timer page fits the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Temporizadores' }).last().click();
  await expect(page.getByRole('heading', { name: 'Jefes, eventos y reinicios' })).toBeVisible();
  const widths = await page.evaluate(() => ({ document: document.documentElement.scrollWidth, viewport: window.innerWidth }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport);
});
