# Feature plan — `landing-lightbox`

Status: **shipped** (v1 complete). Scope approved 2026-06-02; built out 2026-06. All v1 scope landed; see §7 (all boxes checked). Live consumers + remaining rollout in §6.

A reusable, breakpoint-agnostic lightbox so **any figure in the system** (home, projects, blog, anywhere) can be clicked to open a full-screen viewer with **carousel navigation + zoom/pan**. Opt-in per figure via a directive.

> **Reconciled against the implementation 2026-06-04.** Deltas from the original plan are called out inline as **[as-built]** notes. The behaviour contract / quality bar lives in the component-bank doc (`.context/design/components/lightbox.md`) — the timeless reference; this file is the plan-of-record + rollout status.

---

## 1. Scope (v1 = Full)

**In:** open/close · scrim+blur · CDK Overlay portal · scroll-lock · focus-trap + restore focus · `aria-modal` + live region · prev/next (←→ / swipe / drag / arrows) · counter `n/N` · caption + FIG · **zoom/pan** (double-tap · pinch · ctrl-wheel · pan-when-zoomed) · **FLIP** zoom-from-thumbnail open/close · **filmstrip thumbnails** · **download / open-original** · **srcset always-best** (full-res regardless of device) · `prefers-reduced-motion`.

**Out (v2+):** video / iframe content, rotate/flip, slideshow autoplay, captions-as-HTML.

---

## 2. Key architectural decisions (locked)

1. **Overlay = CDK Overlay + CDK a11y.** `@angular/cdk` 21.1.3 is a direct dep and landing already uses it (`landing-header` uses `cdkTrapFocus`). Use `Overlay.create()` + `ComponentPortal`, `scrollStrategies.block()` for scroll-lock, `cdkTrapFocus` in the panel, manual `activeElement` save/restore. Service-driven so it opens from ANY page without editing the shell.
2. **NOT a `landing-carousel` embed.** Carousel uses CSS scroll-snap (right for inline galleries) but pinch-zoom + pan need full pointer control → conflicts with scroll-snap. The lightbox uses its **own transform-based pager** (`translateX`) + a gesture layer that arbitrates swipe vs pan. It **reuses the one-slide-per-gesture decision logic** (distance + velocity threshold) we built for the carousel, and renders each slide with `landing-image`/`landing-figure` (caption/FIG/srcset reuse). Carousel and lightbox stay siblings, not nested.
3. **Zoom = JS computes → CSS renders.** JS owns `scale`/`offsetX`/`offsetY` + all gesture math (pinch ratio, wheel, double-tap, zoom-to-point, pan-bound clamp); writes `transform: translate3d(x,y,0) scale(s)` to the active image inside `requestAnimationFrame`. `will-change: transform` during a gesture; `transform-origin: 0 0` (everything expressed via translate+scale — PhotoSwipe-style). Pure-CSS zoom is insufficient (no pan/pinch/zoom-to-point/clamp). Matches PhotoSwipe / Fancybox / GLightbox / medium-zoom(FLIP).
   - **Zoom-to-point:** `newOffset = point − (point − oldOffset) × (newScale / oldScale)`.
   - **Pinch:** scale from 2-pointer distance ratio; origin = midpoint.
   - **Wheel:** `ctrl/meta + wheel` (trackpad pinch maps here) → zoom at cursor; plain wheel ignored.
   - **Double-tap / dblclick:** toggle `1× ↔ ~2.5×` at the point.
   - **Pan:** single pointer when `scale > 1`; clamp so edges don't pull inward.
4. **srcset always-best.** Inline thumbnail keeps the small/responsive src (light page); on open the lightbox loads the **largest candidate** — Cloudinary URL → `w_2000`/original via `buildCloudinarySrcset`/transform; else explicit `srcset`/`fullSrc`; render via `landing-image` with `sizes="100vw"`. Preload current ± neighbour at full-res so swipe doesn't stall. Best image on mobile too (pairs with zoom).
5. **Integration = opt-in directive** `[lightbox] [lightboxGroup]` (chosen over default-on to avoid a site-wide behaviour change). Default-on can come later once proven.

---

## 3. Files

### New — `libs/landing/shared/ui/src/components/lightbox/`

