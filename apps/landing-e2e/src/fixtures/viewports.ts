import { Page, test } from '@playwright/test';

/**
 * One representative viewport WIDTH per breakpoint. Width drives the BP cascade;
 * heights are cosmetic. Mirrors the 4-BP grid in
 * `.context/design/contracts/responsive-contract.md` §1.
 */
export const viewports = {
  mobile: { width: 375, height: 812 },
  tablet: { width: 768, height: 1024 },
  laptop: { width: 1280, height: 800 },
  wide: { width: 1920, height: 1080 },
} as const;

export type ViewportName = keyof typeof viewports;

export const VIEWPORT_NAMES = Object.keys(viewports) as ViewportName[];

/**
 * Register one `test()` per breakpoint, each with its viewport pre-set. Call
 * inside a `test.describe`. The callback receives the BP name and its size.
 */
export function forEachViewport(callback: (name: ViewportName, size: { width: number; height: number }) => void): void {
  for (const name of VIEWPORT_NAMES) {
    test.describe(name, () => {
      test.use({ viewport: viewports[name] });
      callback(name, viewports[name]);
    });
  }
}

/** Freeze animations/transitions so captures and layout checks are deterministic. */
export async function disableAnimations(page: Page): Promise<void> {
  await page.addStyleTag({
    content: `*, *::before, *::after {
      animation-duration: 0s !important;
      animation-delay: 0s !important;
      transition-duration: 0s !important;
      transition-delay: 0s !important;
      scroll-behavior: auto !important;
    }`,
  });
}

/** Wait for web fonts to finish loading so text metrics are stable. */
export async function waitForFonts(page: Page): Promise<void> {
  await page.evaluate(() => document.fonts.ready);
}
