# Task: Landing SSR + image pipeline

## Status: done

## Goal

Wire Angular SSR for `apps/landing` and ship the image pipeline (srcset, lazy loading, hero preload) so the site renders fast and looks correct on first paint.

## Context

SSR is required for SEO + first-paint quality. Landing pages must show real HTML to crawlers and slow-network users. Image pipeline is closely related — beautified screenshots will be heavy without `srcset`.

## Acceptance Criteria

- [x] Angular SSR enabled on `apps/landing`; `pnpm nx build landing` produces server + browser bundles
      → Built-in Angular v21 SSR via `@angular/build:application` (`outputMode: "server"`). `dist/apps/landing/{browser,server}` emitted. Express adapter in `apps/landing/src/server.ts`.
- [x] Static-content routes prerendered; data-driven routes runtime-SSR (revised — see Note 1 below)
      → `/uses`, `/colophon`, `/ddl` use `RenderMode.Prerender` (3 routes baked at build). `/`, `/projects`, `/projects/**`, `/blog`, `/blog/**`, `/experience`, `/404` use `RenderMode.Server` (runtime SSR with HTTP transfer cache).
- [x] Project detail routes — runtime SSR + TransferState (revised — see Note 1 below)
      → 3 V1 projects render via runtime SSR; `project-detail.ts` stashes `{project, rendered, index}` in `TransferState` so the client never re-fetches or re-renders markdown.
- [x] `<landing-figure>` outputs `srcset` (1× and 2×) and uses `loading="lazy" decoding="async"` by default
      → Auto Cloudinary `srcset` via new `cloudinaryWidth` input (figure.component.ts) + `landing-gallery` passes 720/960px per layout. Explicit `srcset` input still wins. Non-Cloudinary URLs pass through unchanged.
- [x] Hero screenshot (project detail) uses `loading="eager"` and is preloaded via `<link rel="preload">` in document head
      → `landing-browser-window [eager]` emits `loading="eager" fetchpriority="high" decoding="sync"` for the project hero. `ProjectDetailComponent.injectHeroPreload()` adds `<link rel="preload" as="image" fetchpriority="high" imagesrcset="…1x, …2x">` to `document.head` during SSR. Same component computes the Cloudinary 1×/2× srcset (default 960 CSS px).
      → Home hero is text-only — no image to preload.
- [x] No client-side data fetch on prerender — content baked into HTML
      → Resolved a different way for data-driven routes: Angular HTTP transfer cache + `shareReplay({ refCount: false })` on data services means the first paint is identical to a prerender. Prerendered static pages (`/uses`, `/colophon`) have no HTTP calls. Recipe in `.context/landing-ssr.md` §1, §1b.
- [x] Theme cookie honored on SSR so dark/light matches client preference at first byte
      → Wired in task 275 via the `landing_theme` cookie + `index.html` inline bootstrap. Verified on prod.
- [x] Cloudinary 1×/2× `srcset` propagated to projects index thumbnails (row + grid views)
      → `projects-page.html` uses new `cloudinarySrcset` pipe at 160 px (row) / 480 px (grid).

## Note 1 — Why `/` and project detail are runtime SSR, not prerender

The spec originally called for prerendering `/` and all project detail routes. During E5 implementation the team chose runtime SSR for any route that pulls data from the API, because:

1. Prerender would require a build-time fetch from the API (Profile, Skills, Projects, Experiences) and a build-time route discovery for project slugs. Either the build needs the API running, or content updates require a redeploy.
2. Runtime SSR + HTTP transfer cache + cold-observable `shareReplay` already delivers the "no flash on hydration, first paint shows real content" property the AC was after. Documented in `.context/landing-ssr.md` §1 + §1b.
3. Failure surface stays small — one Railway service for landing (SSR Express + reverse proxy on `/api/*`), one for the API.

