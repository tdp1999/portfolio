---
component: landing-carousel
status: stable
related: [landing-figure, landing-gallery, landing-lightbox]
---

# landing-carousel

> One full-feature, breakpoint-agnostic image slider. Touch swipe, mouse drag, keyboard, arrows, dots, optional thumbnails / peek / loop — each slide a `<landing-figure>`.

## Why this exists

Galleries on small screens want a swipeable slider, not a grid that collapses to a tall stack. Rather than a bespoke slider per section, `landing-carousel` is the single reusable slider — configured by inputs, consistent in look and a11y. It deliberately does **not** decide its own breakpoints: the consumer swaps it in where a slider is wanted (Selected Work uses the curated `landing-gallery` grid on laptop+ and swaps to this carousel below).

## Use when

- A set of 2+ figures should be browsed one-at-a-time (mobile project gallery, screenshot reel, testimonial-with-image).
- The consumer decides per breakpoint that a slider beats a grid.

## Don't use when

- A curated multi-image layout reads better as a grid → `landing-gallery`.
- The reader needs full-screen detail / zoom → `landing-lightbox` (can be layered on the figures).
- A single inline image → `<landing-figure>` directly.

## Behavior contract

- **Touch** — native CSS scroll-snap (momentum + flick for free).
- **Mouse drag** — pointer-drag on the track; **one gesture = at most one slide**. Travel is capped to a single neighbour, and release commits ±1 on a small displacement OR a quick flick (sensitive to light drags). This one-slide-per-gesture logic is shared in spirit with `landing-lightbox`.
- **Keyboard** — ←/→ move between slides when the track is focused.
- **Controls** — prev/next arrows (fade out at the ends unless `loop`), dot indicators, or an optional thumbnail filmstrip (`showThumbnails` replaces dots).
- **Peek** — optional sliver of the neighbouring slide as a "there's more" cue.
- **Loop** — optional wrap-around at the ends; arrows never disable.
- **a11y** — `aria-roledescription="carousel"`, per-slide "i of n" labels, a polite live region announcing the active slide, labelled controls.

## Inputs

| Input | Type | Default | Notes |
|---|---|---|---|
| `[images]` | `GalleryImage[]` | — (required) | `url` / `alt` / `caption` per slide. |
| `[(index)]` | `number` | `0` | Two-way active slide. |
| `[peek]` · `[loop]` · `[showThumbnails]` · `[showDots]` · `[showArrows]` | `boolean` | see component | Toggle features. |
| `[aspectRatio]` | string | `'4 / 3'` | Frame ratio (any valid CSS `aspect-ratio`). |
| `[numbered]` | `boolean` | `true` | FIG numbering on captions. |
| `[lightbox]` | `boolean` | `false` | Opt-in: each slide opens the shared `landing-lightbox` on tap/click. |
| `[lightboxGroup]` | string | per-instance | Lightbox group key; slides in one carousel navigate together. |
| `[ariaLabel]` | string | `'Image carousel'` | Carousel label. |

## Implementation rules

- Each slide is a `<landing-figure>` — never reimplement frame/caption styling.
- Responsiveness is the **consumer's** job: swap to this component by breakpoint via `BreakpointObserverService.isAtLeast('laptop')`; the carousel just does the slider job at whatever size it's mounted.
- Scroll/drag listeners attach in `afterNextRender` and run `runOutsideAngular`; scroll-driven index changes commit inside `NgZone.run` so the OnPush view updates. Don't move this work into the constructor (SSR has no DOM).
- The slide step is measured from the first two children (`offsetLeft` delta), not assumed — works with gaps/peek.

## Quality checklist

- [ ] One drag advances exactly one slide (long drag never skips to ±2); a light/short drag still advances.
- [ ] Touch swipe snaps cleanly; arrows disable at the ends (unless `loop`); dots/thumbnails track the active slide.
- [ ] ←/→ work when the track is focused; live region announces the active slide.
- [ ] Captions + FIG numbers render; mobile layout readable.
- [ ] Build (`nx build landing`) clean; no scroll-snap vs drag fights.
