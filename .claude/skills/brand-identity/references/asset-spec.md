# Asset spec — rationale & dimensions

The v1 Asset set, why each size exists, and the layout rules. All derive from the
Master SVG builders (`monogramSvg` / `signatureSvg`) at the Brand's Theme.

## Favicon set

| Size | Purpose |
| --- | --- |
| 16 | classic browser tab |
| 32 | hi-dpi tab, taskbar |
| 48 | Windows site icon |
| 180 | `apple-touch-icon` (iOS home screen) |
| 192 | Android / PWA `manifest` icon |
| 512 | PWA splash / store listing |

- **Composition:** the Monogram is rendered to PNG at ~88% of the square width, then
  `composite`-centred on a solid `surface` square. The mark is wide (~1.57:1), so it
  occupies full width and is vertically centred — never stretched to fill the square.
- **`.ico`** packs 16/32/48 (the sizes OSes pick from for tabs/shortcuts).
- **`favicon-180.png`** doubles as `apple-touch-icon`; it is intentionally **opaque**
  (solid surface) because iOS does not honour transparency and adds its own rounding.

## OG / social image

- **1200×630** (the universal `og:image` / Twitter `summary_large_image` ratio).
- Signature (Monogram + Wordmark, horizontal) rendered at ~62% canvas width, centred on
  the surface. Kept minimal — no tagline in v1; add one later if the card needs context.

## Email signature

- **PNG** at 2× the 320px display width (retina-crisp in mail clients).
- **HTML** is a `<table>` snippet (email-safe; no flexbox/grid) referencing the hosted
  PNG via `SIGNATURE_URL`, with the Wordmark as a text fallback line.

## Colour resolution

- `accent` = `brand.theme.accent` (the Dot).
- `surface` / `ink` derive from `brand.theme.mode`:
  - `dark` → surface `#0a0d12`, ink `#e7e9ee`
  - `light` → surface `#fbfbfd`, ink `#0a0d12`
- Standalone SVG can't inherit `currentColor`, so `ink` is passed explicitly to the
  Master builders.