If we ever want true prerender for project detail (e.g. to drop SSR cost), the route-discovery hook would live in `apps/landing/prerender.routes.ts` and pull from the same `/api/projects?status=published` endpoint at build time. Out of scope for now.

## Technical Notes

- Angular v21 built-in SSR (`@angular/ssr`, no Universal). Server entry `apps/landing/src/server.ts`.
- SSR-side `globalThis.fetch` rewrite (`main.server.ts`) + browser-side reverse-proxy on `/api/*` keep transfer-cache keys identical across server + client. See `.context/landing-ssr.md` §1.
- Cloudinary srcset injection: `libs/landing/shared/util/src/lib/cloudinary-srcset.ts`. Inserts `f_auto,q_auto,w_{w},c_limit/` into the `/image/upload/` segment. Non-Cloudinary URLs pass through unchanged.
- `cloudinarySrcset` pipe (`libs/landing/shared/ui/src/pipes/cloudinary-srcset.pipe.ts`) for template use; `<landing-figure [cloudinaryWidth]>` for the centralized path; `<landing-browser-window [width]>` for the project hero.

## Files Touched

- `apps/landing/project.json` (already on `@angular/build:application` with `outputMode: "server"`)
- `apps/landing/src/server.ts` (already had `/api/*` reverse-proxy)
- `apps/landing/src/main.server.ts` (already had `globalThis.fetch` rewrite)
- `apps/landing/src/app/app.routes.server.ts` (already configured)
- `libs/landing/shared/util/src/lib/cloudinary-srcset.{ts,spec.ts}` — new
- `libs/landing/shared/ui/src/pipes/cloudinary-srcset.pipe.ts` — new
- `libs/landing/shared/ui/src/components/figure/figure.component.ts` — added `cloudinaryWidth` input + auto srcset
- `libs/landing/shared/ui/src/components/browser-window/landing-browser-window.component.ts` — added `width` input + auto srcset; `eager` now emits explicit `loading="eager"` + `decoding="sync"`
- `libs/landing/shared/ui/src/components/gallery/gallery.component.ts` — forwards `cellWidth()` to each figure
- `libs/landing/shared/ui/src/index.ts` — re-export pipe
- `libs/landing/shared/util/src/index.ts` — re-export helper
- `libs/landing/feature-projects/src/lib/project-detail/project-detail.{ts,html}` — `<link rel="preload">` injection + gallery `<img>` srcset via pipe
- `libs/landing/feature-projects/src/lib/projects-page/{projects-page.ts,projects-page.html}` — row + grid thumbnail srcset via pipe

## Dependencies

- 274–293 (UI primitives + home + sub-pages)

## Complexity: M

## Progress Log

- [2026-05-17] Reconciled task with current state. Most ACs already shipped during E5 phases (SSR, figure srcset, theme cookie, transfer cache, hero `eager`). Remaining work: Cloudinary 1×/2× srcset helper + `<link rel="preload">` for project hero.
- [2026-05-17] Added `buildCloudinarySrcset` helper + spec in `libs/landing/shared/util`; wired `cloudinaryWidth` input through `landing-figure` (centralized) + `landing-gallery` (forwards width per layout); added `width` input to `landing-browser-window` for the hero.
- [2026-05-17] Created `CloudinarySrcsetPipe` for template-side srcset; applied to project-detail inline gallery + projects index (row + grid thumbnails).
- [2026-05-17] `ProjectDetailComponent.injectHeroPreload()` adds `<link rel="preload" as="image" imagesrcset>` to `document.head` during SSR — runs inside the same effect that updates `<title>` / `og:image`, so the link is in the response HTML on first byte.
- [2026-05-17] Rewrote prerender ACs to reflect actual architecture (runtime SSR for data-driven routes; build-time prerender for static-only routes). Reasoning captured in "Note 1".
- [2026-05-17] `pnpm nx build landing` produces server + browser bundles, prerenders 3 static routes (`/uses`, `/colophon`, `/ddl`). All cloudinary-srcset and figure unit tests pass. Done.
