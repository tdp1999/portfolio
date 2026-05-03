import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Static-content pages — safe to prerender
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'uses', renderMode: RenderMode.Prerender },
  { path: 'colophon', renderMode: RenderMode.Prerender },
  { path: '404', renderMode: RenderMode.Prerender },
  { path: 'ddl', renderMode: RenderMode.Prerender },

  // Dynamic / data-driven — server-render until task 300 wires getPrerenderParams
  { path: 'experience', renderMode: RenderMode.Server },
  { path: 'projects', renderMode: RenderMode.Server },
  { path: 'projects/**', renderMode: RenderMode.Server },
  { path: 'blog', renderMode: RenderMode.Server },
  { path: 'blog/**', renderMode: RenderMode.Server },

  { path: '**', renderMode: RenderMode.Server },
];
