# Task: Landing sign-in for `/checklist` + proxy Set-Cookie fix

## Status: pending

## Goal
The Owner signs in on thunderphong.com with the console account, and checklist routes are reachable only when signed in.

## Context
Epic `epic-landing-checklist`. First authenticated surface on the public landing site (CHK-004, amended landing invariant). Browser calls go through the landing's same-origin `/api` proxy (`apps/landing/src/server.ts`). Prod `COOKIE_DOMAIN=.thunderphong.com` (confirmed by the Owner). Login is email + password.

## Acceptance Criteria
- [ ] When the API returns two `Set-Cookie` headers through the landing proxy, the browser shall receive both (`refresh_token`, `csrf_token`); covered by a test or a verified curl against the built server.
- [ ] When the Owner submits valid credentials on the login form, the page shall show the runs list without a reload.
- [ ] If credentials are wrong, then the form shall show the API error inline and shall stay on the form.
- [ ] When the access token expires, the next checklist request shall refresh once (with `x-csrf-token` from the `csrf_token` cookie) and retry; if refresh fails, then the page shall return to the login form.
- [ ] If a visitor opens `/checklist` or `/checklist/:id` signed out, then the server HTML shall contain no checklist data, and the page shall carry `<meta name="robots" content="noindex">`.
- [ ] `/checklist` is listed in `robots.txt` `Disallow`, absent from the sitemap and from nav.
- [ ] Logout clears the session and returns to the login form.

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
- apps/landing/src/app/app.routes.ts, app.routes.server.ts
- apps/landing/public/robots.txt
- apps/landing/src/app/landing-copy-contract.spec.ts
- libs/landing/feature-checklist/** (new)
- .context/decisions.md

## Dependencies
- 429 - checklist endpoints to call (login itself works without it)

## Complexity: M

## Progress Log
