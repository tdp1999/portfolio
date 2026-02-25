# Epic: Authentication E2E Test Suite (Playwright)

## Summary

Comprehensive Playwright E2E test suite for the authentication flows across the Dashboard app. Covers happy paths, unhappy paths, edge cases, session persistence, mocked Google OAuth, protected route verification, and visual regression baselines. Uses API-based test seeding and global setup/teardown.

## Why

The auth module is security-critical — manual testing is insufficient and unsustainable. E2E tests validate the full stack (UI → API → DB) and catch integration regressions that unit tests miss. Investing in a solid test infrastructure now pays off for every future dashboard feature.

## Target Users

- Development team (test consumers)

## Scope

### In Scope

- **Test Infrastructure:**
  - Playwright project configuration for Dashboard app
  - Global setup: seed test users via Prisma (direct DB), start dev server if needed
  - Global teardown: clean up test data
  - Environment config (test API URL, test DB)
  - Auth helper utilities (login via API shortcut — skip UI for tests that don't test login itself)
  - Mock for Google OAuth callback (test-only route or direct navigation to callback URL with token)

- **Core Auth Flow Tests:**
  - Login with valid credentials → dashboard visible
  - Login with invalid credentials → error toast
  - Login with locked account → error message (no lock status revealed)
  - Login with "Remember Me" checked vs unchecked (cookie persistence)
  - Logout → redirected to login, can't access dashboard
  - Logout All → all sessions invalidated

- **Password Management Tests:**
  - Forgot password → success message (regardless of email existence)
  - Reset password with valid token → password changed, can login with new password
  - Reset password with expired/invalid token → error
  - Change password (authenticated) → success, old password no longer works

- **Google OAuth Tests (Mocked):**
  - Simulate callback with valid token → user logged in, redirected to dashboard
  - Simulate callback with invalid/missing token → error, redirected to login
  - Google-only user → no password change option visible

- **Session & Token Tests:**
  - Access token refresh (wait 15min or force expire) → seamless experience, no redirect
  - Refresh token expired → redirect to login with "Session expired" toast
  - Token version mismatch (simulated via DB update) → 401, redirect to login
  - CSRF token validation on refresh endpoint

- **Route Guard Tests:**
  - Unauthenticated access to `/dashboard` → redirect to `/auth/login`
  - Authenticated access to `/auth/login` → redirect to `/dashboard`
  - Deep link after login → user lands on originally requested page

- **Loading Indicator Tests:**
  - Full-page spinner visible during auth bootstrap
  - Route-change loading bar visible during navigation
  - Toast notifications appear and auto-dismiss

- **Form Validation Tests:**
  - Login: empty fields, invalid email format
  - Reset password: password mismatch, too short
  - Forgot password: empty email, invalid format

- **Visual Regression (Optional/Future):**
  - Baseline screenshots for: login page, forgot password page, reset password page, error states
  - Compare against baselines on CI

### Out of Scope

- Real Google OAuth (uses mocked callback)
- Performance/load testing
- Accessibility audit (separate effort, though basic a11y checks are welcome)
- Tests for dashboard content features (separate test suites per feature)
- Mobile-specific E2E (responsive testing can be added later)

## High-Level Requirements

### Infrastructure

1. **Playwright config** for dashboard app (`apps/dashboard-e2e/` or `apps/dashboard/e2e/`):
   - Base URL pointing to dashboard dev server
   - Projects: Chromium (primary), Firefox, WebKit (optional)
   - Retries: 1 on CI, 0 locally
   - Screenshots on failure
   - Trace on first retry

2. **Global setup script:**
   - Connect to test database via Prisma
   - Seed known test users:
     - `test-user@example.com` / `TestPassword123!` — standard user with password
     - `google-user@example.com` — Google-only user (no password, has googleId)
     - `locked-user@example.com` — user with `failedLoginAttempts >= 5` and `lockedUntil` in future
   - Store auth state (cookies/tokens) for authenticated tests via `storageState`

3. **Global teardown script:**
   - Delete all test users from DB
   - Clean up any test artifacts

4. **Auth helper (`auth.fixture.ts`):**
   - `loginViaApi(email, password)` — POST to `/api/auth/login`, capture cookies and token, set as `storageState`
   - Reusable across all test files that need an authenticated user without testing login UI
   - Custom fixture that extends Playwright's `test` with `authenticatedPage`

5. **Google OAuth mock:**
   - Navigate directly to `/auth/callback#token=<validAccessToken>` with pre-set refresh cookie
   - Or: test-only API endpoint (guarded by `NODE_ENV=test`) that simulates Google callback
   - Decision: direct navigation approach is simpler and doesn't require backend changes

### Test Suites

6. **`auth-login.spec.ts`** — Login page tests:
   - Happy: valid credentials → redirected to dashboard, user name visible
   - Happy: valid credentials + Remember Me → refresh cookie has `maxAge`
   - Unhappy: wrong password → error toast, stays on login page
   - Unhappy: non-existent email → same generic error (no enumeration)
   - Unhappy: locked account → generic error, no lock info leaked
   - Validation: empty fields → form validation errors shown
   - Validation: invalid email format → validation error

7. **`auth-google.spec.ts`** — Google OAuth tests:
   - Happy: simulated callback with valid token → dashboard loaded
   - Unhappy: callback with no token → redirected to login
   - UI: Google-only user has no "Change Password" option

8. **`auth-logout.spec.ts`** — Logout tests:
   - Happy: logout → redirected to login, dashboard inaccessible
   - Happy: logout-all → token version bumped, other sessions invalid
   - Cookie: refresh token cookie cleared after logout

9. **`auth-password.spec.ts`** — Password management:
   - Forgot password: submit email → success message
   - Forgot password: submit non-existent email → same success message (no enumeration)
   - Reset password: valid token → password changed, redirect to login
   - Reset password: expired token → error message
   - Reset password: mismatched passwords → validation error
   - Change password: correct current password → success
   - Change password: wrong current password → error

10. **`auth-session.spec.ts`** — Session persistence:
    - Token refresh: intercept `/auth/refresh` to verify it's called before token expiry
    - Expired session: manipulate cookie/token to simulate expiry → redirect to login + toast
    - Return URL: visit protected page while logged out → after login, redirected to original page

11. **`auth-guards.spec.ts`** — Route protection:
    - Visit `/dashboard` unauthenticated → redirect to `/auth/login`
    - Visit `/auth/login` authenticated → redirect to `/dashboard`
    - Visit deep dashboard URL unauthenticated → after login, redirected there

12. **`auth-loading.spec.ts`** — Loading indicators:
    - Full-page spinner visible during bootstrap (intercept refresh to delay response)
    - Toast appears on login success/failure and auto-dismisses

## Technical Considerations

### Architecture

- E2E tests in `apps/dashboard-e2e/` following Nx convention
- Shared fixtures in `apps/dashboard-e2e/src/fixtures/`
- Page objects pattern: `LoginPage`, `DashboardPage`, `ForgotPasswordPage`, `ResetPasswordPage`
- Test data constants in `apps/dashboard-e2e/src/data/`

### Test Database

- Use the same Postgres with a separate test database (e.g., `portfolio_test`)
- Or: use the dev database but clean up test data in teardown
- **Recommendation:** Separate test DB — avoids polluting dev data, enables parallel test runs

### Network Mocking Strategy

- **Default: hit real API** — E2E tests should validate the full stack
- **Mock only when necessary:**
  - Google OAuth callback (can't test real Google flow)
  - Delay responses to test loading states (`page.route()` to intercept and delay)
  - Force error responses to test error handling

### CI Integration

- Run in CI with `npx playwright test --project=chromium`
- Use Playwright's built-in retry and trace for flaky test debugging
- Store test results as CI artifacts (screenshots, traces)

### Test Isolation

- Each test file seeds its own required state or uses global seed
- Tests should not depend on execution order
- Use `test.describe.serial` only when tests must run in sequence (e.g., login → change password → login with new password)

## Risks & Warnings

⚠️ **Test Flakiness**
- Auth flows involve redirects, cookies, and timing — prone to flakiness
- Mitigation: use `page.waitForURL()`, `page.waitForResponse()`, generous timeouts for auth operations
- Avoid `page.waitForTimeout()` (arbitrary waits)

⚠️ **Google OAuth Mock Fidelity**
- Mocked callback skips the actual Google redirect → won't catch Google-side breaking changes
- Acceptable trade-off for automated tests; manual testing covers real Google flow
- Mitigation: document the mock approach clearly, add a manual test checklist for Google OAuth

⚠️ **Test Data Leakage**
- If teardown fails, test users remain in DB
- Mitigation: use unique email prefixes (`test-*@example.com`), teardown deletes by prefix
- Add a safety check: before seeding, delete any existing test users

⚠️ **Cookie Cross-Subdomain in Test**
- Playwright may need special handling for cross-subdomain cookies
- If API and dashboard are on different origins in test env, cookie handling must match production
- Mitigation: test against a config that mirrors production subdomain setup (or use same-origin proxy in test)

⚠️ **Visual Regression Maintenance**
- Screenshot baselines break with any UI change (even intentional ones)
- Mitigation: keep visual regression optional, update baselines explicitly, only screenshot stable pages
- Start with login page only — expand gradually

## Alternatives Considered

### Cypress Instead of Playwright
- **Pros:** Larger ecosystem, time-travel debugging
- **Cons:** Slower, single browser (without paid), less native multi-tab support
- **Why not chosen:** Playwright is faster, supports multiple browsers, better for cookie/auth testing

### Test Users via API Registration Endpoint
- **Pros:** Tests the registration flow too
- **Cons:** No registration endpoint exists (users created via seed/Google)
- **Why not chosen:** Direct DB seeding via Prisma is more reliable and independent

### Mock All API Calls
- **Pros:** Tests are fast, no DB dependency
- **Cons:** Doesn't validate real integration, misses backend bugs
- **Why not chosen:** E2E tests should hit real backend — that's the point

## Success Criteria

- [ ] All happy-path auth flows pass in CI (login, logout, password reset, Google mock)
- [ ] Unhappy paths are covered (invalid credentials, locked account, expired tokens)
- [ ] Tests run in under 2 minutes total (Chromium only)
- [ ] Test data is properly seeded and cleaned up
- [ ] No test depends on another test's state
- [ ] Auth helper allows skipping login UI for non-login tests
- [ ] Route guards are verified (both directions)
- [ ] Loading indicators and toasts are verified
- [ ] Tests pass on CI with Playwright container

## Estimated Complexity
L

**Reasoning:** Test infrastructure setup (global setup/teardown, fixtures, page objects) is the bulk of the work. Individual test cases are straightforward once infrastructure is in place. ~8-10 tasks.

## Status
draft

## Created
2026-02-25
