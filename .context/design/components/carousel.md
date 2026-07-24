---
component: landing-carousel
status: stable
related: [landing-figure, landing-gallery, landing-lightbox]
---

# landing-carousel

> One full-feature, breakpoint-agnostic slider. Touch swipe, mouse drag, keyboard, arrows, dots, optional thumbnails / peek / loop. Two slide sources: **image mode** (`[images]` → `<landing-figure>` per slide) or **content mode** (`[items]` + `<ng-template landingCarouselSlide>` → any projected content, e.g. cards).

> **Universal kernel:** the one-reusable-slider rule, one-slide-per-gesture arbitration, and
> the ~6px click-through threshold live in `→ skill patterns/carousel-and-gestures`. This doc
> keeps the `landing-carousel` contract, inputs, and Angular/SSR wiring.

## Why this exists

Galleries on small screens want a swipeable slider, not a grid that collapses to a tall stack. Rather than a bespoke slider per section, `landing-carousel` is the single reusable slider — configured by inputs, consistent in look and a11y. It deliberately does **not** decide its own breakpoints: the consumer swaps it in where a slider is wanted (Selected Work uses the curated `landing-gallery` grid on laptop+ and swaps to this carousel below).

## Use when

- A set of 2+ figures should be browsed one-at-a-time (mobile project gallery, screenshot reel, testimonial-with-image).
- A set of 2+ **cards/panels** should swipe instead of stacking (mobile featured strip) → **content mode** with `[items]` + `landingCarouselSlide`.
- The consumer decides per breakpoint that a slider beats a grid.

## Don't use when

- A curated multi-image layout reads better as a grid → `landing-gallery`.
- The reader needs full-screen detail / zoom → `landing-lightbox` (can be layered on the figures).
- A single inline image → `<landing-figure>` directly.

## Behavior contract

- **Slide source** — *image mode*: `[images]`, each slide a `<landing-figure>`. *Content mode*: `[items]` + an `<ng-template landingCarouselSlide let-item let-i="index">`, each slide the projected template (cards, panels…). The two are mutually exclusive — a projected slide template switches the carousel to content mode; otherwise it renders images. Thumbnails are image-only.
- **Touch** — native CSS scroll-snap (momentum + flick for free).
- **Mouse drag** — pointer-drag on the track; **one gesture = at most one slide**. Travel is capped to a single neighbour, and release commits ±1 on a small displacement OR a quick flick (sensitive to light drags). This one-slide-per-gesture logic is shared in spirit with `landing-lightbox`.
- **Click-through** — drag only **engages past a ~6px move**, and pointer capture is deferred until then, so a plain click/tap on a slide reaches its own content (e.g. a content-mode card's link navigates). A real drag suppresses the trailing click so it can't fire a link. Never capture the pointer on `pointerdown` — that swallows the click.
- **Keyboard** — ←/→ move between slides when the track is focused.
- **Controls** — prev/next arrows (fade out at the ends unless `loop`), dot indicators, or an optional thumbnail filmstrip (`showThumbnails` replaces dots).
- **Peek** — optional sliver of the neighbouring slide as a "there's more" cue.
- **Loop** — optional wrap-around at the ends; arrows never disable.
- **a11y** — `aria-roledescription="carousel"`, per-slide "i of n" labels, a polite live region announcing the active slide, labelled controls.

## Inputs

| Input | Type | Default | Notes |
|---|---|---|---|
| `[images]` | `GalleryImage[]` | `[]` | Image mode — `url` / `alt` / `caption` per slide. |
| `[items]` | `unknown[]` | `[]` | Content mode — paired with a `landingCarouselSlide` template. |
| `landingCarouselSlide` | `<ng-template>` | — | Per-slide renderer for content mode; context `{ $implicit: item, index }`. |
| `[(index)]` | `number` | `0` | Two-way active slide. |
| `[peek]` · `[loop]` · `[showThumbnails]` · `[showDots]` · `[showArrows]` | `boolean` | see component | Toggle features. |
| `[aspectRatio]` | string | `'4 / 3'` | Frame ratio (any valid CSS `aspect-ratio`). |
| `[numbered]` | `boolean` | `true` | FIG numbering on captions. |
| `[lightbox]` | `boolean` | `false` | Opt-in: each slide opens the shared `landing-lightbox` on tap/click. |
| `[lightboxGroup]` | string | per-instance | Lightbox group key; slides in one carousel navigate together. |
| `[ariaLabel]` | string | `'Image carousel'` | Carousel label. |

## Implementation rules

- In **image mode**, each slide is a `<landing-figure>` — never reimplement frame/caption styling.
- In **content mode**, the consumer projects the slide body via `landingCarouselSlide`; the carousel still owns the slide wrapper (`.landing-carousel__slide--content`, which is `display:flex` so the projected card stretches to the tallest slide's height). Keep the card's own styling in the consumer's stylesheet — projected content carries the consumer's encapsulation. Arrows move to a bottom control row in content mode (overlaying a card would cover its text/tap area); image mode keeps the overlay arrows.
- **Cards per view** — peek slide width is `--landing-carousel-peek-basis` (default `88%`, ~1-up). A consumer can show more per view at wider breakpoints by overriding it (e.g. the blog strip sets `46%` on tablet for 2-up).
- **Dots assume one card per view** — they track the slide nearest the viewport centre, which is ambiguous with 2+ cards visible. When a consumer goes multi-up, drive `[showDots]` off per breakpoint and rely on arrows + peek (the blog strip shows dots on mobile only).
- **Controls hide when nothing overflows** — arrows and dots only render when the track actually scrolls (`scrollWidth > clientWidth`, measured + `ResizeObserver`-tracked). So a multi-up view that already fits every card (e.g. 2-up with only 2 cards) shows no arrows; the same view with more cards does.
- Responsiveness is the **consumer's** job: swap to this component by breakpoint via `BreakpointObserverService.isAtLeast('laptop')`; the carousel just does the slider job at whatever size it's mounted.
- Scroll/drag listeners attach in `afterNextRender` and run `runOutsideAngular`; scroll-driven index changes commit inside `NgZone.run` so the OnPush view updates. Don't move this work into the constructor (SSR has no DOM).
- The slide step is measured from the first two children (`offsetLeft` delta), not assumed — works with gaps/peek.

## Quality checklist

- [ ] One drag advances exactly one slide (long drag never skips to ±2); a light/short drag still advances.
- [ ] Touch swipe snaps cleanly; arrows disable at the ends (unless `loop`); dots/thumbnails track the active slide.
- [ ] ←/→ work when the track is focused; live region announces the active slide.
- [ ] Captions + FIG numbers render; mobile layout readable.
- [ ] Build (`nx build landing`) clean; no scroll-snap vs drag fights.
