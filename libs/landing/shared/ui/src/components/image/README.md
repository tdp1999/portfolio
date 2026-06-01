# `landing-image`

A low-level responsive `<picture>` primitive: `srcset` + lazy-loading + aspect-ratio
reservation (no CLS) + **multi-format tiering** (e.g. WebP → JPG fallback).

Part of the responsive system — see `.context/design/responsive-contract.md` §13.

---

## `landing-image` vs `landing-figure` — which do I use?

They have **distinct, non-overlapping** responsibilities. Pick by intent:

| Use… | When | Gives you |
| --- | --- | --- |
| **`landing-figure`** | Content imagery that is part of the prose / editorial flow — blog figures, galleries, anything that may carry a **caption** or **figure number**. | Semantic `<figure>` + `<figcaption>`, Cloudinary 1×/2× `srcset`, aspect-ratio/fill. **This is the default for content.** |
| **`landing-image`** | A **raw image** with no caption semantics — hero/banner art, decorative imagery, OG images, or any **self-hosted asset that needs multiple formats** (WebP→JPG) or precise `srcset` control. | Bare `<picture>`, manual N-width *or* explicit `srcset`, multi-format `<source>` tiering. |

Rule of thumb:
- **Needs a caption / lives in prose / Cloudinary-served?** → `landing-figure`.
- **No caption, want `<picture>` multi-format or self-hosted widths?** → `landing-image`.

`landing-image` is intentionally *not* a `<figure>`; if you wrap it in your own
`<figure>`/`<figcaption>`, that's fine, but for standard captioned content prefer
`landing-figure`.

---

## Two srcset modes

### (a) Manual N-width — self-hosted assets

`src` is a **base path WITHOUT extension**. The component generates
`…-{width}.{format} {width}w` for each format. Modern formats render as
`<source>`; the **last** format is the `<img>` fallback.

```html
<landing-image
  src="/assets/projects/aurora-hero"
  alt="Aurora dashboard overview"
  [widths]="[480, 960, 1920]"
  [formats]="['webp', 'jpg']"
  sizes="(min-width: 64rem) 960px, 100vw"
  [width]="1920"
  [height]="1080"
/>
```

Expects these files to exist (manual asset prep — no build pipeline):

```
/assets/projects/aurora-hero-480.webp   /assets/projects/aurora-hero-480.jpg
/assets/projects/aurora-hero-960.webp   /assets/projects/aurora-hero-960.jpg
/assets/projects/aurora-hero-1920.webp  /assets/projects/aurora-hero-1920.jpg
```

Renders:

```html
<picture>
  <source type="image/webp" srcset="…-480.webp 480w, …-960.webp 960w, …-1920.webp 1920w" sizes="…" />
  <img src="…-1920.jpg" srcset="…-480.jpg 480w, …-960.jpg 960w, …-1920.jpg 1920w" … />
</picture>
```

### (b) Explicit srcset — URL-transform CDNs (Cloudinary, etc.)

Pass a ready-made `srcset` string. `widths`/`formats` are ignored, no `<source>`
tags are emitted, and `src` is used verbatim as the fallback.

```html
<landing-image
  [src]="cdnUrl"
  alt="…"
  [srcset]="cdnSrcset"
  sizes="100vw"
  [aspectRatio]="'16 / 9'"
/>
```

> For Cloudinary content images you usually want **`landing-figure`** instead —
> it already builds the Cloudinary srcset for you. Reach for mode (b) here only
> when you need a bare `<picture>` without figure semantics.

---

## Inputs

| Input | Type | Default | Notes |
| --- | --- | --- | --- |
| `src` *(required)* | `string` | — | Base path w/o ext (mode a) or full URL (mode b). |
| `alt` *(required)* | `string` | — | Empty string for decorative images. |
| `widths` | `number[]` | `[480, 960, 1920]` | Mode (a) only. |
| `formats` | `string[]` | `['webp', 'jpg']` | Modern → fallback; last is the `<img>` format. |
| `srcset` | `string` | `''` | Set → mode (b). |
| `sizes` | `string` | `''` | The `sizes` attribute for `srcset` selection. |
| `aspectRatio` | `string` | `''` | e.g. `'16 / 9'` — reserves space when width/height absent. |
| `fill` | `boolean` | `false` | Fill parent via `object-fit: cover`. |
| `width` / `height` | `number \| null` | `null` | Reserve space (preferred over `aspectRatio` when known). |
| `loading` | `'lazy' \| 'eager'` | `'lazy'` | Native lazy-loading. |
| `preload` | `boolean` | `false` | **Above-the-fold shortcut** → eager + `decoding="sync"` + `fetchpriority="high"`. |

## Avoiding layout shift (CLS)

Always pass **either** `width` + `height` **or** `aspectRatio`. The `<img>` is
`display:block; width:100%; height:auto`, so reserving the ratio prevents reflow
as the image loads.

## Above-the-fold images

Set `[preload]="true"` for the LCP image (hero). For the strongest effect also add
a `<link rel="preload" as="image">` in the document head — `preload` here only
controls the element's own fetch priority, not the document preload hint.
