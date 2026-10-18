import { expect, test } from '@playwright/test';

const widths = [320, 360, 375, 390, 560, 561, 680, 681, 700, 768, 820, 821, 947, 1024, 1120, 1121, 1279, 1280, 1377, 1449, 1500, 1600, 1920];

test.use({ reducedMotion: 'reduce', screenshot: 'only-on-failure' });

test('compact profile menu remains readable and inside the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 900 });
  await page.goto('/');
  await page.locator('.character-select .neo-select-trigger').click();
  const list = page.getByRole('listbox');
  await expect(list.getByRole('option', { name: 'Perfil local' })).toBeVisible();
  const box = await list.boundingBox();
  expect(box!.width).toBeGreaterThanOrEqual(190);
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(768);
});

for (const language of ['es', 'en']) {
  for (const theme of ['light', 'dark']) {
    test(`header contains its labels and countdowns in ${language}, ${theme}`, async ({ page }) => {
      test.setTimeout(60_000);
      await page.goto('/');
      await expect(page.locator('.header-timer')).toHaveCount(3);
      await expect(page.locator('.companion-row').first()).toBeVisible();
      if (await page.locator('html').getAttribute('lang') !== language) {
        await page.locator('.top-actions .icon-button:not(.theme-toggle)').click();
        await expect(page.locator('html')).toHaveAttribute('lang', language);
      }
      const toggle = page.locator('.theme-toggle');
      if ((await toggle.getAttribute('aria-pressed') === 'true') !== (theme === 'dark')) await toggle.click();
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      await page.evaluate(() => document.fonts.ready);

      for (const width of widths) {
        await page.setViewportSize({ width, height: 900 });
        await page.evaluate(async () => {
          await document.fonts.ready;
          await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
        });
        const issues = await page.evaluate(() => {
          const failures: string[] = [];
          const bounds = (element: Element) => element.getBoundingClientRect();
          const visible = (element: Element) => bounds(element).width > 0 && bounds(element).height > 0;
          const contains = (outer: DOMRect, inner: DOMRect) => inner.left >= outer.left - 1 && inner.right <= outer.right + 1 && inner.top >= outer.top - 1 && inner.bottom <= outer.bottom + 1;
          const intersects = (a: DOMRect, b: DOMRect) => a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1;
          const header = document.querySelector('.sidebar')!;
          const groups = [...header.querySelectorAll(':scope > .brand, :scope > .reset-ticker, :scope > .main-nav, :scope > .top-actions')].filter(visible);
          for (const [index, group] of groups.entries()) {
            if (!contains(bounds(header), bounds(group))) failures.push(`${group.className} leaves header`);
            for (const other of groups.slice(index + 1)) {
              if (intersects(bounds(group), bounds(other))) failures.push(`${group.className} overlaps ${other.className}`);
            }
          }
          if (innerWidth < 1280 && bounds(header.querySelector('.reset-ticker')!).bottom > bounds(header.querySelector('.brand')!).top + 1) {
            failures.push('countdowns should occupy the first row');
          }
          for (const card of header.querySelectorAll('.header-timer')) {
            if (!visible(card)) failures.push(`${card.className} is hidden`);
            for (const child of card.querySelectorAll('.header-timer-ring, small, b, .header-timer-days, .header-timer-value')) {
              if (visible(child) && !contains(bounds(card), bounds(child))) failures.push(`${card.className}: ${child.className || child.tagName} leaves card`);
            }
            const caption = card.querySelector('small')!;
            const countdown = card.querySelector('b')!;
            if (intersects(bounds(caption), bounds(countdown))) failures.push(`${card.className}: caption overlaps countdown`);
            if (parseFloat(getComputedStyle(caption).fontSize) < 12) failures.push('caption below 12px');
          }
          if (document.documentElement.scrollWidth > innerWidth) {
            failures.push(`page width ${document.documentElement.scrollWidth} exceeds ${innerWidth}`);
            for (const element of [...document.querySelectorAll('main *')].filter(visible).filter(element => bounds(element).right > innerWidth + 1).slice(0, 6)) {
              failures.push(`${element.tagName}.${element.className}: right ${Math.round(bounds(element).right)}`);
            }
          }
          for (const name of ['--fs-xs', '--fs-xl', '--lh-tight']) {
            if (!getComputedStyle(document.documentElement).getPropertyValue(name).trim()) failures.push(`${name} is undefined`);
          }
          return failures;
        });
        expect(issues, `${language}/${theme}, ${width}px`).toEqual([]);
        if (language === 'es' && theme === 'dark' && [375, 947, 1377].includes(width)) {
          await page.screenshot({ path: test.info().outputPath(`header-${width}.png`) });
        }
      }
    });
  }
}
