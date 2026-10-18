import { expect, test, type Page } from '@playwright/test';

test.use({ reducedMotion: 'reduce', screenshot: 'only-on-failure' });

async function addCharacter(page: Page, name: string) {
  await page.getByRole('button', { name: 'Personajes', exact: true }).first().click();
  await page.getByRole('button', { name: 'Añadir personaje', exact: true }).first().click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('textbox').nth(0).fill(name);
  await dialog.getByRole('textbox').nth(1).fill('Siel');
  await dialog.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(dialog).toHaveCount(0);
}
async function selectCharacter(page: Page, name: string) {
  await page.locator('.character-select .neo-select-trigger').click();
  await page.getByRole('option', { name: `${name} · Siel`, exact: true }).click();
  await expect(page.locator('.character-select .neo-select-value')).toHaveText(`${name} · Siel`);
}
const card = (page: Page, name: string) => page.locator('.tracker-card').filter({ has: page.getByRole('heading', { name, exact: true }) });

test('characters on the same server have independent daily, weekly and account activity progress', async ({ page }) => {
  await page.addInitScript(() => { HTMLMediaElement.prototype.play = () => Promise.resolve(); });
  await page.goto('/');
  await addCharacter(page, 'Alfa');
  await addCharacter(page, 'Bravo');
  await selectCharacter(page, 'Alfa');
  await page.getByRole('button', { name: 'Contadores', exact: true }).first().click();
  await card(page, 'Misiones de Duty').locator('.stepper button').last().click();
  await expect(card(page, 'Misiones de Duty').getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1');
  await card(page, 'Nightmare').locator('.stepper button').last().click();
  await selectCharacter(page, 'Bravo');
  await expect(card(page, 'Misiones de Duty').getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  await expect(card(page, 'Nightmare').getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  await card(page, 'Misiones de Duty').locator('.stepper button').last().click();
  await card(page, 'Misiones de Duty').locator('.stepper button').last().click();
  await expect(card(page, 'Misiones de Duty').getByRole('progressbar')).toHaveAttribute('aria-valuenow', '2');

  await page.getByRole('tab', { name: /Semanales/ }).click();
  await card(page, 'Ascension Trial').locator('.stepper button').last().click();
  await selectCharacter(page, 'Alfa');
  await expect(card(page, 'Ascension Trial').getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');

  await page.getByRole('button', { name: 'Crear contador', exact: true }).first().click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('textbox').nth(0).fill('Actividad de cuenta');
  await dialog.getByRole('textbox').nth(2).fill('Prueba');
  await dialog.getByRole('spinbutton').fill('2');
  await dialog.locator('.neo-select-trigger').nth(0).click();
  await page.getByRole('option', { name: 'Cuenta', exact: true }).click();
  await dialog.getByRole('button', { name: 'Guardar', exact: true }).click();
  await page.getByRole('tab', { name: /Sin reinicio/ }).click();
  await card(page, 'Actividad de cuenta').locator('.stepper button').last().click();
  await expect(card(page, 'Actividad de cuenta').getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1');
  await selectCharacter(page, 'Bravo');
  await expect(card(page, 'Actividad de cuenta').getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');

  await page.reload();
  await page.getByRole('button', { name: 'Contadores', exact: true }).first().click();
  await expect(card(page, 'Misiones de Duty').getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1');
  await selectCharacter(page, 'Bravo');
  await expect(card(page, 'Misiones de Duty').getByRole('progressbar')).toHaveAttribute('aria-valuenow', '2');
  await page.getByRole('button', { name: 'Resumen', exact: true }).first().click();
  const row = page.locator('.companion-row').filter({ has: page.getByRole('heading', { name: 'Misiones de Duty', exact: true }) });
  await row.locator('.row-increment').click();
  await selectCharacter(page, 'Alfa');
  await page.getByRole('button', { name: 'Contadores', exact: true }).first().click();
  await expect(card(page, 'Misiones de Duty').getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1');
  await selectCharacter(page, 'Bravo');
  await expect(card(page, 'Misiones de Duty').getByRole('progressbar')).toHaveAttribute('aria-valuenow', '3');
});

test('legacy shared progress is preserved once without spreading it to every character', async ({ page }) => {
  await page.goto('/');
  await addCharacter(page, 'Alfa');
  await addCharacter(page, 'Bravo');
  await selectCharacter(page, 'Alfa');
  await page.getByRole('button', { name: 'Contadores', exact: true }).first().click();
  await card(page, 'Misiones de Duty').locator('.stepper button').last().click();
  await expect(card(page, 'Misiones de Duty').getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1');
  // Recreate a pre-fix installation: one server-owned record with no individual owner.
  await page.evaluate(() => new Promise<void>((resolve, reject) => {
    const request = indexedDB.open('aion2-companion');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const database = request.result;
      const transaction = database.transaction(['progress', 'preferences'], 'readwrite');
      const progress = transaction.objectStore('progress');
      const entries = progress.getAll();
      entries.onsuccess = () => {
        const entry = entries.result[0];
        const ownerKey = 'server:global:siel';
        progress.delete(entry.id);
        progress.put({ ...entry, id: `${entry.trackerId}|${ownerKey}|${entry.periodKey}`, ownerKey, value: 3 });
      };
      const preferences = transaction.objectStore('preferences');
      const saved = preferences.get('main');
      saved.onsuccess = () => preferences.put({ ...saved.result, progressOwnershipVersion: 0 });
      transaction.oncomplete = () => { database.close(); resolve(); };
      transaction.onerror = () => { database.close(); reject(transaction.error); };
    };
  }));
  await page.reload();
  await page.getByRole('button', { name: 'Contadores', exact: true }).first().click();
  await expect(card(page, 'Misiones de Duty').getByRole('progressbar')).toHaveAttribute('aria-valuenow', '3');
  await selectCharacter(page, 'Bravo');
  await expect(card(page, 'Misiones de Duty').getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  await card(page, 'Misiones de Duty').locator('.stepper button').last().click();
  await page.reload();
  await page.getByRole('button', { name: 'Contadores', exact: true }).first().click();
  await expect(card(page, 'Misiones de Duty').getByRole('progressbar')).toHaveAttribute('aria-valuenow', '3');
  await selectCharacter(page, 'Bravo');
  await expect(card(page, 'Misiones de Duty').getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1');
});
