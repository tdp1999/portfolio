import { BootstrapContext, bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { config } from './app/app.config.server';

/**
 * Patch global fetch on the SSR server so HttpClient (withFetch) can use `/api/*`
 * paths the same way the browser does. Angular SSR resolves relative URLs against
 * the incoming request's host BEFORE calling fetch, so we must catch both shapes:
 *   - Relative `/api/profile`
 *   - Absolute self-URL like `https://<own-host>/api/profile`
 * Both get rewritten to `${API_URL}/api/profile`. Keeping HttpClient unaware of the
 * rewrite preserves the HTTP transfer cache key (relative path) so client hydration
 * hits the cache instead of refetching.
 */
const apiBase = (process.env['API_URL'] || 'http://localhost:3000').replace(/\/$/, '');
const originalFetch = globalThis.fetch;

function rewriteUrl(url: string): string {
  if (url.startsWith(apiBase)) return url;
  if (url.startsWith('/api/')) return `${apiBase}${url}`;
  try {
    const parsed = new URL(url);
    if (parsed.pathname.startsWith('/api/')) {
      return `${apiBase}${parsed.pathname}${parsed.search}`;
    }
  } catch {
    /* not a parseable URL, leave alone */
  }
  return url;
}

globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
  if (typeof input === 'string') {
    return originalFetch(rewriteUrl(input), init);
  }
  if (input instanceof URL) {
    return originalFetch(rewriteUrl(input.toString()), init);
  }
  if (input instanceof Request) {
    const next = rewriteUrl(input.url);
    if (next !== input.url) {
      return originalFetch(new Request(next, input), init);
    }
  }
  return originalFetch(input, init);
}) as typeof fetch;

const bootstrap = (context: BootstrapContext) => bootstrapApplication(App, config, context);

export default bootstrap;
