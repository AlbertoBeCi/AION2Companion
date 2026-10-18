import { expect, test } from '@playwright/test';

test('mobile dashboard and sources fit without horizontal page overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByText('Tu progreso, a tu manera.')).toBeVisible();
  const dashboardWidths = await page.evaluate(() => ({ document: document.documentElement.scrollWidth, viewport: window.innerWidth }));
  expect(dashboardWidths.document).toBeLessThanOrEqual(dashboardWidths.viewport);

  const sourcesButton = page.getByRole('button', { name: 'Fuentes' }).last();
  await expect(sourcesButton).toBeVisible();
  await sourcesButton.click();
  await expect(page.getByRole('heading', { name: 'Procedencia y reglas' })).toBeVisible();
  const sourcesWidths = await page.evaluate(() => ({ document: document.documentElement.scrollWidth, viewport: window.innerWidth }));
  expect(sourcesWidths.document).toBeLessThanOrEqual(sourcesWidths.viewport);
});
