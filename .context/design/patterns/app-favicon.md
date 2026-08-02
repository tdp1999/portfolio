---
name: App Favicon
category: pattern
tags: [brand, favicon, icon, theme, transparency, landing, console]
---

> **Universal kernel:** `→ skill patterns/theme-adaptive-icon` holds the portable material —
> the transparent-background contrast trap with its measured ratios, the adaptive-SVG recipe,
> the `color-scheme`-on-wrapper preview technique, the slots where transparency is forbidden,
> and the icon-geometry formula. This file keeps only what is true of _these two apps_.

## The split

| App         | Surface                        | Primary asset                 | Fallback                       | apple-touch / manifest                |
| ----------- | ------------------------------ | ----------------------------- | ------------------------------ | ------------------------------------- |
| **landing** | Solid, theme surface `#0a0d12` | `favicon.ico` + 16/32 PNG     | —                              | 180 PNG + manifest 192/512, all solid |
| **console** | **Transparent**                | `favicon.svg`, theme-adaptive | `favicon.ico`, accent monotone | none, deliberately                    |

**Boxed versus unboxed is the entire distinction between the two tabs.** The Monogram is
identical in both — same glyphs, same Dot, same accent. Do not add a second accent, recolour
the Dot, or shorten the mark to tell them apart; the surface already does it. See ADR-035.

Landing cannot follow console into transparency: its `manifest.webmanifest` declares launcher
icons and its head declares an `apple-touch-icon`, and both slots flatten alpha against a
surface the OS picks. Console has no manifest, which is the only reason it is free to go
transparent.

## Regenerating

Both sets come out of the `brand-identity` skill, Stage 2 only — the mark is unchanged, so the
glyph data is too:

```bash
node .brand-gen.run.mjs favicons          # landing, boxed
node .brand-gen.run.mjs console-favicons  # console, transparent
```

The skill's `SKILL.md` documents the two size knobs (viewBox padding, fit fraction) and why
they compound. Current values: landing `padding: -6` at 0.90, console `padding: -6` at 0.98.

## Living reference

`/ddl/favicon` in the console. It renders `/brand/favicon.svg` **itself** rather than copies,
so it cannot drift and adds no image assets to `public/`. When changing anything here, that
page needs no update — only its prose does.

## Anti-patterns

| Don't                                                         | Why                                                                                    |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Add a solid-surface variant to console for one slot           | It reintroduces the split identity landing is stuck with. Drop the slot instead        |
| Generate preview rasters into `public/` to compare candidates | Wrap the shipped file in `color-scheme` instead; exploration PNGs are not assets       |
| Judge a favicon from the 512px render                         | It is seen at 16px. Render at 16 and look at 16                                        |
| Reorder the `<link>` tags in `index.html`                     | The `.ico` is first on purpose so the SVG overrides it                                 |