| File                                        | Responsibility                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lightbox.types.ts`                         | `LightboxItem { url; fullSrc?; srcset?; alt?; caption?; figureNumber?; downloadUrl?; width?; height? }`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `lightbox.service.ts`                       | Group registry (DOM-ordered), `open(group, fromTrigger)`, `close()`, active-state signals (`items`, `index`, `triggerRect`), CDK Overlay create/dispose, scroll-block                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `lightbox-overlay.component.{ts,html,scss}` | Overlay UI: scrim, close ✕, transform pager, gesture engine (swipe vs pan), JS-zoom→CSS-transform, FLIP open/close, filmstrip, counter, download, focus-trap, aria-modal, live region, reduce-motion. **[as-built]** also ships beyond the plan: toolbar **± zoom buttons** (disabled at the scale limits), a **desktop-only zoom hint** (`@media (hover) and (pointer: fine)`), `is-zoom-modifier`/`is-zoomed` **cursor hints** while ⌘/Ctrl is held, and **separate `dialogLabel` / `liveLabel`** strings. `FULL_WIDTH = 1600` (plan said `w_2000`).                                                                                             |
| `lightbox.directive.ts`                     | `[lightbox]`; injects host `FigureComponent` (`{self, optional}`) to auto-pull `src/alt/caption`; extra inputs `lightboxGroup`, `lightboxFullSrc`, `lightboxSrcset`, `lightboxDownload`, `lightboxShowDownload`, `lightbox` (enable). Registers with service; click/Enter/Space → `open`; sets `role/tabindex`; passes `getBoundingClientRect()` for FLIP. **[as-built]** the trigger host gets `cursor: zoom-in` **and** a `.lightbox-enabled` class driving a subtle hover/focus image zoom (added 2026-06-04 — see new affordance partial below). The plan's "stage `cursor: zoom-in`" actually lives on the overlay as a ⌘/Ctrl modifier hint. |
| `index.ts`                                  | barrel export                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |

### Edited (additive, non-breaking) — all done

- `components/gallery/gallery.types.ts` — added optional `fullSrc?`, `srcset?`, `downloadUrl?`, `width?`, `height?` to `GalleryImage`. ✅
- `components/figure/figure.component.ts` — `[lightbox]` passthrough works (figure stays usable standalone; directive does the work). ✅
- `components/gallery/gallery.component.ts` + `components/carousel/carousel.component.ts` — **[as-built]** both forward `[lightbox]`/`[lightboxGroup]`/`[lightboxFullSrc]`/`[lightboxSrcset]`; gallery registers its overflow ("extra") images as hidden lightbox entries so the overlay navigates the full set. ✅
- `src/index.ts` — `export * from './components/lightbox';`. ✅
- **[as-built, 2026-06-04]** `src/styles/_lightbox-affordance.scss` (new) — global `.lightbox-enabled` hover/focus image-zoom, `reduce-motion`-gated; `@use`'d from `src/styles/index.scss`. Paired with the directive's `cursor: zoom-in`.

### DDL (source of truth) — all done ✅

- `apps/landing/src/app/pages/ddl/lightbox/{lightbox.page.ts,.html,.scss,index.ts}` — showcase: grouped figure grid (`lightboxGroup="case-study"`) + a standalone figure with `lightboxShowDownload`, plus the directive inputs list. **[as-built, 2026-06-04]** lede documents the `cursor: zoom-in` + hover-zoom affordance.
- `app.routes.ts` — `{ path: 'lightbox', loadComponent: … }` under `ddl`. ✅
- `ddl.component.ts` — DDL index entry "Lightbox · full-screen viewer + zoom/carousel". ✅

### Component bank — all done ✅

- `.context/design/components/lightbox.md` — full doc (_Why exists / Use when / Don't use when / Behavior contract / Zoom & gesture rules / Implementation rules / Quality checklist_), cross-linked to gallery + carousel. This is the timeless behaviour reference.
- `.context/design/components/carousel.md` — backfilled doc for the shipped `landing-carousel`. ✅

---

## 4. Gesture engine (overlay) — design notes

State (plain mutable + rAF writer; signals only for UI: counter, cursor, zoomed flag):

- `index`, `dragPx` (pager), `scale`, `tx`, `ty` (active image).
- `applyTransforms()` writes pager `translateX(calc(-index*100% + dragPx px))` and active-image `translate3d(tx,ty,0) scale(scale)` in `requestAnimationFrame`.

Arbitration (pointer count + zoom state):

- **1 pointer, scale==1** → pager swipe; on release decide ±1 via distance(`≈step*0.12`, floor 24) **or** velocity(>0.4px/ms); cap travel to one neighbour (reused carousel logic).
- **1 pointer, scale>1** → pan active image, clamp to bounds (optional rubber-band).
- **2 pointers** → pinch (scale from distance ratio, origin midpoint) + midpoint pan.
- **wheel + ctrl/meta** → zoom at cursor. **dblclick/double-tap** → toggle zoom at point.
- Changing slide **resets** `scale/tx/ty`.

Lifecycle / SSR:

- Listeners attach in `afterNextRender`, `runOutsideAngular`, cleaned in `destroyRef`. Overlay only ever created on a browser click, so SSR-safe by construction.
- Keyboard: `Esc` close, `←/→` nav, `Home/End` first/last, `+/-` or `0` zoom (nice-to-have).

FLIP:

- On open: active image starts at `triggerRect` (translate+scale from final centered rect), no transition; force reflow; add transition; clear transform → animates from thumbnail.
- On close: reverse to the current index's trigger rect if available, else fade.
- `prefers-reduced-motion` → skip FLIP, instant show/hide (via existing `reduce-motion` mixin / matchMedia).

A11y:

- `role="dialog" aria-modal="true"`, labelled by caption/counter; `cdkTrapFocus [cdkTrapFocusAutoCapture]="true"`; save `document.activeElement` before open, restore after close; `aria-live="polite"` region announces "Image X of N"; all controls labelled; background `inert`/`aria-hidden` (CDK Overlay handles stacking; add `inert` on app root if needed).

---

## 5. Build order

1. `lightbox.types.ts` + extend `GalleryImage`.
2. `LightboxService` (registry + CDK Overlay open/close + scroll-block).
3. `lightbox-overlay` — nav pager → zoom/pan → FLIP → filmstrip/counter/download/a11y.
4. `[lightbox]` directive + figure passthrough.
5. Export from lib `index.ts`.
6. DDL `/ddl/lightbox` + route + index entry.
7. Component-bank `lightbox.md` (+ `carousel.md`).
8. `nx build landing` → Playwright verify (open / zoom / pinch-sim / swipe / close / focus-trap / srcset-best on `/ddl/lightbox`; note DDL routes 404 via SSR — verify client-side or wire a temporary home figure).

## 6. Rollout — status

- **Live:** home **Selected Work** (gallery + highlighted figure, group `selected-work-<slug>`) and **blog detail** hero (group `post-hero`). ✅
- **Pending — `project-detail`:** the hero **cover** goes through `<landing-browser-window>` (no figure host) and the in-content figures render as raw HTML via `markdown.service` → `[innerHTML]`, which **cannot carry an Angular directive** like `[lightbox]`. This is an architecture limit, not a miss. The sanctioned fix is the **prose-block-renderer epic** (`epic-portfolio-prose-block-renderer.md`, D5 + Phase 4/6): once content renders from the AST, `image-ref`/`gallery` blocks are thin wrappers over the lightbox-enabled landing primitives, so content figures get the viewer declaratively. **Decision (2026-06-04):** defer project-detail lightbox to that epic rather than build an interim host-directive shim.
- **Future:** consider default-on (`[lightbox]="false"` to disable) once proven across pages.

## 7. Verification checklist — v1 complete

- [x] Opens from a figure click; Esc/scrim/✕ all close; focus returns to trigger.
- [x] Swipe/drag = exactly one slide; arrows + ←→ + filmstrip nav; counter correct.
- [x] Double-tap/pinch/ctrl-wheel zoom; zoom-to-point holds; pan clamps; reset on slide change.
- [x] FLIP open/close from the right thumbnail; reduced-motion path instant.
- [x] Full-res image shown (largest candidate), neighbours preloaded; mobile too.
- [x] No body scroll while open; background inert; SSR build clean.
- [x] **[as-built 2026-06-04]** Trigger shows `cursor: zoom-in` + subtle hover/focus zoom; suppressed under reduced motion.
