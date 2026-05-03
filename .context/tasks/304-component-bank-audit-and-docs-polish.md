# Task: Component bank audit, landing/console split, and design-doc polish

## Status: pending

## Goal
Audit every component currently exported from `libs/landing/shared/ui/` and `libs/console/shared/ui/` against `.context/design/components/`, identify what's missing, restructure the bank to clearly separate landing vs console, write the highest-priority missing docs (starting with `landing-segmented`), and patch the small docs gaps from the E5 segmented-control session.

## Context
The component bank under `.context/design/components/` is sparsely populated — only `chips/` (a console family) and `segmented-control.md` (also console) exist as docs, while `libs/landing/shared/ui/` ships ~15 components and `libs/console/shared/ui/` ships ~25. Worse, there's now a naming collision in spirit: both surfaces have a "segmented" component (`landing-segmented` and `console-segmented-control`) but no folder convention prevents them from blurring together. We need a clear domain-scoped layout, an explicit gap list, and at least the most-used new primitives documented before the bank becomes harder to maintain.

This task also closes three small tails from the task 280b session that didn't justify their own task:
1. `landing-segmented` has no component-bank doc.
2. `CLAUDE.md` doesn't reference the new `.context/design/landing-typography.md`.
3. `.context/design/landing.md` doesn't link to `landing-typography.md`, so the typography doc isn't discoverable from the landing index.

## Acceptance Criteria

### Restructure
- [ ] Component bank split into domain subfolders:
  - `.context/design/components/landing/` — all docs for components in `libs/landing/shared/ui/`
  - `.context/design/components/console/` — all docs for components in `libs/console/shared/ui/`
  - `.context/design/components/shared/` — only if a component is genuinely cross-domain (avoid creating empty folders)
- [ ] Existing docs migrated:
  - `chips/` → `console/chips/` (file contents unchanged; verify links from elsewhere are updated)
  - `segmented-control.md` → `console/segmented-control.md`
- [ ] Each domain subfolder has an `_index.md` listing its components with one-line hooks (mirrors `MEMORY.md` style)
- [ ] Frontmatter `component:` field already includes the domain prefix (e.g. `console-segmented-control`) — keep that convention; folder location is the visible signal, frontmatter is the machine-readable one

### Audit
- [ ] An audit table is produced inside this task (or in a sibling `.md` file in `.context/design/components/_audit.md`) that lists EVERY component in `libs/landing/shared/ui/` and `libs/console/shared/ui/`, with columns: `name`, `domain` (landing/console), `bank doc?` (✅/❌), `priority` (high/med/low), `notes`
- [ ] Audit must distinguish primitives (e.g. `landing-button`, `console-toast`) from layouts (`main-layout`, `blank-layout`) and from composites (`asset-grid`, `media-picker-dialog`) — layouts and composites may not need full bank docs but should be marked as such
- [ ] Audit notes cross-domain twins explicitly (e.g. landing-segmented vs console-segmented-control) so readers see the parallel and the differences

### Required new docs (this task)
- [ ] `landing/landing-segmented.md` — full doc with frontmatter (`component: landing-segmented`, `status: stable`), why-it-exists, use-when, don't-use-when, API table (segments / active model / variant / ariaLabel / idPrefix), variant rules (apple/hairline/underline), keyboard nav, ARIA notes, "shipped from task 280b prototype A"
- [ ] `landing/_index.md` covers at minimum: button, link, icon-arrow, chip, eyebrow, status-dot, figure, pull-quote, section-rule, segmented (the documented or to-be-documented surfaces) — entries for not-yet-documented components mark them as ❌ pending so the gap is visible

### Optional but encouraged in this task (mark as stretch)
- [ ] Stub docs (frontmatter + 1-line description only) for the highest-frequency landing primitives that are still missing: chip, eyebrow, status-dot, figure, pull-quote, section-rule. Full bodies can be filled in follow-up per-component tasks.

### Docs polish
- [ ] `CLAUDE.md` "References" or design section references `.context/design/landing-typography.md` (1-line addition)
- [ ] `.context/design/landing.md` adds a typography pointer near the top (e.g. "Typography: see `landing-typography.md`")
- [ ] No dangling links — verify any doc that references `chips/` or `segmented-control.md` paths still resolves after the move

## Technical Notes
- Use the existing `chips/_overview.md` + `segmented-control.md` as style references. Frontmatter format: `---\ncomponent: <name>\nstatus: stable|wip|deprecated\nrelated: [...]\n---`.
- Body sections to standardize: "Why this exists" → "Use when" → "Don't use when" → "API" → "Behavior" → "Accessibility" → optional "Variants" → optional "Migration / shipped from".
- Don't generate doc bodies for layouts (`main-layout`, `blank-layout`, `long-form-layout`) or pure containers in this task — note in audit, defer to a layout-specific task.
- `chips/` family overview applies cross-bank: when moved into `console/chips/`, leave a redirect note at top of `_overview.md` if any landing chip will eventually share rules. (Currently `landing-chip` is its own thing — different visual contract.)

## Files to Touch
- `.context/design/components/landing/` (new)
- `.context/design/components/console/` (new)
- `.context/design/components/console/chips/` (moved from `components/chips/`)
- `.context/design/components/console/segmented-control.md` (moved)
- `.context/design/components/landing/landing-segmented.md` (new)
- `.context/design/components/landing/_index.md` (new)
- `.context/design/components/console/_index.md` (new)
- `.context/design/components/_audit.md` (new — full inventory)
- `CLAUDE.md`
- `.context/design/landing.md`

## Dependencies
- 280b (segmented-control component shipped)
- 279, 280 (the chip / status-dot / figure / pull-quote / section-rule primitives ready to be documented)

## Verification: test

## Complexity: M

## Progress Log
