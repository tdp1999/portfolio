# Task: Landing sign-in for `/checklist` + proxy Set-Cookie fix

## Status: done

## Goal
The Owner signs in on thunderphong.com with the console account, and checklist routes are reachable only when signed in.

## Context
Epic `epic-landing-checklist`. First authenticated surface on the public landing site (CHK-004, amended landing invariant). Browser calls go through the landing's same-origin `/api` proxy (`apps/landing/src/server.ts`). Prod `COOKIE_DOMAIN=.thunderphong.com` (confirmed by the Owner). Login is email + password.

## Acceptance Criteria
- [x] When the API returns two `Set-Cookie` headers through the landing proxy, the browser shall receive both (`refresh_token`, `csrf_token`); covered by a test or a verified curl against the built server.
- [x] When the Owner submits valid credentials on the login form, the page shall show the runs list without a reload.
- [x] If credentials are wrong, then the form shall show the API error inline and shall stay on the form.
- [x] When the access token expires, the next checklist request shall refresh once (with `x-csrf-token` from the `csrf_token` cookie) and retry; if refresh fails, then the page shall return to the login form.
- [x] If a visitor opens `/checklist` or `/checklist/:id` signed out, then the server HTML shall contain no checklist data, and the page shall carry `<meta name="robots" content="noindex">`.
- [x] `/checklist` is kept out of search by `X-Robots-Tag: noindex` (not a `robots.txt` `Disallow`, which would stop crawlers from reading that header), and is absent from the sitemap and from nav.
- [x] Logout clears the session and returns to the login form.

## Technical Notes
- Proxy fix: in the header copy loop skip `set-cookie`, then `res.setHeader('set-cookie', upstream.headers.getSetCookie())`.
- New lib `libs/landing/feature-checklist` (create via `ng-lib`): auth service (signals, access token in memory only), functional interceptor attaching the bearer token to `/api/checklist` requests only, route guard / in-page gate showing the login form.
- Do not import `libs/console/*` (module boundaries). Read `libs/console/shared/data-access/src/lib/auth.store.ts` for the refresh flow as reference only.
- `app.routes.ts`: lazy `checklist` route. `app.routes.server.ts`: `RenderMode.Client` for `checklist` and `checklist/**` (comment why: private data, no SSR).
- i18n exception: no `LANDING_COPY` for this lib. Add `libs/landing/feature-checklist` to the scan exclusions in `apps/landing/src/app/landing-copy-contract.spec.ts` and log a short ADR in `.context/decisions.md`.
- Login form uses `landing-*` input/button primitives; read `.context/design/cookbook/forms.md`.

**Specialized Skill:** ng-lib — create `libs/landing/feature-checklist` with correct tags/prefix

