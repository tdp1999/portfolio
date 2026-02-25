# Epic: Authentication Frontend UI & Integration

## Summary

Frontend authentication module for the Dashboard app (`console.phuong.com`). Covers login page, Google SSO button, password reset flows, session persistence with silent refresh, auth state management via Signals, HTTP interceptors, route guards, loading indicators, toast notifications, and CORS/cookie configuration for cross-subdomain auth.

## Why

The backend auth module is complete but useless without a frontend. The dashboard needs a fully integrated auth layer before any content management features can be built. This is the critical path — every dashboard feature depends on authenticated access.

## Target Users

- Portfolio owner (admin)

## Scope

### In Scope

- **Auth Pages** (Blank Layout — no sidebar/nav):
  - Login page (email/password + "Remember Me" + Google SSO button)
  - Forgot Password page (email input)
  - Reset Password page (new password + confirmation, token from URL)
  - OAuth Callback page (`/auth/callback` — parses token from URL fragment, bootstraps session)
- **Auth State Management:**
  - `AuthStore` (Signal-based) — holds current user, loading state, authentication status
  - Silent refresh on app bootstrap (hit `/auth/refresh` before rendering protected routes)
  - Access token stored in memory (JS variable, not localStorage)
  - Full-page spinner during bootstrap refresh
- **HTTP Layer:**
  - Auth interceptor — attaches `Authorization: Bearer <token>` to API requests
  - Token refresh interceptor — on 401, queue requests, refresh token, retry
  - CSRF interceptor — reads `csrf_token` cookie, attaches `X-CSRF-Token` header to `/auth/refresh`
  - Error interceptor — catches API errors, shows toast notifications
- **Route Protection:**
  - `authGuard` — redirects unauthenticated users to `/auth/login`
  - `guestGuard` — redirects authenticated users away from auth pages to `/dashboard`
  - Lazy-loaded auth module (login, forgot-password, reset-password, callback)
- **Loading Indicators:**
  - Route-change loading bar (top of app)
  - Skeleton loaders for data fetching (pattern/component for reuse)
  - Full-page spinner for blocking operations (bootstrap, logout-all)
- **Toast/Notification System:**
  - Success: "Logged in successfully", "Password reset email sent", "Password changed"
  - Error: "Invalid credentials", "Account locked, try again in X minutes", "Session expired"
  - Positioned top-right, auto-dismiss after 5s
- **CORS Configuration** (Backend prerequisite):
  - `app.enableCors({ origin: [...], credentials: true })` in `main.ts`
  - Environment-driven allowed origins
- **CSP Headers:**
  - Basic Content-Security-Policy header to mitigate XSS
  - `default-src 'self'`, `script-src 'self'`, `style-src 'self' 'unsafe-inline'` (Tailwind needs inline), `connect-src 'self' <api-domain>`, `img-src 'self' data:`
- **Conditional UI for Google-only users:**
  - Hide "Change Password" if user has no password
  - Show "Linked via Google" indicator in profile/settings

### Out of Scope

- Dashboard content pages (separate epics)
- Authorization / role-based UI elements
- Multi-tab session sync (BroadcastChannel)
- Email template design
- 2FA / MFA UI
- Landing page auth (landing has no auth)
- Profile/settings page (separate epic — only auth-related conditional logic here)

## High-Level Requirements

### Prerequisite: Backend CORS

1. Add `app.enableCors()` with `credentials: true` and environment-driven `origin` list to `main.ts`
2. ~~Verify cookie SameSite policy~~ **Resolved:** Cookies changed to `SameSite=Lax` to support cross-subdomain auth (`console.phuong.com` → API). CSRF double-submit pattern mitigates the relaxed policy.

### Auth Pages & Blank Layout

3. Create a `BlankLayoutComponent` (no sidebar, no nav — just centered content card) for auth routes
4. Login page: email input, password input, "Remember Me" checkbox, submit button, "Forgot Password?" link, Google SSO button, form validation (required fields, email format)
5. Forgot Password page: email input, submit button, success message ("If account exists, email sent"), link back to login
6. Reset Password page: new password + confirm password inputs, submit, validation (min length, match), error states (invalid/expired token)
7. OAuth Callback page: no visible UI (or minimal spinner), parses `#token=<accessToken>` from URL fragment, stores in memory, fetches `/auth/me`, redirects to dashboard

### Auth State (Signals)

8. `AuthStore` service:
   - `user: Signal<UserProfile | null>`
   - `isAuthenticated: Signal<boolean>` (computed from user)
   - `isLoading: Signal<boolean>` (bootstrap state)
   - `login(credentials)`, `logout()`, `logoutAll()`, `refreshToken()`, `fetchCurrentUser()`
9. On app bootstrap: attempt silent refresh → if success, fetch `/auth/me` and populate state → if fail, clear state (user is guest)
10. Access token stored as a private variable in `AuthStore` — never in localStorage/sessionStorage

### HTTP Interceptors

