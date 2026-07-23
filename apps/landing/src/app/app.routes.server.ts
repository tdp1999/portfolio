import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Static-content pages — safe to prerender
  { path: 'uses', renderMode: RenderMode.Prerender },
  { path: 'colophon', renderMode: RenderMode.Prerender },
  // Legal pages are static, but content varies by `?lang=` query → SSR so the
  // server can render the right language without a separate URL per locale.
  { path: 'privacy', renderMode: RenderMode.Server },
  { path: 'terms', renderMode: RenderMode.Server },
  { path: 'contact', renderMode: RenderMode.Server },
  { path: '404', renderMode: RenderMode.Server, status: 404 },
  { path: 'ddl', renderMode: RenderMode.Prerender },
  // The product page holds no server data — the npm/GitHub figures are fetched
  // in the browser and the editor is deferred — so it prerenders like the other
  // static pages. Listing it is not optional: an unlisted path falls through to
  // the `**` rule below and is served with a 404 status even though it renders.
  { path: 'document-engine', renderMode: RenderMode.Prerender },

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
