# Task: Landing SSR + image pipeline

## Status: pending

## Goal
Wire Angular SSR for `apps/landing` and ship the image pipeline (srcset, lazy loading, hero preload) so the site renders fast and looks correct on first paint.

## Context
SSR is required for SEO + first-paint quality. Landing pages must show real HTML to crawlers and slow-network users. Image pipeline is closely related — beautified screenshots will be heavy without `srcset`.

## Acceptance Criteria
- [ ] Angular SSR enabled on `apps/landing`; `pnpm nx build landing` produces server + browser bundles
- [ ] All static routes prerendered: `/`, `/uses`, `/colophon`, `/404`, `/projects`
- [ ] All 3 V1 project detail routes prerendered (driven by project list at build time)
- [ ] `<landing-figure>` outputs `srcset` (1× and 2×) and uses `loading="lazy" decoding="async"` by default
- [ ] Hero screenshot (P4.1 home + project detail hero) uses `loading="eager"` and is preloaded via `<link rel="preload">` in document head
- [ ] No client-side data fetch on prerender — content baked into HTML
- [ ] Theme cookie honored on SSR so dark/light matches client preference at first byte (already wired in 275; verify here)

## Technical Notes
- Angular Universal / `@nguniversal/express-engine` or new built-in SSR builder (Angular v21 uses `@angular/ssr`).
- For prerender route discovery, hook into a build-time script that pulls projects from API or seed and emits the route list.
- Image source: 2× saved to `assets/projects/<slug>/`; build-time downscale to 1× with `sharp` or commit both.

## Files to Touch
- `apps/landing/project.json` (build target tweaks)
- `apps/landing/src/server.ts`
- `apps/landing/prerender.routes.ts` (or equivalent)
- `libs/landing/shared/ui/src/figure/landing-figure.component.ts` (srcset)
- `apps/landing/src/index.html` (preload hero)

## Dependencies
- 274–280 (UI), 281–293 (pages)

## Complexity: M

## Progress Log
