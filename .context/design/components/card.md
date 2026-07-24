---
component: landing-card
status: stable
related: [landing-background, landing-container]
---

# landing-card

> The translucent surface panel for landing sections that sit over a decorative background (`landing-background`). Optional `tilt` adds 3D rotate-on-hover with an accent glow.

> **Universal kernel:** the "rich effects must degrade + stay off the main thread" stance is
> `→ skill taste/expensive-effects-and-progressive-enhancement`; to diagnose/fix the scroll jank
> this tiering prevents, use the `diagnose-scroll-jank` skill (decision E — cross-link, don't
> duplicate). This doc keeps the project's concrete surface tiering and `landing-card` wiring.

## Why this exists

Landing sections layer content panels over decorative backgrounds (aurora blobs, blueprint grid). `landing-card` is the single reusable panel for that job, so surface treatment (fill, border, radius, glass) stays consistent instead of being re-styled per section.

## Use when

- A block of content needs a defined surface over a `landing-background` (bio grid, contact card, stat panels).
- The section wants the "glass over aurora" look at desktop sizes.

## Don't use when

- The content reads fine directly on the page background (no surface needed).
- A pill / chip / status label → use the label primitives instead.

## Behavior contract

- **Surface tiering by breakpoint (perf-critical):**
  - **mobile + tablet (`< laptop`, base):** flat near-opaque fill (`--landing-surface-elevated` at 90%), **no `backdrop-filter`**.
  - **laptop+ (`≥ 1024px`):** translucent glass — `backdrop-filter: blur(24px) saturate(120%)` over a 3% fill.
- **`tilt`** — on hover, `perspective` rotate + accent-mixed glow `box-shadow`. Disabled under `prefers-reduced-motion`.
- Host stretches to its grid/flex cell (`height: 100%`) so multi-card rows align at equal height.

## Why glass is gated to laptop+

`backdrop-filter` cannot be cached: every scroll frame it re-samples and re-blurs whatever is painted behind the card. With several cards stacked over a `blur(120px)` aurora (e.g. the home Bio Card Grid — up to 4 cards in view at tablet's 2-col layout), mobile/tablet GPUs drop frames badly — worse at Retina DPR (blur work scales with physical pixels) and 120Hz (≈8 ms frame budget). A flat fill composites cheaply because the blurred background stays a cached, just-translated layer. Laptop/desktop GPUs (typically plugged in) absorb the glass cost, so the effect is restored at `laptop`+.

## Inputs

| Input | Type | Default | Notes |
|---|---|---|---|
| `[tilt]` | `boolean` | `false` | Adds 3D rotate-on-hover + accent glow. |

## Implementation rules

- Never hard-code `backdrop-filter` on a card consumer to "force glass" on small screens — it reintroduces the scroll jank this tiering exists to prevent.
- The breakpoint split uses `@include bp.respond-to('laptop')` (`@use 'base/breakpoints' as bp`), per the responsive contract — never a raw `@media`.
- Fills are theme-relative tokens (`--landing-surface-elevated`, `--landing-text-300`); the card works in dark and light without per-theme overrides.
- The background blur lives on `landing-background`, not the card — keep decorative blur out of the card so it stays a cheap surface.

## Quality checklist

- [ ] Mobile + tablet: scrolling a section of cards over `landing-background` is smooth (no jank); cards are flat, text contrast holds.
- [ ] Laptop+: glass `backdrop-filter` is back; aurora reads softly through the panel.
- [ ] `tilt` hover rotates + glows on desktop; honors `prefers-reduced-motion`.
- [ ] Cards in a row align at equal height.
- [ ] Build (`nx build landing`) clean.
