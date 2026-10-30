/**
 * The origin the suite runs against.
 *
 * Mirrors `baseURL` in `playwright.config.ts`, which is what a relative
 * `page.goto('/about')` resolves against. Needed separately because
 * `BrowserContext.addCookies` takes an absolute `url` and there is no public API
 * for reading the configured base URL off a `Page`.
 *
 * Change both together.
 */
export const BASE_URL = 'http://localhost:4200';

/** The console dev server, which serves the edit form that landing pages link to. */
export const CONSOLE_URL = 'http://localhost:4300';
