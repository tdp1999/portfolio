# Console Spacing & Typography Cookbook

> Actionable decision rules for console pages. No research — just pick the right value.
> Source of truth for spacing: `scale-contract.md`. Source of truth for layout: `console.md`.

---

## Spacing — Pick the Right Gap

Use this table at every point of decision. Ask: "What is the relationship between these two elements?"

| Relationship | Tailwind class | px | Example |
|---|---|---|---|
| Icon → its label | `gap-2` | 8 | Scrollspy icon + text, button icon + text |
| Bilingual field pair (EN / VI) | `gap-3` | 12 | Two mat-form-fields for the same field |
| **Fields within a form group** | `gap-4` | 16 | Name EN + Name VI, or unrelated adjacent fields |
| **Between form groups / subsections** | `gap-6` | 24 | "Basic info" group → "Display name" group |
| **Between major sections / cards** | `gap-8` | 32 | Section card → section card (baked into `long-form-layout`) |
| Between independent page regions | `gap-12` | 48 | Page header → scrollspy+content area |

**Rule of thumb:** each level up doubles the gap. Violating this collapses hierarchy.

### What's already baked in — do NOT re-add

| Primitive | What it already applies |
|---|---|
| `console-section-card` | `p-6` (24px) header + form + footer padding |
| `console-section-card` | header zone (`--color-surface-elevated`) + form zone (`--color-surface`) + footer zone (`--color-surface-elevated`) — three distinct visual bands |
| `console-section-card` | `border: 1px solid var(--color-border)` + `border-radius: 12px` — do NOT add extra borders inside |
| `console-section-card` | form content capped at `max-width: 672px` (max-w-2xl) |
| `console-long-form-layout` | `gap-8` (32px) between section cards — requires `<div content class="flex flex-col gap-8">` wrapper in the page |
| Angular Material density `-2` | Label-to-input padding inside `mat-form-field` |

Do not add padding/gap **inside** `mat-form-field` — Material already handles it at density `-2`.

---

## Typography — Pick the Right Class

All classes live in `base/components.scss`. Use exactly these; do not compose ad-hoc.

| Slot | Class | Looks like |
|---|---|---|
| Page H1 | `.text-page-title` | 30px bold, tight tracking |
| Section card title | `.text-section-heading` | 18px semibold |
| Card/dialog header | `.text-card-title` | 16px semibold |
| Description / helper text | `.text-body` + `text-text-secondary` | 14px, gray |
| Form field label (custom) | `.text-body` | 14px, primary text |
| Timestamp, hint, caption | `.text-caption` | 12px, muted |
| Scrollspy label | `.text-body` (14px) | Already set in `.scrollspy-rail__item` |
| Status badge | `.text-badge` | 10px bold uppercase |

**Decision rule:** if it labels a section card → `.text-section-heading`. If it describes/helps → `.text-body text-text-secondary`. If it's fine print → `.text-caption`.

---

## Surface + Text Pairings

| Surface token | Tailwind bg | Text to use | Do NOT use |
|---|---|---|---|
| `--color-background` | `bg-background` | `text-text`, `text-text-secondary` | `text-text-muted` for body copy |
| `--color-surface-elevated` | — (section card bg) | `text-text`, `text-text-secondary` | hardcoded hex |
| Inside error banner | `bg-error-container` | `text-error` (via token) | `text-text-muted` |
| Inside success label | — | `text-success` (via token) | — |

**WCAG AA floor:** `text-text-secondary` (`#4b5563` light / `#94a3b8` dark) on `--color-surface-elevated` passes 4.5:1.  
`text-text-muted` is for captions only — never use it for body copy or field descriptions.

---

## Max-Width Rules

| Context | Rule |
|---|---|
| Console long-form page wrapper | No max-width (fluid — handled by `console-long-form-layout`) |
| Section card form column | No extra max-width needed — card's 65% column + page margins keep lines ≤ ~70 chars |
| If form column feels too wide | Add `max-w-2xl` (`max-width: 672px`) on the form slot's inner wrapper |
| Auth / narrow forms | `max-w-md` (448px) |

---

## Material Density `-2` Interaction

The console global theme sets `$density: -2` on all form fields. This means:

- Form-field height: **48px** (not 56px default)
- Internal padding already applied — **do not** add `pt-*` / `pb-*` to inputs
- Use `gap-4` (16px) **between** `mat-form-field` elements, not tighter

If a section feels cramped: the problem is almost never field density. Check gap between **groups** first (`gap-4` → `gap-6`).

---

## Checklist Before Reporting Done (Console HTML/SCSS)

- [ ] No hardcoded `gap:`, `padding:`, or `margin:` px values — use Tailwind spacing classes
- [ ] Section card title uses `.text-section-heading`
- [ ] Description text uses `.text-body text-text-secondary` (not muted)
- [ ] No extra wrapper padding inside `console-section-card` — `p-6` is already there
- [ ] Screenshot taken after non-trivial layout changes (see `visual-feedback.md`)
