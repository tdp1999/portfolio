import { BootstrapContext, bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { config } from './app/app.config.server';

/**
 * Patch global fetch on the SSR server so HttpClient (withFetch) can use **relative** URLs
 * (e.g. `/api/profile`) the same way the browser does. Keeping URLs identical on both sides
 * is what lets Angular's HTTP transfer cache hit after hydration — otherwise the cache key
 * differs (absolute vs relative) and every API call refetches on the client, causing a flash
 * of fallback values while signals sit at their initialValue.
 */
const apiBase = process.env['API_URL'] || 'http://localhost:3000';
const originalFetch = globalThis.fetch;
globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
  if (typeof input === 'string' && input.startsWith('/')) {
    return originalFetch(`${apiBase}${input}`, init);
  }
  if (input instanceof Request && input.url.startsWith('/')) {
    return originalFetch(new Request(`${apiBase}${input.url}`, input), init);
  }
  return originalFetch(input, init);
}) as typeof fetch;

const bootstrap = (context: BootstrapContext) => bootstrapApplication(App, config, context);

export default bootstrap;
