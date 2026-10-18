import { expect, test, type Locator } from '@playwright/test';

test.use({ reducedMotion: 'reduce', screenshot: 'only-on-failure' });

async function expectReadable(cards: Locator) {
  const failures = await cards.evaluateAll(elements => {
    const luminance = (color: string) => {
      const channels = color.match(/[\d.]+/g)!.slice(0, 3).map(Number).map(value => {
        const channel = value / 255;
        return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
      });
      return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
    };
    const background = (element: Element): string => {
      const color = getComputedStyle(element).backgroundColor;
      if (color !== 'transparent' && color !== 'rgba(0, 0, 0, 0)') return color;
      return background(element.parentElement!);
    };
    const issues: string[] = [];
    for (const card of elements) {
      for (const element of card.querySelectorAll('h3, .tracker-desc, .scope-badge, .tracker-meta span, .progress-label strong, .progress-label strong span, .progress-label small, .tracker-card-foot small, .tracker-glyph, button:not(:disabled)')) {
        if (!element.getBoundingClientRect().height) continue;
        const foreground = getComputedStyle(element).color;
        const surface = background(element);
        const a = luminance(foreground);
        const b = luminance(surface);
        const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
        if (ratio < 4.5) issues.push(`${card.querySelector('h3')?.textContent}: ${element.className || element.tagName}, ${foreground} on ${surface} = ${ratio.toFixed(2)}:1`);
      }
    }
    return issues;
  });
  expect(failures).toEqual([]);
}

for (const language of ['es', 'en']) {
  for (const theme of ['light', 'dark']) {
    test(`tracker text and controls remain readable before and after completion in ${language}, ${theme}`, async ({ page }) => {
      test.setTimeout(60_000);
      await page.addInitScript((savedTheme) => {
        localStorage.setItem('aion2-theme', savedTheme);
        HTMLMediaElement.prototype.play = () => Promise.resolve();
      }, theme);
      await page.goto('/');
      if (language === 'en') await page.locator('.top-actions .icon-button:not(.theme-toggle)').click();
      await expect(page.locator('html')).toHaveAttribute('lang', language);
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      await page.getByRole('button', { name: language === 'es' ? 'Contadores' : 'Trackers', exact: true }).first().click();
      const cards = page.locator('.tracker-card');
      await expect(cards).toHaveCount(6);
      await expectReadable(cards);

      // The first three positions cover yellow, turquoise and theme-aware surfaces.
      for (let index = 0; index < 3; index++) {
        const card = cards.nth(index);
        const initialBackground = await card.evaluate(element => getComputedStyle(element).backgroundColor);
        const limit = Number(await card.getByRole('progressbar').getAttribute('aria-valuemax'));
        for (let value = 1; value <= limit; value++) {
          await card.locator('.stepper button').last().click();
          await expect(card.getByRole('progressbar')).toHaveAttribute('aria-valuenow', String(value));
        }
        await expect(card).toHaveClass(/is-complete/);
        expect(await card.evaluate(element => getComputedStyle(element).backgroundColor)).toBe(initialBackground);
        await expectReadable(card);
        if (index === 2) await card.screenshot({ path: test.info().outputPath('completed-card.png') });
        await card.locator('.stepper button').first().click();
        await expect(card).not.toHaveClass(/is-complete/);
        await expectReadable(card);
      }

      await page.getByRole('tab', { name: language === 'es' ? /Semanales/ : /Weekly/ }).click();
      await expect(cards).toHaveCount(15);
      await expectReadable(cards);
      await page.setViewportSize({ width: 375, height: 900 });
      await expectReadable(cards);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
    });
  }
}
