import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * Why so little is prerendered.
 *
 * Prerendering bakes HTML at build time, when there is no request — so
 * `LandingLocaleService` cannot read the visitor's `landing_locale` cookie or
 * `Accept-Language`, and every prerendered page ships English. A Vietnamese
 * visitor then sees an English first paint that flips once hydration runs. Any
 * page a visitor actually reads is therefore `Server`, even when it holds no
 * server data: the render is pure template work, and correct language on first
 * paint is worth more than the milliseconds prerender saves.
 *
 * `/ddl` is the exception. It is the internal design-system reference, English
 * only by nature, and never localized — so nothing flips.
 */
export const serverRoutes: ServerRoute[] = [
  // Static content, but localized → Server, so first paint matches the cookie.
  { path: 'uses', renderMode: RenderMode.Server },
  { path: 'colophon', renderMode: RenderMode.Server },
  // Legal pages are static, but content varies by `?lang=` query → SSR so the
  // server can render the right language without a separate URL per locale.
  { path: 'privacy', renderMode: RenderMode.Server },
  { path: 'terms', renderMode: RenderMode.Server },
  { path: 'contact', renderMode: RenderMode.Server },
  { path: '404', renderMode: RenderMode.Server, status: 404 },
  { path: 'ddl', renderMode: RenderMode.Prerender },
  // No server data (npm/GitHub figures are fetched in the browser, the editor is
  // deferred) but it is fully localized, so it renders per request like the rest.
  // Listing it is not optional: an unlisted path falls through to the `**` rule
  // below and is served with a 404 status even though it renders.
  { path: 'document-engine', renderMode: RenderMode.Server },

  // Data-driven — SSR at runtime (Railway)
  { path: '', renderMode: RenderMode.Server },
  { path: 'about', renderMode: RenderMode.Server },
  { path: 'experience', renderMode: RenderMode.Server },
  { path: 'projects', renderMode: RenderMode.Server },
  { path: 'projects/**', renderMode: RenderMode.Server },
  { path: 'blog', renderMode: RenderMode.Server },
  { path: 'blog/**', renderMode: RenderMode.Server },

  { path: '**', renderMode: RenderMode.Server, status: 404 },
];
