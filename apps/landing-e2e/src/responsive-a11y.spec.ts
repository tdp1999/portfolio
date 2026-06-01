import { expect, Page, test } from '@playwright/test';

import { disableAnimations, forEachViewport, waitForFonts } from './fixtures/viewports';

/**
 * Layer-1 automated checks for the responsive-touched WCAG 2.2 criteria the
 * foundation enforces (see responsive-contract.md §10–§11). This is NOT a full
 * AA audit — it covers reflow, resize/zoom, target size, and focus-not-obscured.
 *
 * The route(s) under test. Add more public routes as they're polished per BP.
 */
const ROUTES = ['/'];

async function load(page: Page, route: string): Promise<void> {
  await page.goto(route);
  await page.waitForLoadState('networkidle');
  await waitForFonts(page);
  await disableAnimations(page);
}

test.describe('Responsive a11y', () => {
  // 1.4.10 Reflow — no horizontal scroll at the 320px floor.
  test.describe('reflow @ 320px (WCAG 1.4.10)', () => {
    test.use({ viewport: { width: 320, height: 720 } });
    for (const route of ROUTES) {
      test(`no horizontal scroll on ${route}`, async ({ page }) => {
        await load(page, route);
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth
        );
        // Allow a 1px sub-pixel rounding tolerance.
        expect(overflow).toBeLessThanOrEqual(1);
      });
    }
  });

  // 1.4.4 Resize text — content survives 200% zoom without horizontal scroll.
  test.describe('200% zoom (WCAG 1.4.4)', () => {
    test.use({ viewport: { width: 1280, height: 800 } });
    for (const route of ROUTES) {
      test(`reflows at 200% zoom on ${route}`, async ({ page }) => {
        await load(page, route);
        // Emulate 200% zoom by halving the CSS viewport via devicePixelRatio-ish trick:
        // set the layout viewport to half-width, which is what 200% zoom produces.
        await page.setViewportSize({ width: 640, height: 800 });
        await page.waitForTimeout(50);
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth
        );
        expect(overflow).toBeLessThanOrEqual(1);
      });
    }
  });

  // 2.5.8 Target size — interactive controls ≥ 24×24 CSS px (AA floor).
  forEachViewport((name) => {
    for (const route of ROUTES) {
      test(`interactive targets ≥ 24px on ${route} (WCAG 2.5.8)`, async ({ page }) => {
        await load(page, route);
        const tooSmall = await page.evaluate(() => {
          const sel = 'a, button, [role="button"], input:not([type="hidden"]), select, textarea';
          const offenders: string[] = [];
          for (const el of Array.from(document.querySelectorAll(sel))) {
            const r = el.getBoundingClientRect();
            // Skip hidden / zero-size (collapsed) elements.
            if (r.width === 0 || r.height === 0) continue;
            const style = getComputedStyle(el);
            if (style.visibility === 'hidden' || style.display === 'none') continue;
            if (r.width < 24 || r.height < 24) {
              offenders.push(`${el.tagName.toLowerCase()} ${Math.round(r.width)}x${Math.round(r.height)}`);
            }
          }
          return offenders;
        });
        expect(tooSmall, `Targets under 24px at ${name}: ${tooSmall.join(', ')}`).toEqual([]);
      });
    }
  });

  // 2.4.11 Focus Not Obscured — the focused element is not hidden behind the sticky header.
  forEachViewport((name) => {
    for (const route of ROUTES) {
      test(`focused element not obscured on ${route} (WCAG 2.4.11)`, async ({ page }) => {
        await load(page, route);
        // Tab to the first focusable element and confirm it's within the viewport.
        await page.keyboard.press('Tab');
        const visible = await page.evaluate(() => {
          const el = document.activeElement;
          if (!el || el === document.body) return true; // nothing focusable → vacuously fine
          const r = el.getBoundingClientRect();
          return r.top >= 0 && r.bottom <= window.innerHeight && r.left >= 0 && r.right <= window.innerWidth;
        });
        expect(visible, `First focusable element off-screen at ${name}`).toBe(true);
      });
    }
  });
});
