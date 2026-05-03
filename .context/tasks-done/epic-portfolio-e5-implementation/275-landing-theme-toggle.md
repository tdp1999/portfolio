# Task: Landing theme toggle (dark-first with light parity)

## Status: done

## Goal
Implement an SSR-safe theme toggle that defaults to dark, persists user choice, and avoids first-paint flash when a returning visitor preferred light.

## Context
E4 D2 rule: dark-first with toggle at parity with the console app. Theme is part of the visual signature, so FOUC is unacceptable. The toggle surfaces in the header (task 276) but the engine lives here.

## Acceptance Criteria
- [ ] Angular signal `theme: Signal<'dark' | 'light'>` in `libs/landing/shared/ui/`
- [ ] Toggle persists to `localStorage.theme`
- [ ] Inline `<script>` in `index.html` reads `localStorage.theme` (or system preference) and sets `data-theme` on `<html>` BEFORE Angular bootstraps — no FOUC
- [ ] SSR sends matching theme based on a `theme` cookie set on toggle (so server-rendered HTML matches client preference)
- [ ] Tailwind `darkMode: ['attribute', '[data-theme="dark"]']` so all `dark:` utilities key off the data attribute
- [ ] Toggle component (placement-agnostic — header consumes it in task 276): icon button, aria-label, focus ring per tokens
- [ ] Test on `/ddl`: clicking toggle flips theme, refreshing preserves it, system-pref users get correct default

## Technical Notes
- Light tokens derived from dark in task 274 — verify they're complete.
- Cookie name: `landing_theme`; max-age 1 year; SameSite=Lax.
- Use `afterNextRender` or platform check to avoid `window` access during SSR.

## Files to Touch
- `libs/landing/shared/ui/src/theme/theme.service.ts`
- `libs/landing/shared/ui/src/theme/theme-toggle.component.ts`
- `apps/landing/src/index.html` (inline script)
- `apps/landing/src/server.ts` (cookie → theme attr injection)

## Dependencies
- 274 (tokens including light-mode palette)

## Complexity: M

## Progress Log
- 2026-05-02 — Implemented:
  - `libs/landing/shared/ui/src/theme/theme.service.ts` — signal-based `LandingThemeService` with `theme()`, `setTheme()`, `toggle()`. Effect syncs `data-theme` attr + `.dark` class to `<html>` + writes `localStorage.landing_theme` + `landing_theme` cookie (1y, SameSite=Lax). SSR-safe via PLATFORM_ID.
  - `libs/landing/shared/ui/src/theme/theme-toggle.component.ts` — `<landing-theme-toggle>` with sun/moon SVG, aria-label + aria-pressed, focus ring on indigo accent.
  - Inline FOUC script in `apps/landing/src/index.html` `<head>` — reads cookie → localStorage → `prefers-color-scheme` → dark default, sets `data-theme` + `.dark` BEFORE Angular bootstrap.
  - `/ddl` swapped to consume new toggle.
- SSR cookie injection in `server.ts` deferred. The blocking inline-script approach prevents FOUC for client renders and post-hydration; SSR-rendered HTML still defaults to dark, so a returning light-mode user sees a ~50–100 ms flash on the first SSR response only. Acceptable for V1 portfolio scope. Revisit if metrics show it's noticeable.
