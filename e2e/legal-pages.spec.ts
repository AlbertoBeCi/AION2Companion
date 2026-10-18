import { expect, test } from '@playwright/test';

test('legal pages are reachable by footer links and support Spanish and English', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/#privacy');
  await expect(page.getByRole('heading', { name: 'Privacidad y almacenamiento' })).toBeVisible();
  await expect(page.getByText('Netlify puede recibir metadatos de solicitud', { exact: false })).toBeVisible();
  await expect(page.locator('.mobile-nav .mobile-support-link')).toBeVisible();

  await page.getByRole('link', { name: 'Aviso y fuentes' }).click();
  await expect(page.getByRole('heading', { name: 'Aviso y fuentes' })).toBeVisible();
  await page.getByRole('link', { name: 'Acerca de / Contacto' }).click();
  await expect(page.getByRole('heading', { name: 'Acerca de / Contacto' })).toBeVisible();
  await expect(page.getByText('[COMPLETAR: correo de contacto]')).toBeVisible();
  const supportLink = page.locator('.app-footer').getByRole('link', { name: 'Invítame a un café' });
  await expect(supportLink).toHaveAttribute('href', 'https://ko-fi.com/S0U1291G5B');
  await expect(supportLink).toHaveAttribute('target', '_blank');
  await expect(supportLink).toHaveAttribute('rel', 'noopener noreferrer');
  await page.getByRole('link', { name: 'Privacidad' }).click();
  await expect(page.getByRole('link', { name: 'Ko-fi · Privacy Policy' })).toHaveAttribute('href', 'https://more.ko-fi.com/privacy');

  const dimensions = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: window.innerWidth }));
  expect(dimensions.width).toBeLessThanOrEqual(dimensions.viewport);

  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(page.locator('.support-nav-link')).toBeVisible();
  await expect(page.locator('.support-nav-link')).toHaveAttribute('href', 'https://ko-fi.com/S0U1291G5B');
  await page.getByRole('button', { name: 'Idioma: English' }).click();
  await page.getByRole('link', { name: 'Privacy', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Privacy and local storage' })).toBeVisible();

  await page.setViewportSize({ width: 375, height: 812 });
  const englishDimensions = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: window.innerWidth }));
  expect(englishDimensions.width).toBeLessThanOrEqual(englishDimensions.viewport);
});
