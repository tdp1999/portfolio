# Task: `feature-about` lib scaffold + `/about` route + `/experience` 301 redirect

## Status: done

## Goal
Create the landing `feature-about` library, register the `/about` route, and 301-redirect `/experience` to `/about#experience` — replacing the current `coming-soon` placeholder with the foundation for the deep about page.

## Context
Per `epic-portfolio-about`, `/about` becomes the single source of truth for work history and persona surfaces (hero, manifesto, depth-map, failures, currently-shipping). The existing `/experience` route + `feature-experience` lib are retired — but their sticky-tab UI lives on inside about (see task 331). This task is purely the route + lib + redirect plumbing; subsequent tasks compose sections on top.

## Acceptance Criteria
- [x] New Nx library `libs/landing/feature-about` created (tags: `scope:landing`, `type:feature`)
- [x] `FeatureAbout` standalone component renders at `/about` (replaces existing `coming-soon.page` registration)
- [x] `/experience` route returns 301 redirect to `/about#experience` (server-level 301 in `server.ts` + SPA fallback redirect in `app.routes.ts`)
- [x] `apps/landing/src/app/app.routes.ts` updated — `/about` points to feature-about routes, `/experience` is a redirect entry
- [x] Component renders a placeholder shell (breadcrumb + page-hero + empty sections marked `<!-- hero -->`, `<!-- experience -->`, etc.) so subsequent tasks have insertion points
- [x] Sitemap drops `/experience`, adds `/about` (audit `apps/landing/src/server.ts` sitemap output)
- [x] Type-check + landing prod build clean

## Technical Notes
- Use `ng-lib` skill — feature lib under `libs/landing/feature-about/`, selector prefix `landing`.
- Mirror `feature-contact` / `feature-experience` lib structure: routes file + component file + SCSS.
- Reuse `LandingPageHero`, `LandingBreadcrumb`, `LandingShell` primitives from `libs/landing/shared/ui`.
- Redirect implementation: `{ path: 'experience', redirectTo: '/about', pathMatch: 'full' }` in app.routes.ts. The `#experience` fragment can be added via a small redirect guard or by relying on browser fragment preservation — verify SSR doesn't strip the fragment.
- Don't touch `feature-experience` lib yet — task 331 handles the sticky-tab refactor.
- Coming-soon route entry for `/about` is removed; coming-soon component itself stays (still used by `/blog`).

**Specialized Skill:** `ng-lib` — read `~/.claude/skills/ng-lib/SKILL.md` for the Nx Angular library generator workflow with correct tags, prefix, and import path.

## Files to Touch
- `libs/landing/feature-about/` (new)
- `libs/landing/feature-about/src/index.ts`
- `libs/landing/feature-about/src/lib/feature-about/feature-about.{ts,html,scss}`
- `libs/landing/feature-about/src/lib/feature-about.routes.ts`
- `apps/landing/src/app/app.routes.ts`
- `tsconfig.base.json` (path mapping)
- Sitemap config (likely `apps/landing/src/server.ts` or a dedicated sitemap source)

## Dependencies
- None (foundational task)

## Complexity: S

## Progress Log
- [2026-05-22] Started — scaffolding feature-about lib mirroring feature-experience structure (no ng-lib skill installed locally).
- [2026-05-22] Scaffolded `libs/landing/feature-about` (project.json, eslint, jest, tsconfigs, test-setup) with tags `scope:landing` + `type:feature`. Added `@portfolio/landing/feature-about` path mapping in `tsconfig.base.json`.
- [2026-05-22] Built `FeatureAbout` placeholder component using `LandingBreadcrumbComponent` + `LandingPageHeroComponent` + `SectionComponent` + `ContainerComponent`. Sets title/meta. Template carries `<!-- hero -->` / `<!-- currently-shipping -->` / `<!-- experience -->` / `<!-- depth-map -->` / `<!-- how-i-think -->` / `<!-- failures -->` / `<!-- cta -->` insertion markers for downstream tasks.
- [2026-05-22] Wired `/about` route to lazy-load `FeatureAbout`; removed coming-soon registration. Replaced `/experience` route with a function-based `redirectTo` (parses `/about#experience`) — Angular Router redirectTo strings don't support fragments.
- [2026-05-22] Added Express-level `app.get('/experience')` 301 in `server.ts` redirecting to `/about#experience` — this is the real SEO 301 (Angular's client redirect is 302 + can't preserve fragments via string).
- [2026-05-22] Updated `generate-sitemap.ts` static routes: dropped `/experience`, added `/about` (priority 0.8, monthly).
- [2026-05-22] Verified: `npx tsc -p apps/landing/tsconfig.app.json --noEmit` clean; `nx build landing` succeeds (3 routes prerendered, only pre-existing budget warnings); `nx show projects` lists `landing-feature-about`; regenerated sitemap confirms `/about` present, `/experience` absent.
- [2026-05-22] Done — all ACs satisfied.
