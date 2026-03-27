# Task: Auth pages redesign — login, forgot/reset/set password

## Status: done

## Goal
Redesign all auth pages (blank layout, no sidebar) with centered card on grain+glow background, matching Stitch "Login Page" screen (bbe44133aede).

## Context
Phase 3 of Console UI Redesign. Auth pages use `ConsoleBlankLayoutComponent` — full-page, centered content, no sidebar. The login page is the first impression of the console.

## Acceptance Criteria
- [x] Login page: centered card (#1a1d27, rounded-2xl, border #2d3148, max-w-420px)
- [x] Card content: logo "C" circle, "Welcome back" title, subtitle, email input, password input (with eye toggle), "Forgot password?" link, "Sign in" button (full width, blue), divider "or", "Continue with Google" button (outlined)
- [x] Background: #0f1117 with grain texture + radial glow (indigo) behind card
- [x] Forgot password page: same card layout, email-only form, "Send Reset Link" button
- [x] Reset password page: same card layout, new password + confirm password fields
- [x] Set password page (invite accept): same card layout, password fields
- [x] Footer below card: "© 2026 Console Portfolio Management" centered, #64748b
- [x] All auth pages share the same centered card + grain+glow background pattern
- [x] Existing auth logic (form validation, submit, OAuth callback) unchanged

**Stitch reference:** screen `bbe44133aede44be` in project `17973930401225587522`

## Files to Touch
- `libs/console/feature-auth/src/lib/login/login.html`
- `libs/console/feature-auth/src/lib/login/login.scss`
- `libs/console/feature-auth/src/lib/forgot-password/forgot-password.html`
- `libs/console/feature-auth/src/lib/forgot-password/forgot-password.scss`
- `libs/console/feature-auth/src/lib/reset-password/reset-password.html`
- `libs/console/feature-auth/src/lib/reset-password/reset-password.scss`
- `libs/console/feature-auth/src/lib/set-password/set-password.html`
- `libs/console/feature-auth/src/lib/set-password/set-password.scss`
- `libs/console/shared/ui/src/lib/blank-layout/` (add grain+glow background)

## Dependencies
- 180 (background pattern — reuse same grain+glow approach)

## Complexity: M

## Progress Log
- [2026-03-27] Started
- [2026-03-27] Done — all ACs satisfied
