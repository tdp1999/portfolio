# Responsive Contract — Portfolio Monorepo

> The single source of truth for responsive design across this monorepo. All decisions are locked. **Read this before writing any responsive code.** Scaffolded by the `responsive-system` skill (adapter: `angular-tailwind-ssr`).
>
> **Current scope: landing only.** The console is intentionally out of scope for now (see §7). The foundation (mixins, observer, tokens) lives in shared libraries so the console can adopt it later without re-scaffolding.

---

## Decision Tree — pick the right tool

```
1. Purely visual change (font, padding, color)?     → CSS via respond-to('bp') / respond-down('bp') or Tailwind tablet:/laptop:/wide: prefixes.
2. DOM structure changes between BPs?                → BreakpointObserverService (currentBp(), isAtLeast(bp)).
3. Component reacts to PARENT width, not viewport?   → container query, opt-in, documented in the component file.
4. Otherwise                                         → stay CSS-only. A JS swap is a last resort.
```

## 1. Breakpoint Grid (4 BPs)

| BP | Min width | Pixel | Device intent |
| --- | --- | --- | --- |
| `mobile` | 0 (base) | <768 | Phones (portrait + landscape) |
| `tablet` | `48rem` | 768 | Tablets, foldables, small laptops |
| `laptop` | `64rem` | 1024 | Laptops, average desktop |
| `wide` | `90rem` | 1440 | Large desktop, ultra-wide |

`mobile` is the base layer — no media query, no utility prefix. `wide = 90rem (1440px)` matches the existing `--layout-long-form-max-width`.

**These three thresholds (48 / 64 / 90 rem) are mirrored byte-for-byte in three places** — keep them in sync:
- SCSS `$breakpoints` map — `libs/shared/ui/styles/src/base/_breakpoints.scss`
- Tailwind `theme.screens` — `tailwind.config.js`
- Observer query bands — `libs/shared/features/breakpoint-observer/src/lib/responsive-breakpoint.constant.ts`

## 2. Naming — device-bound, never generic

- Use `mobile / tablet / laptop / wide`.
- **Banned:** `sm / md / lg / xl / 2xl`.
- Reason: device-bound names survive viewport drift and encode intent, not size.