11. **Auth interceptor:** Attach `Authorization: Bearer <token>` to all requests to API domain. Skip for `/auth/login`, `/auth/refresh`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/google`
12. **Refresh interceptor:** On 401 response, attempt token refresh. If refresh succeeds, retry original request with new token. If refresh fails, redirect to login with toast "Session expired". Queue concurrent requests during refresh to avoid multiple refresh calls.
13. **CSRF interceptor:** For requests to `/auth/refresh`, read `csrf_token` from `document.cookie` and attach as `X-CSRF-Token` header
14. **Error interceptor:** Catch non-401 errors, extract `message` from API error response, show as toast notification. Don't show toast for cancelled requests or network errors (show different message for offline).

### Route Guards

15. `authGuard`: Check `AuthStore.isAuthenticated` — if false, store attempted URL, redirect to `/auth/login`. After login, redirect back to stored URL.
16. `guestGuard`: Check `AuthStore.isAuthenticated` — if true, redirect to `/dashboard`

### Loading Indicators

17. Route-change loading bar: thin progress bar at top of viewport, triggered by Router events (`NavigationStart`/`NavigationEnd`)
18. Skeleton loader: reusable component/directive for content placeholders during API fetches
19. Full-page spinner: overlay with spinner, used during auth bootstrap and blocking operations (logout-all)

### Toast System

20. Lightweight toast/notification service and component. Supports success, error, warning, info types. Auto-dismiss configurable (default 5s). Stackable (multiple toasts visible). Top-right position.

### CSP Headers

21. Set CSP headers — either via backend middleware or meta tag in `index.html`. Start permissive, tighten over time.

## Technical Considerations

### Architecture

- Auth module lives in `libs/dashboard/feature-auth/` or similar Nx library
- `AuthStore` in `libs/dashboard/shared/data-access/` (shared across dashboard features)
- Interceptors and guards in `libs/dashboard/shared/util-auth/` or co-located with `AuthStore`
- Toast system in `libs/shared/ui/` (reusable across apps) or `libs/dashboard/shared/ui/`
- Loading bar in dashboard app shell

### Cross-Subdomain Cookie Concern

**Resolved.** Cookies set to `SameSite=Lax` to support cross-subdomain requests between `console.phuong.com` and the API. CORS must be configured with `credentials: true` and explicit `origin` list (no wildcards with credentials).

### SSR Disabled

- Dashboard app will have SSR disabled entirely (`"ssr": false` in project.json or `angular.json`)
- No need for `isPlatformBrowser` checks or transfer state
- Simplifies auth bootstrap — always runs in browser

### Lazy Loading

- Auth routes (`/auth/*`) lazy-loaded as a feature module
- Auth interceptors and guards registered at app root (must be eager — they protect everything)
- `AuthStore` provided in root (singleton)

### Dependencies

- No new external libraries required for auth UI
- Toast system: build custom (small, no dep) or use a lightweight lib
- Loading bar: CSS-only or lightweight lib

## Risks & Warnings

⚠️ **Cross-Subdomain Cookies (RESOLVED)**
- ~~`SameSite=Strict` + different subdomains = cookies not sent on cross-site navigation~~
- **Decision:** Changed to `SameSite=Lax`. CSRF double-submit pattern remains active on refresh endpoint, mitigating the relaxed policy. Still need CORS `credentials: true`.

⚠️ **Silent Refresh Race on Bootstrap**
- If the refresh token is expired/missing, the user sees a full-page spinner then gets redirected to login
- Must ensure the spinner duration is short (fail fast if no refresh cookie exists)
- Edge case: user has refresh cookie but token is expired in DB — still shows spinner until API responds

⚠️ **Token Refresh Queue Complexity**
- Multiple concurrent 401s must be queued while refresh is in-flight
- If not handled correctly, can cause infinite loops (refresh itself returns 401)
- Mitigation: exclude `/auth/refresh` from the refresh interceptor, use a flag to prevent concurrent refresh attempts

⚠️ **Google OAuth Callback Security**
- Access token in URL fragment is safe from server logs but visible in browser history
- The callback page must clear the URL fragment after reading it (`window.history.replaceState`)
- Must validate token before trusting it (call `/auth/me` to verify)

⚠️ **CSP + Tailwind Conflict**
- Tailwind's dev mode injects inline styles → `style-src 'unsafe-inline'` needed
- In production with extracted CSS, could tighten to `style-src 'self'` if no inline styles remain

## Alternatives Considered

### Use Angular Material Snackbar for Toasts
- **Pros:** Already available if using Material in dashboard, consistent styling
- **Cons:** Limited customization, tied to Material theme
- **Decision:** Evaluate during implementation — Material snackbar may be sufficient

### Use NgRx or NGXS for Auth State
- **Pros:** Established patterns, devtools
- **Cons:** Overkill for single-user dashboard, Signals are lighter and Angular-native
- **Why not chosen:** Signal-based store is simpler and aligns with Angular 21+ direction

### Store Access Token in HttpOnly Cookie
- **Pros:** XSS-proof
- **Cons:** CSRF on every request, not just refresh. Backend already designed for memory storage.
- **Why not chosen:** Backend is built. Changing now would require rework.

## Success Criteria

- [ ] User can log in with email/password and see dashboard
- [ ] User can log in with Google and see dashboard
- [ ] "Remember Me" persists session across browser restarts (30 days)
- [ ] Without "Remember Me", session ends when browser closes
- [ ] Silent refresh works — user doesn't re-login within 30 days (if remembered)
- [ ] 401 errors trigger automatic token refresh and request retry
- [ ] Expired/revoked sessions show toast and redirect to login
- [ ] Forgot password + reset password flow works end-to-end
- [ ] Google-only users see appropriate UI (no password change option)
- [ ] Route guards prevent unauthorized access to dashboard
- [ ] Route guards redirect authenticated users away from login
- [ ] Loading indicators work for all three scenarios (route, data, blocking)
- [ ] Toast notifications display for auth events and API errors
- [ ] CORS configured and cookies work cross-subdomain

## Estimated Complexity
XL

**Reasoning:** Cross-subdomain cookie configuration, 4 auth pages, signal-based auth store with silent refresh, 4 HTTP interceptors, 2 route guards, 3 loading indicator types, toast system, CSP headers. Likely 12-15 tasks.

## Status
broken-down

> Broken down into tasks 101-114 on 2026-02-25

## Created
2026-02-25
