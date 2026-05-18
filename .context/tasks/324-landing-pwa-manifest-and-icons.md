# Task: Landing PWA manifest + icon set

## Status: pending

## Goal
Ship a minimal PWA manifest and the standard icon set so the landing site:
1. Has a proper icon when added to iOS / Android / Windows home screen
2. Reports a healthy Lighthouse PWA score (no "manifest missing" warning)
3. Has a consistent theme color across browser chrome (mobile address bar, splash)

## Context
Today the landing ships only `favicon.ico` and no `manifest.webmanifest`. iOS treats this as a generic globe icon when pinned. Lighthouse PWA category flags the gap. Cost is low: one manifest file, three PNG icons.

Not building a full installable PWA — no service worker, no offline. Just the icon + manifest hygiene.

## Acceptance Criteria
- [ ] `apps/landing/public/manifest.webmanifest` exists with: `name`, `short_name`, `description`, `start_url: /`, `display: standalone`, `theme_color` (matches dark theme bg `#0d0e11`), `background_color`, `icons` array referencing 192 + 512 sizes
- [ ] `apps/landing/public/icon-192.png` (192×192) and `icon-512.png` (512×512) — design lifted from existing favicon / brand mark
- [ ] `apps/landing/public/apple-touch-icon.png` (180×180) — iOS home screen
- [ ] `apps/landing/src/index.html` has:
  - `<link rel="manifest" href="/manifest.webmanifest" />`
  - `<link rel="apple-touch-icon" href="/apple-touch-icon.png" />`
  - `<meta name="theme-color" content="#0d0e11" media="(prefers-color-scheme: dark)" />`
  - `<meta name="theme-color" content="#faf9fd" media="(prefers-color-scheme: light)" />`
- [ ] Lighthouse PWA audit no longer flags missing manifest / missing apple-touch-icon
- [ ] Build verification: all manifest + icon files present in `dist/apps/landing/browser/`

## Technical Notes
- Asset pipeline already handles `apps/landing/public/**/*` via task 302's glob configuration.
- Icon design should match the existing `favicon.ico` aesthetic — use the same source if available, regenerate at the three required sizes.
- Use a tool like https://realfavicongenerator.net/ if a source SVG/PNG is provided, OR hand-export from a brand mark.

## Files to Touch
- `apps/landing/public/manifest.webmanifest`
- `apps/landing/public/icon-192.png`
- `apps/landing/public/icon-512.png`
- `apps/landing/public/apple-touch-icon.png`
- `apps/landing/src/index.html`

## Dependencies
- 302 (static-file serving pipeline)

## Complexity: S

## Progress Log
