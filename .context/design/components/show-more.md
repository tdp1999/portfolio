---
component: landing-show-more
status: stable
related: [landing-toc-sidebar, landing-figure]
---

# landing-show-more

> Reusable overflow disclosure. Projects any content; when it exceeds `maxHeight` it either clamps behind a **See more / See less** toggle (`mode="toggle"`) or caps and scrolls inside the box (`mode="scroll"`). The chrome appears only when the content actually overflows.
>
> Live showcase: `/ddl/show-more` (both modes, no-overflow case, fade off, even-height 2-col rail pattern).

## Why this exists

Secondary rails (project metadata, a long table of contents) can dominate the page on narrow viewports, pushing the primary reading content far down. A height clamp with an explicit expand gives the reader the gist plus a one-tap path to the full list, without each consumer reinventing measure-and-collapse logic. It is **content-agnostic** (projects whatever you pass) and **self-measuring** (no manual "isLong" flag from the consumer).

## Use when

- A rail/block is useful but long on small screens — project Details (meta + links), an "On this page" TOC, a tag cloud.
- You want the clamp to be **conditional**: short content should render untouched, with no stray toggle.
- The content height is not known ahead of time (localized strings, variable list length).

## Don't use when

- The content must always be fully visible (primary reading copy, legal text).
- You need a labelled, independently-addressable section toggle — use a native `<details>`/`<summary>` or an accordion instead.
- The clamp height would be so small it hides more than it shows; pick a `maxHeight` that reveals a meaningful preview.

## Behavior contract

- **Two modes** — `mode="toggle"` (default) clamps behind a button; `mode="scroll"` caps at `maxHeight` and lets the overflow scroll _inside_ the box (no button, hidden scrollbar). Switch `mode` **reactively by breakpoint** (bind to `BreakpointObserverService.isAtLeast(...)`) when one device wants a disclosure and another wants a fixed-height scroll block.
- **Clamp (toggle mode)** — when the projected content's `scrollHeight` exceeds `maxHeight` (px), the content box is capped to `maxHeight` with `overflow: hidden` and (default) a bottom gradient fade, and a **See more** toggle renders below it.
- **Scroll (scroll mode)** — capped at `maxHeight` with `overflow-y: auto`; no toggle, no fade. A fixed-height block whose overflow scrolls in place; combine with `align-items: stretch` on a flex-row parent when you want neighbouring columns to stay the **same height**. (Project-detail itself uses `toggle` everywhere; this mode is the alternative for fixed-height contexts.)
- **No-overflow → no chrome** — if the content fits within `maxHeight`, nothing is clamped/capped and **no toggle renders** (either mode).
- **Toggle** — flips between collapsed and expanded; label is `moreLabel` / `lessLabel` (default `See more` / `See less`); the chevron rotates 180° when expanded. `aria-expanded` reflects state; `aria-controls` points at the content region.
- **SSR / no-JS safe** — renders **expanded** on the server (full content reachable for crawlers and no-JS readers); on hydration it measures the content and collapses if it overflows. The collapse is a one-time auto action — after that the user owns the expanded state (a resize won't re-collapse what they opened).
- **Re-measures on resize** — a `ResizeObserver` re-evaluates overflow when the content (or its container, e.g. a breakpoint reflow from stacked to a 2-col row) changes size.
- **Motion** — the chevron/colour transitions are removed under `prefers-reduced-motion`.

## Implementation rules

- Inputs: `maxHeight` (number px, default `300`), `mode` (`'toggle' | 'scroll'`, default `'toggle'`), `moreLabel`, `lessLabel`, `fade` (default `true`).
- It clamps the **host content box**; give the projected content its own internal spacing — don't rely on the clamp for layout.
- Pick `maxHeight` so the preview is meaningful (show a few rows, not one). For a 2-col rail row, a smaller cap keeps both rails even.
- Place it around the _content_, not around a wrapper that adds borders/padding you want always visible — the fade applies to the projected content only; the toggle sits outside the clamp.
- It re-measures via `ResizeObserver`; when toggled by a breakpoint `display` swap (rendered in two places, one hidden) the hidden instance reports zero height and shows no chrome until revealed — safe to render in both a sidebar and a rail.

## Quality checklist

- [ ] `mode="toggle"`: long content clamps with a fade + visible **See more**; short content renders with no toggle.
- [ ] `mode="scroll"`: long content caps + scrolls internally (no button); in a flex row with `align-items: stretch`, a short column and a long column render at equal heights.
- [ ] Toggle flips label + chevron; `aria-expanded` / `aria-controls` correct; keyboard-focusable.
- [ ] SSR/no-JS renders expanded (content reachable); collapses once on hydration when it overflows.
- [ ] Resizing across a breakpoint (stacked ↔ 2-col row) re-measures and clamps/un-clamps correctly.
- [ ] `prefers-reduced-motion` removes the transitions.