> **Migration caveat (init-time).** The device-bound Tailwind prefixes are added via `theme.extend.screens`, so the default `sm/md/lg/xl/2xl` prefixes remain *functional* — the ~36 existing usages (7 landing files + 1 console file) keep working. Generic names are banned for **new** code only and migrate organically (parallel to §8's `@media` warning-tail). Once the sweep is complete, move the block from `theme.extend.screens` to `theme.screens` to remove the defaults entirely.
>
> Note: the pre-existing generic `observe(config)` API on `BreakpointObserverService` still ships a 3-band `DEFAULT_BREAKPOINTS` (`mobile/tablet/desktop`) for the console sidebar. That is a legacy escape hatch; **new code uses the 4-BP responsive API** (§5), never `desktop`.

## 3. Direction — hybrid

- **Layout: desktop-first** (`respond-down('laptop')` to cascade down).
- **Tokens: mobile-first** (`respond-to('tablet')` to grow up).
- One file may mix both; each block picks one direction intentionally. Rule of thumb: *layout down, tokens up.*

## 4. Container Queries — opt-in, per-component

Only when a component reacts to its parent's width (e.g. a card reused in 1-col vs 3-col layouts). Document the why in the component file. Not a default.

## 5. Service API — single signal + helpers

`BreakpointObserverService` (`@portfolio/shared/features/breakpoint-observer`) exposes, additively to the existing generic `observe()`:

- `currentBp()` — `Signal<Bp>`, the current breakpoint.
- `isMobile() / isTablet() / isLaptop() / isWide()` — computed boolean flags.
- `isAtLeast(bp)` — true for the named BP and wider (uses `BP_ORDER`).
- SSR fallback: `'wide'` — the server renders desktop HTML; the client swaps on hydration.

`Bp = 'mobile' | 'tablet' | 'laptop' | 'wide'`. Backed by `RESPONSIVE_BREAKPOINTS` (four non-overlapping query bands) + `BP_ORDER` (rank 0–3).

## 6. Showcase / DDL — exploration sandbox

Routes under `/ddl` (project `feature-ddl`): a responsive contract page (BP ruler + live `currentBp()` indicator) and per-pattern variant comparisons. Cap at 2–3 variants each, reusing real production landing components. Winners graduate; sections stay as a record. Per repo rule, any agreed landing UI change updates `/ddl` in the same commit.

## 7. App Scope — asymmetric, deliberate

- **landing** — **first-class at every BP** (`mobile` → `wide`). Fully responsive; this is the public-facing surface and the only app in scope now.
- **console** — **out of scope for this contract.** A back-office surface; it keeps its existing 3-band sidebar behavior. When console responsive work is scheduled, it adopts this same foundation (the mixins/observer/tokens are already shared) and gets its own scope tiers added here.

This is a deliberate cost-for-focus bet: we invest responsive polish where users actually are.

## 8. Migration

Foundation lands now. The stylelint guard blocks **new** raw `@media (min/max-width: …px|rem)`, raw `100vh`, and raw `@media (prefers-*)`; the ~50 existing instances are flagged as **warnings**, not failures, during transition. Components migrate to the mixins organically when touched. Promote the lint rules warning→error after the sweep.

## 9. Scaling — fluid vs stepped

| Layer | Strategy |
| --- | --- |
| Display headings | **Fluid** `clamp(min, viewport, max)` — for impact |
| Body text | **Stepped** per BP — predictable line-length |
| Spacing | **Stepped** per BP — stays on the 4px grid |

Stepped tokens live in `libs/shared/ui/styles/src/tokens/_responsive.scss`. Fluid display `clamp()` lives with the landing display type scale (Tailwind `fontSize`), not in the responsive tokens partial.

## 10. Accessibility — 11 responsive-touched WCAG 2.2 criteria

Enforced via lint + Playwright: 1.3.4 Orientation · 1.4.4 Resize text 200% · 1.4.10 Reflow · 1.4.11 Non-text contrast · 1.4.12 Text spacing · 1.4.13 Content on hover/focus · 2.4.7 Focus visible · 2.4.11 Focus not obscured · 2.5.8 Target size 24×24 · 3.2.3 Consistent navigation · 3.2.4 Consistent identification. Plus recommended 2.5.5 Target Size AAA 44×44.

**24px touch floor enforced; 44px recommended. This does NOT certify full WCAG 2.2 AA** — color contrast, alt text, keyboard nav, forms, and ARIA are deferred to a dedicated a11y audit.

## 11. Validation — 2 layers

| Layer | What | Where |
| --- | --- | --- |
| 1 | Automated E2E: viewport fixture + a11y spec (reflow @320 / zoom 200% / target size / focus-not-obscured) | `apps/landing-e2e/src/fixtures/viewports.ts` + `apps/landing-e2e/src/responsive-a11y.spec.ts` |
| 2 | Claude-driven review: screenshot script captures 4 BPs → `responsive-system` skill inspects layout/type/hierarchy against this contract | `scripts/responsive-screenshots.mjs` |

**No pixel-diff baselines** — subjective layout/type/hierarchy checks are done on-demand by Claude reading the 4-BP screenshots. (Add visual-regression later if the UI stabilizes.)

## 12. SSR Fallback

`BreakpointObserverService.currentBp()` returns `'wide'` during SSR (no viewport). Render the wide layout statically, then enhance on the client — render the wide variant first to avoid a hydration-mismatch flash.

## 13. Images

Two image components with **distinct responsibilities** (full guide + decision table: `libs/landing/shared/ui/src/components/image/README.md`):

- **`landing-figure`** — semantic **captioned** content imagery (blog figures, galleries, prose). `<figure>` + `<figcaption>`, Cloudinary 1×/2× srcset, aspect-ratio/fill. **The default for content images.**
- **`landing-image`** — low-level **`<picture>`** primitive for **un-captioned** images needing multi-format tiering or self-hosted widths (hero/banner, decorative, OG). Two modes: (a) manual N-width from a base path → `…-{w}.{fmt} {w}w`; (b) explicit `srcset` string for URL-transform CDNs. Widths: `480, 960, 1920`. Formats: WebP → JPG fallback. Manual asset prep (no build pipeline). Always renders `width`+`height` or `aspect-ratio` to reserve space (no CLS). `preload` input = above-the-fold shortcut (eager + sync decode + high fetchpriority).

Rule: caption / prose / Cloudinary content → `landing-figure`; raw `<picture>` / multi-format / self-hosted → `landing-image`.

## 14. Viewport Units & Safe Areas

Use `var(--vh-full)` (= `100dvh`, with a `100vh` `@supports not` fallback) for full-height — raw `100vh` is banned by lint. Use `.safe-top` / `.safe-bottom` / `.safe-x` for fixed elements on notched devices. Owned by `libs/shared/ui/styles/src/base/_viewport.scss`.

## 15. User Prefs — `prefers-*` hooks ready, panel deferred

`prefers-reduced-motion` via the `reduce-motion` mixin; `prefers-color-scheme` via the `color-scheme('dark'|'light')` mixin. Both emit nested selectors keyed off `<html data-motion>` / `<html data-theme>` AND the matching `@media (prefers-*)`, so a future toggle panel can override the OS preference without touching component CSS. Owned by `libs/shared/ui/styles/src/base/_prefers.scss`. **Out of scope:** `prefers-contrast`, `prefers-reduced-data`, `forced-colors`. The toggle panel UI itself is deferred.

## 16. Input Modality — pointer/hover overrides

- `touch-only` → `@media (pointer: coarse)` — bump tap targets, drop hover-only affordances.
- `hover-only` → `@media (hover: hover) and (pointer: fine)` — gate hover effects.

Orthogonal to width BPs. Owned by `libs/shared/ui/styles/src/base/_input-modality.scss`.

---

## Artifact map

| Artifact | Path |
| --- | --- |
| Breakpoints mixins + `$breakpoints` map + `--bp-*` vars | `libs/shared/ui/styles/src/base/_breakpoints.scss` |
| Viewport / safe-area (`--vh-full`, `.safe-*`) | `libs/shared/ui/styles/src/base/_viewport.scss` |
| Prefers-* mixins (`reduce-motion`, `color-scheme`) | `libs/shared/ui/styles/src/base/_prefers.scss` |
| Input-modality mixins (`touch-only`, `hover-only`) | `libs/shared/ui/styles/src/base/_input-modality.scss` |
| Focus baseline + `scroll-margin-top` | `libs/shared/ui/styles/src/base/_focus.scss` |
| Stepped responsive tokens (spacing, container) | `libs/shared/ui/styles/src/tokens/_responsive.scss` |
| Tailwind `screens` (4-BP) | `tailwind.config.js` |
| `Bp` type, `RESPONSIVE_BREAKPOINTS`, `BP_ORDER` | `libs/shared/features/breakpoint-observer/src/lib/responsive-breakpoint.constant.ts` |
| `currentBp()` + flags + `isAtLeast()` (extends existing service) | `libs/shared/features/breakpoint-observer/src/lib/breakpoint-observer.service.ts` |
| Responsive image primitive | `libs/landing/shared/ui/src/components/image/` (`landing-image`) |
| Playwright viewport fixture | `apps/landing-e2e/src/fixtures/viewports.ts` |
| Responsive a11y spec | `apps/landing-e2e/src/responsive-a11y.spec.ts` |
| Screenshot script | `scripts/responsive-screenshots.mjs` |
| Stylelint guard (3 rules, warning severity) | `.stylelintrc.json` (root) |
