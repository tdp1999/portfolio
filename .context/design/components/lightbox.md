---
component: landing-lightbox
status: stable
related: [landing-figure, landing-gallery, landing-carousel]
---

# landing-lightbox

> Opt-in, service-driven full-screen image viewer with carousel navigation and zoom/pan. Add `lightbox` to any `<landing-figure>` to make it clickable; figures sharing a `lightboxGroup` browse together.

## Why this exists

Inline figures are capped at content width and lose detail (dense UI screenshots, diagrams). A lightbox gives any figure a full-screen, zoomable view without each page reinventing a modal. It is **opt-in per figure** (a directive) so adding it never changes site-wide behaviour, and **group-aware** so a set of figures becomes a swipeable carousel once opened.

## Use when

- A figure rewards a closer look — UI screenshots, diagrams, dense dashboards.
- A page has a set of related figures the reader may want to flip through (case-study shots, project gallery).
- The full-res asset is meaningfully larger than the inline thumbnail (srcset always-best pays off).

## Don't use when

- The inline figure already shows everything (small logos, decorative imagery).
- Content is non-image (video/iframe) — out of v1 scope.
- You need an always-on archive grid with its own route — that's a page, not a lightbox.

## Behavior contract

- **Open** — click / Enter / Space on a `[lightbox]` host. The overlay mounts in a CDK Overlay with a blocking scroll strategy (no background scroll).
- **Group** — all entries with the same `lightboxGroup` are ordered by DOM position; opening one lets you navigate the whole set. Default group is `"default"`.
- **Navigate** — swipe / mouse-drag (one slide per gesture), ←/→, Home/End, prev/next arrows, filmstrip thumbnails. Counter shows `n / N`.
- **Zoom** — double-tap (touch) / double-click (mouse) toggles ~2.5×; pinch; ⌘/Ctrl + wheel zooms at the cursor; ⌘/Ctrl + `+`/`-` (keyboard) and the toolbar ± buttons step at the centre; `0` resets. Pan by dragging when zoomed; pan is clamped to the image bounds. Changing slide resets zoom. The toolbar ± buttons disable at the scale limits (− at 1×, + at the max).
- **Cursor & hover** — the stage cursor stays default; it only hints `zoom-in`/`zoom-out` while ⌘/Ctrl is held. The **trigger** carries `cursor: zoom-in` and its image scales slightly (`1.03`) on hover/keyboard-focus as a clickable affordance — driven by the `.lightbox-enabled` class the directive adds, motion-gated via `reduce-motion`. A desktop-only hint (`@media (hover) and (pointer: fine)`) shows the zoom shortcuts and hides once zoomed.
- **srcset always-best** — the inline thumbnail keeps its small source; on open the overlay loads the **largest candidate**: `lightboxFullSrc` › explicit `srcset` › Cloudinary upscale (`w_1600`/`3200`) › the inline `url`. `sizes="100vw"`.
- **FLIP + close** — opening FLIPs the image from the trigger thumbnail's rect. Closing fades the **whole dialog** out together (chrome + image) over `--lightbox-flip` (~240ms) while the image FLIPs back toward the trigger, then disposes on a single synced timer — no chrome left lingering without its backdrop. Skipped under `prefers-reduced-motion` (instant).
- **Close** — Esc, click on the backdrop (anywhere but the image; suppressed after a drag), or ✕. Focus returns to the trigger (CDK focus-trap + auto-capture).
- **Download** — opt-in only (`lightboxShowDownload`); hidden by default. When on, opens/downloads the resolved full source (or `lightboxDownload`).
- **Arrows centre on the image**, not the viewport — the slide's asymmetric padding (room for bar/caption/filmstrip) is offset via `--lb-pad-top/--lb-pad-bottom` so prev/next sit at the image's vertical middle at every breakpoint.

## Zoom & gesture rules

- **JS computes, CSS renders.** The component owns `scale`/`tx`/`ty` (and the pager `dragPx`) as plain fields and writes `transform: translate3d(x,y,0) scale(s)` in a single `requestAnimationFrame`. `transform-origin: center`. Never drive zoom from CSS `:hover`/`transition` alone — pan, pinch, zoom-to-point, and clamping all need JS state.
- **Zoom-to-point** keeps the image-space point under the cursor fixed: `newOffset = oldOffset·(s2/s) + p·(1 − s2/s)`, where `p` is the cursor relative to the stage centre.
- **Gesture arbitration** by pointer count + zoom state: 1 pointer & `scale==1` → pager swipe (commit ±1 on distance OR a quick flick — same one-slide-per-gesture logic as `landing-carousel`); 1 pointer & `scale>1` → pan; 2 pointers → pinch (scale from distance ratio, origin = midpoint).
- **Scale clamp** `1–4`. The stage uses `touch-action: none` so the browser never steals the gesture.
- **SSR-safe by construction** — listeners attach in `afterNextRender`, run `runOutsideAngular`, and the overlay only ever mounts on a browser click. Signal writes that drive the OnPush view (index, zoomed flag) are committed inside `NgZone.run`.

## Implementation rules

- Reach for the directive, not the service: put `lightbox lightboxGroup="…"` on `<landing-figure>`. The directive pulls `src/alt/caption/figureNumber` from the host figure; explicit `lightbox*` inputs override and also let it sit on a bare `<img>`.
- One group per logical set. Don't share a group across unrelated sections — DOM order decides sequence.
- Provide the best source explicitly (`lightboxFullSrc`/`lightboxSrcset`) when the inline `url` isn't Cloudinary; otherwise the overlay can only show the inline image.
- Don't nest a `landing-carousel` inside the overlay — the lightbox has its own transform pager (scroll-snap conflicts with pinch/pan). They are siblings.
- The overlay `<img>` is intentionally a raw element (not `landing-image`) so the zoom transform applies directly; this is the one place that bypasses the picture primitive.

## Quality checklist

- [ ] Opens from click/Enter/Space; Esc / scrim / ✕ all close; focus returns to the trigger.
- [ ] Swipe/drag advances **exactly one** slide (light drag still advances); arrows + ←→ + filmstrip agree with the counter.
- [ ] Double-tap / pinch / ⌘-wheel zoom; zoom-to-point holds the cursor target; pan clamps at edges; zoom resets on slide change.
- [ ] FLIP open/close animates from the correct thumbnail; `prefers-reduced-motion` path is instant.
- [ ] Full-res candidate is shown (not the thumbnail) — verify on mobile too.
- [ ] No background scroll while open; build (`nx build landing`) clean.
