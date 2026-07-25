---
name: Navigation Disclosure
category: pattern
principles: [chunking-progressive-disclosure]
tags: [nav, header, mega-menu, disclosure, responsive, a11y, landing]
---

> **Universal kernel:** `→ skill patterns/navigation-disclosure` (button-not-`role=menu`,
> hover+click, Esc-returns-focus, click-outside, grouped links under headings, viewport-centred
> panel, featured-column count switch, panel→sheet floor, no duplicated global controls). This
> file keeps the shipped component wiring, the measured breakpoints, and the DDL source-of-truth
> link.

## The shipped realization

`landing-mega-menu` (`libs/landing/shared/ui/src/components/mega-menu/`) is this pattern for the
landing header "More" entry. Shape shipped 2026-07-24 (decision-record V9b):

- **Products column leads** — a preview screenshot tile that cross-fades to the icon+gradient
  tile on hover (thin mist, ~70% reveal, **theme-matched**), then a blurb + link. One product →
  featured card; two+ → stacked list (count-driven, `hasRail()` / featured template).
- **Then divided icon columns** for `Explore` and `Documents` — framed icon + self-explanatory
  label, **no hints, no badges**.
- Disclosure contract is the V8 contract (button + `aria-expanded`/`aria-controls`, **not**
  `role=menu`); opens on **hover AND click**; the panel is **viewport-centred**.

The mega-menu is the "More" nav slot's panel; there is no multi-column site footer (only
`footer-banner` / `footer-signature`), so the grouped IA lives entirely in this disclosure and
its mobile sheet.

## Measured responsive behaviour

Breakpoints per `contracts/responsive-contract.md` (mixins, never raw `@media`):

| Width | Behaviour |
| --- | --- |
| **laptop+ (≥1024)** | Full two-column panel (Products rail + Explore/Documents columns side by side) |
| **tablet (768–1023)** | Columns stack — Documents drops under Explore (`respond-down('laptop')`, **not** `'tablet'`: the menu is still visible here, the hamburger only takes over below 768) |
| **< tablet (<768)** | No floating panel — the hamburger **sheet** renders, grouped by the **same** sections (`moreSections()`); **no theme/language toggles** (the top bar owns them); own scroll + symmetric padding |

## Assets & wiring notes

- Theme-matched tiles: `apps/landing/public/menu/document-engine-{light,dark}.webp` (960×426).
  Both `<img>` render; the active theme shows one via `:host-context(html.dark)`. Hover fades
  `opacity: 1 → 0.3` (not `display`), off under reduced-motion.
- **DDL is source of truth and cannot drift:** `/ddl/mega-menu` renders the **real**
  `landing-mega-menu` in the V9b slot (with `align="center"` so the `ddl-shell--wide` overflow
  does not clip it), plus a "Layout & responsive rules" table documenting this contract. Change
  the shipped shape → the showcase moves with it in the same commit (DDL guardrail).
- Related: `overflow-disclosure` (content clamp, a different pattern), `record-detail-layout`
  (also uses progressive disclosure, different surface).
