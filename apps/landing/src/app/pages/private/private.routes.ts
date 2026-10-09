import { Route } from '@angular/router';

import { provideLandingAuthHttp } from '@portfolio/landing/shared/data-access';

/**
 * Pages behind the Owner sign-in. Adding a route here is all a new private page needs: it is mounted
 * inside the private group below (gate + session bar + token-carrying HttpClient), and
 * `NOINDEX_PATHS` makes `app.routes.server.ts` render it client-only (the server HTML holds no
 * private data) and `server.ts` send `X-Robots-Tag: noindex`. Keep these paths out of
 * `public/robots.txt`: a `Disallow` stops crawlers from fetching the page, so they never see the
 * noindex header and may still list the bare URL.
 */
export const PRIVATE_ROUTES: Route[] = [
  {
    path: 'checklist',
    loadChildren: () => import('@portfolio/landing/feature-checklist').then((m) => m.CHECKLIST_ROUTES),
  },
];

export const PRIVATE_PATHS: readonly string[] = PRIVATE_ROUTES.map((route) => route.path ?? '');

/** Public sign-in page (More menu → "Sign in"). Not private, but client-only and noindex like them. */
export const SIGN_IN_PATH = 'sign-in';

/** Paths rendered client-only and served with `X-Robots-Tag: noindex`. */
export const NOINDEX_PATHS: readonly string[] = [...PRIVATE_PATHS, SIGN_IN_PATH];

/**
 * The whole private area, spread into `appRoutes`: the sign-in page, then the private group. The group
 * has an empty path so URLs stay flat (`/checklist`); the router tries it for any URL not matched
 * before it, and its providers stay inert until a private page actually matches.
 */
export const PRIVATE_AREA_ROUTES: Route[] = [
  { path: SIGN_IN_PATH, loadComponent: () => import('./sign-in/sign-in') },
  {
    path: '',
    providers: [provideLandingAuthHttp()],
    loadComponent: () => import('./private.shell/private.shell'),
    children: PRIVATE_ROUTES,
  },
];
