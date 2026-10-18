import { expect, test } from '@playwright/test';

const widths = [320, 360, 390, 561, 680, 768, 820, 1024, 1280, 1600];
const pages = ['Resumen', 'Contadores', 'Temporizadores', 'Personajes', 'Fuentes', 'Ajustes'];

test('navigation and app sections remain within the viewport at common widths', async ({ page }) => {
  await page.goto('/');

  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });

    for (const section of pages) {
      await page.getByRole('button', { name: section }).first().click();
      const layout = await page.evaluate(() => {
        const rect = (selector: string) => {
          const element = document.querySelector<HTMLElement>(selector);
          if (!element || getComputedStyle(element).display === 'none') return null;
          const { left, right, top, bottom } = element.getBoundingClientRect();
          return { left, right, top, bottom };
        };
        const intersects = (a: NonNullable<ReturnType<typeof rect>>, b: NonNullable<ReturnType<typeof rect>>) => a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1;
        const inlineHeader = window.innerWidth > 1120;
        const headerParts = (inlineHeader
          ? ['.brand', '.main-nav', '.reset-ticker', '.top-actions']
          : ['.brand', '.reset-ticker', '.top-actions']).map(rect).filter((part) => part !== null);
        const comparedHeader = headerParts;
        const headerOverlap = comparedHeader.some((part, index) => comparedHeader.slice(index + 1).some((other) => intersects(part, other)));
        const rowParts = ['.row-copy', '.row-progress', '.row-actions'].map(rect).filter((part) => part !== null);
        const rowOverlap = rowParts.some((part, index) => rowParts.slice(index + 1).some((other) => intersects(part, other)));
        const panelHeaderParts = ['.checklist-panel-head>div:first-child', '.panel-tools'].map(rect).filter((part) => part !== null);
        const panelHeaderOverlap = panelHeaderParts.length === 2 && intersects(panelHeaderParts[0], panelHeaderParts[1]);
        return {
          documentWidth: document.documentElement.scrollWidth,
          viewportWidth: window.innerWidth,
          headerOverlap,
          rowOverlap,
          panelHeaderOverlap,
        };
      });

      expect(layout.documentWidth, `${section} at ${width}px should not scroll horizontally`).toBeLessThanOrEqual(layout.viewportWidth);
      expect(layout.headerOverlap, `${section} at ${width}px should not overlap header controls`).toBe(false);
      expect(layout.rowOverlap, `${section} at ${width}px should not overlap tracker row controls`).toBe(false);
      expect(layout.panelHeaderOverlap, `${section} at ${width}px should not overlap checklist controls`).toBe(false);
    }
  }
});

test('summary plus button increments a mission by one', async ({ page }) => {
  await page.goto('/');
  const conquest = page.locator('.companion-row').filter({ has: page.getByRole('heading', { name: 'Conquista', exact: true }) });
  await expect(conquest.locator('.row-progress>b')).toHaveText('0/2');
  await conquest.getByRole('button', { name: 'Aumentar progreso Conquista' }).click();
  await expect(conquest.locator('.row-progress>b')).toHaveText('1/2');
});
