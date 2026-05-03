# Task: Landing segmented control + DDL tabbed showcase pattern

## Status: done

## Goal
Build `landing-segmented` — an E5 segmented control primitive — and use it to retrofit the DDL into a per-family tabbed showcase: each component family on `/ddl` gets a Showcase / Prototypes / Usage trio so the page can serve both internal devs and public viewers.

## Context
DDL is graduating from a dev-only sandbox to a public-facing demo. We need a consistent way to present each component family: canonical use, optional interaction prototypes (when there are real options to compare), and usage rules. A segmented control is also a primitive landing pages will likely use elsewhere (project detail, uses page filters), so it earns its place in `libs/landing/shared/ui/`.

Visual reference: Apple-classic segmented control — recessed track, active segment slightly raised via tone (no box-shadow per project rule), mono-caps labels.

## Acceptance Criteria
- [x] `landing-segmented` (selector `landing-segmented`): standalone, OnPush, signal inputs/`model()` for two-way active binding
- [x] API: `[segments]` (required: `{id, label, disabled?}[]`), `[(active)]` (model, segment id), `[variant]` (`'apple' | 'hairline' | 'underline'`, default `'apple'`), `[ariaLabel]`, `[idPrefix]`
- [x] Three visual variants implemented: **A · Apple-classic** (recessed ink-1 track + raised ink-2 active segment, no shadow), **B · Hairline rectangle** (outlined group, vertical separators, active fills ink-2), **C · Indigo underline** (flat row with bottom border, active marked by 1px indigo underline)
- [x] Mono caps labels (JetBrains Mono, 0.06em tracking, uppercase) consistent with eyebrow/chip
- [x] ARIA: `role="tablist"` on root, `role="tab"` on buttons, `aria-selected`, `aria-controls`, `tabindex` follows roving-tabindex pattern, ArrowLeft/ArrowRight/Home/End keyboard nav
- [x] Focus-visible ring uses `--landing-accent` outline (matches button focus)
- [x] Disabled segment supported per-segment
- [x] DDL retrofit: at least 4 families (Typography, Interactive primitives, Label primitives, Content primitives) wrapped in the new tabbed pattern
- [x] DDL state per-family is URL-deep-linkable via query params (e.g. `/ddl?label=prototypes`)
- [x] `landing-segmented` itself has its own DDL section showing all three variants (Showcase / Prototypes / Usage)
- [x] Unit tests cover: default variant render, `[(active)]` two-way binding, click-to-select, keyboard nav (Arrow keys, Home, End), disabled segment skip, ARIA attributes

## Technical Notes
- Use `model<string>()` for `active` to support `[(active)]` shorthand at callsites.
- Per-family tab state lives in `DdlComponent` as signals; URL sync is one-way write on signal change (`router.navigate` with `queryParamsHandling: 'merge', replaceUrl: true`); URL is read once at construction.
- Naming convention for query params: family key = single lowercased word (`typography`, `interactive`, `label`, `content`, `segmented`).
- Default tab: `showcase`. Prototypes tab is rendered only when the family has prototypes; Usage tab is always present.
- No box-shadow on active segment — use tonal lift (ink-1 → ink-2) and optional hairline border. Per project rule.
- Apple-classic on dark: track sits at ink-1 (recessed against ink-0 page), active at ink-2 (raised). Hover on inactive: text brightens one tier (text-500 → text-300). Active text: text-300.

## Files to Touch
- `libs/landing/shared/ui/src/components/segmented/segmented.component.ts`
- `libs/landing/shared/ui/src/components/segmented/segmented.component.scss`
- `libs/landing/shared/ui/src/components/segmented/segmented.component.spec.ts`
- `libs/landing/shared/ui/src/components/segmented/index.ts`
- `libs/landing/shared/ui/src/index.ts` (add export)
- `apps/landing/src/app/pages/ddl/ddl.component.ts` (tab state signals + URL sync)
- `apps/landing/src/app/pages/ddl/ddl.component.html` (retrofit four families + new segmented showcase)
- `apps/landing/src/app/pages/ddl/ddl.component.scss` (clean up, segmented prototype demo styles if needed)

## Dependencies
- 274 (tokens)
- 278, 279, 280 (the families being retrofitted)

## Verification: full

## Complexity: M

## Progress Log
- [2026-05-03] Started — landing-segmented as a real E5 primitive (sequential after 280, not 304, to keep E5 grouped).
- [2026-05-03] Built `landing-segmented` with 3 variants (apple-classic / hairline / underline), `model<string>()` for two-way active binding, ARIA tablist semantics, roving tabindex, ArrowLeft/Right/Home/End keyboard nav, disabled-segment skip.
- [2026-05-03] Apple-classic on dark: ink-1 track inside hairline border, ink-2 active segment — tonal lift instead of box-shadow, per project rule.
- [2026-05-03] Refactored DDL into per-family tabbed pattern. Four families wrapped: Typography (Showcase / Usage), Interactive primitives (Showcase / Prototypes [arrow A·B·C] / Usage), Label primitives (Showcase / Prototypes [chip A·B·C + status A·B·C] / Usage), Content primitives (Showcase / Usage with section-rule explainer).
- [2026-05-03] Added new Segmented Control DDL family (Showcase / Prototypes with all 3 variants / Usage) — the primitive's own dogfood.
- [2026-05-03] Per-family tab state lives in `DdlComponent` signals; URL deep-link sync via `router.navigate` with `replaceUrl: true` + `queryParamsHandling: 'merge'`. Initial value read from `route.snapshot.queryParamMap` per family.
- [2026-05-03] 11 new unit tests (segmented), 17 suites / 157 total tests pass; landing build succeeds.
- [2026-05-03] Done — all ACs satisfied.
