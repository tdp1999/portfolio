# Task: Add Content Security Policy Headers

## Status: done

## Goal
Add CSP headers to mitigate XSS attacks, protecting the access token stored in JS memory.

## Context
The access token lives in JavaScript memory — any XSS vulnerability could steal it. CSP headers restrict what scripts and resources can load, providing defense in depth.

## Acceptance Criteria
- [x] CSP header set via `<meta>` tag in `index.html` or via API middleware
- [x] Policy includes: `default-src 'self'`, `script-src 'self'`, `style-src 'self' 'unsafe-inline'` (Tailwind), `connect-src 'self' <api-url>`, `img-src 'self' data:`, `font-src 'self'`
- [x] Google OAuth domain allowed in `connect-src` and `frame-src` if needed
- [x] No console errors from blocked resources in development
- [x] Documented which directives can be tightened in production

## Technical Notes
- Start permissive, tighten over time
- `'unsafe-inline'` for styles is needed with Tailwind (both dev and prod)
- API URL must be included in `connect-src` for XHR/fetch
- Consider adding `frame-ancestors 'none'` to prevent clickjacking
- Meta tag approach is simpler (no backend changes), but doesn't support `frame-ancestors` — use backend `helmet` middleware if needed

## Files to Touch
- `apps/console/src/index.html` (meta tag approach)
- Or: `apps/api/src/main.ts` (helmet middleware approach)

## Dependencies
- 101-cors-configuration (need to know API URL)

## Complexity: S