## Files to Touch
- apps/landing/src/server.ts
- apps/landing/src/app/app.routes.ts, app.routes.server.ts, app.ts, app.html
- apps/landing/src/app/pages/private/** (new: private.routes.ts, private.shell/, sign-in/)
- libs/landing/shared/ui session-bar (new), header (More → Sign in), shell (`signedIn` to header), mega-menu (`column` key), lucide `log-in`/`log-out` icons
- apps/landing/src/app/landing-copy-contract.spec.ts
- libs/landing/feature-checklist/** (new)
- libs/landing/shared/{util,data-access,ui} (shared Owner sign-in)
- apps/landing/src/app/pages/ddl/ddl-auth-gate/** (new), ddl.registry.ts, ddl.routes.ts
- .context/decisions.md

## Dependencies
- 429 - checklist endpoints to call (login itself works without it)

## Complexity: M

## Progress Log
- 2026-10-09 Started. Using ng-lib for the feature lib. Agreed deviations: X-Robots-Tag header (Client render has no meta in server HTML), sitemap is an allowlist (no change), robots `*` group only, shared session with console, interceptor scoped to the lazy route.
- 2026-10-09 Proxy fix verified on the built server against a stub upstream that sets two cookies: both `Set-Cookie` lines reach the client (before the fix only the last one did).
- 2026-10-09 `/checklist` built-server HTML is the 19KB CSR shell with no checklist markup, header `X-Robots-Tag: noindex, nofollow`; `/` has no such header. `/checklist/:id` has no child route yet, so it renders the app 404 page (no data, noindex header); task 434 adds the route and it falls under the `checklist/**` Client rule. robots `*` group disallows `/checklist`; the sitemap is an allowlist so nothing to remove; no nav link added.
- 2026-10-09 `landing-button` got an additive `type` input (`button` default, `submit` for forms) + DDL note. Interceptor spec: 4 tests (no token outside the checklist API, refresh with CSRF header then retry, one shared refresh for parallel 401s, sign out when refresh fails). `nx build landing` green.
- 2026-10-09 Browser check (Playwright, dev server): wrong credentials against the real API show "Invalid credentials" inline and stay on the form; empty submit shows field errors. With the auth and runs endpoints stubbed: sign-in shows the runs list without a reload; an expired token gives 401 → refresh with `x-csrf-token` → retry; reload restores the session; Sign out and a failed refresh both land on the login form; no horizontal overflow at 375px; no page errors. A real sign-in with the Owner's password is left to the Owner (the agent does not hold it).
- 2026-10-09 Owner asked for the sign-in to be reusable by other private landing pages, not checklist-only. Moved it to shared libs: `LandingAuthStatus`/`LandingSignInError`/`LandingCredentials` in `shared/util`; `LandingAuthService`, `landingAuthInterceptor`, `provideLandingAuth({ apiPrefixes })` in `shared/data-access` (route-scoped providers + session restore on route entry); presentational `landing-sign-in-form` and `landing-auth-gate` in `shared/ui` (strings as `auth.*` keys in `LANDING_COPY`, EN + VI). The gate renders its content from an `<ng-template>` so nothing private is created while signed out (plain `ng-content` would instantiate the routed page and fire its API call). DDL page `/ddl/auth-gate` documents the three-piece recipe. Checklist feature now holds only its route, shell and runs list.
- 2026-10-09 Re-verified after the move: data-access spec 4/4, shared/ui 242/242, apps/landing 19/19, eslint clean, `nx build landing` green, Playwright run all green incl. zero checklist API calls while signed out.
- 2026-10-09 Done — all ACs satisfied
- 2026-10-09 Owner review: private pages are a group, and sign-in state is global, not per feature. `LandingAuthService` is `providedIn: 'root'` and restored once per page load (`App`, `afterNextRender`; no request without the `csrf_token` cookie). `PRIVATE_ROUTES` in `app.private.routes.ts` is the single list: `app.routes.ts` mounts it under an empty-path group (`provideLandingAuthHttp()` + `private-shell` with the gate); `NOINDEX_PATHS` (private paths + `sign-in`) drives `RenderMode.Client` in `app.routes.server.ts` and `X-Robots-Tag` in `server.ts`. Interceptor sends the token on every `/api/` call from the group except `/api/auth/` (prefix option removed). `feature-checklist` holds no auth code and no shell.
- 2026-10-09 Owner review: header stays unchanged. Sign-in is a "Sign in" entry in More (Documents column, hidden once signed in) opening `/sign-in` (gate reused, returns to the previous page or `/`). Sign-out is `landing-session-bar`, a slim row under the header shown only while signed in (rendered by the shell from `signedIn`). DDL `/ddl/auth-gate` gained a Session bar section and the updated recipe. Verified: tsc on 4 projects, tests (data-access 4, shared/ui 242, landing 19), eslint, `nx build landing`, Playwright on the built server with mocked auth (17/17: no refresh or bar for visitors, header has no added control, More shows Sign in in Documents, sign-in returns to /about, bar shown on public and private pages, Sign in hidden when signed in, checklist opens with token, /sign-in redirects when signed in, bar sign-out returns the checklist gate, one refresh on reload, /ddl untouched, 375px fits, mobile sheet lists Sign in, no page errors).
- 2026-10-09 Owner review: "Sign in" gets its own "Account" section title instead of reading as a Documents item. Additive `column` key on `MegaMenuItem`: sections sharing it stack in one grid column (Account under Documents; 24px apart, 16px when columns stack below laptop). Mobile sheet shows Account as its own group. DDL mega-menu layout table gained a "Stacked sections" row. Verified: tsc, shared/ui 242 tests, eslint, build, Playwright screenshots at 1280 (dark) / 900 / 375.
- 2026-10-09 Owner review: the session bar shows only on guarded routes, not site-wide. Moved it from the global shell into `private-shell` (inside the gate's template, so it exists only when signed in, flush under the header); the global shell keeps only `signedIn` for the More menu. Private area regrouped under `apps/landing/src/app/pages/private/` (like `pages/ddl/`): `private.routes.ts` (`PRIVATE_ROUTES`, `PRIVATE_PATHS`, `SIGN_IN_PATH`, `NOINDEX_PATHS`, `PRIVATE_AREA_ROUTES` spread into `appRoutes`), `private-shell/`, `sign-in/`. `landing-session-bar` no longer wraps its own container (the caller's frame decides the width). Verified: tsc, shared/ui 242 + landing 19 tests, eslint, build, Playwright 11/11 (no bar on /, /about, /ddl, /sign-in even when signed in; bar flush under the header on /checklist; bar sign-out shows the gate; 375px fits).
- 2026-10-09 Pre-commit review fixes. Sign-out with an expired access token used to get a 401 from `JwtAccessGuard` and leave both cookies, so the next load restored the session: `signOut()` now refreshes on 401 and logs out once more. The interceptor retries a 401 that answers a token another refresh already replaced, without a second refresh. `robots.txt` no longer disallows `/checklist` and `/sign-in` (a disallowed URL is never fetched, so its `X-Robots-Tag: noindex` is never seen); AC and epic reworded to match. `private-shell/` renamed `private.shell/` (file grammar, role `shell`). The private shell re-applies the "Sign in" title after each navigation (the meta service resets the head on `NavigationStart`). Pure helpers extracted for tests: `moreMenuItems` (`header.data.ts`), `sectionColumnsOf` (`mega-menu.util.ts`), `signInReturnUrl` (`sign-in.util.ts`), `proxyResponseHeaders` + `isUnderPaths` (`server.util.ts`). New specs: service restore/signOut + `signInErrorOf`, interceptor stale-token retry, menu items, section columns, return URL, proxy headers. Verified: data-access 17, shared/ui 247, landing 29 tests, eslint, tsc (lib/app configs), `nx build landing`.
