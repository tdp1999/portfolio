---
name: component-bank
description: |
  Create or update a component design doc in `.context/design/components/`. Captures behavior contract,
  implementation rules, and quality checklist for components worth documenting (CVA wrappers,
  shared primitives, components with non-obvious rules). Triggers: "doc this component",
  "create component doc", "add to component bank", "/component-bank".
---

# Component Bank

Maintain the per-component design bank under `.context/design/components/`. Each doc captures *agreements and rules* — not API surface, not visual spec. Goal: portable across stacks, evergreen across refactors.

## Input

`$ARGUMENTS` — one of:
- A **component name with selector** (e.g., `console-tag-input`)
- A **file path** to a component (e.g., `libs/console/shared/ui/src/lib/tag-input/tag-input.component.ts`)
- Empty — ask the user which component to doc

## When to use

Create a doc when **any** of these are true:
- The component has been discussed for >5 minutes (decisions worth preserving)
- It wraps an external primitive with non-obvious rules (CVA wrappers, accessibility hacks)
- ≥3 callsites exist (reuse threshold)
- It has an anti-pattern history (someone tried wrong way once)
- It belongs to a family where siblings are already documented

Skip when: the component is a thin layout helper, a presentational dumb component, or has no rules code can't already encode.

## Workflow

### Step 1 — Identify component

If a path is given, derive the selector from the `@Component({ selector: '...' })` decorator and read the surrounding files (`.ts`, `.html`, `.scss`).

If a name is given, find the component with Glob then Read.

If neither, ask the user.

### Step 2 — Detect family

Look at `.context/design/components/` for an existing folder matching the component family (e.g. `chips/`, `forms/`, `layout/`). If a family folder exists:
- Read `_overview.md` to learn family-wide rules — the new doc must not repeat them.
- Place the new doc in that family folder.

If no folder fits and the component is a clear sibling of one not-yet-grouped component, propose creating a family folder and migrating the existing one. Ask the user before restructuring.

If the component stands alone, place it directly under `.context/design/components/<name>.md`.

### Step 3 — Draft

Use the template below. Sections are **modular** — omit any section the component does not have meaningful content for. Do not include empty headings.

```md
---
component: <selector>
family: <family-name or omit>
status: stable | proposed | deprecated
related: [<sibling-1>, <sibling-2>]
adr: <ADR-id or omit>
---

# <selector>

> One-line description: what this component is and what shape of data it adapts.

## Why this exists
1–3 lines. Why this component is split out from alternatives. Reference the
specific decision (e.g. "FormControl shape `string` vs `string[]` would force a
union type if unified").

## Use when
- Bullet — concrete condition
- Bullet — concrete condition

## Don't use when
- Alternative situation → which sibling/widget to use instead

## Behavior contract
Framework-agnostic guarantees. WHAT, not HOW.
- Value type
- Selection / state rules (with edge cases like "click-on-active is a no-op")
- Initial value / null handling
- Change emit semantics
- Disabled propagation
- Keyboard
- A11y roles

## Implementation guide
Portable rules to build this in any framework. Reference the host stack's
primitive ("in this repo: <X>; in other stacks: equivalent <Y>"). 80% rules,
not code.
- Wrap which primitive
- Form-control adapter requirements
- Required inputs / optional inputs (semantics, not type signatures)
- A11y implementation requirements

## Quality checklist
Boolean checks a reviewer can run.
- [ ] item
- [ ] item

## Edge cases
Known sharp corners and how the component handles them.
- Async option loading
- Duplicate values / invalid state
- Form patches with null

## See also
- `_overview.md` (if family)
- Sibling components
- Cookbook section
- ADR if applicable
```

### Step 4 — Avoid duplication

Before writing, scan:
- `console-cookbook.md` — anything about this component there?
- `_overview.md` of the family — family-wide rules?
- Existing component docs — siblings with overlapping rules?

If overlap exists:
- Move the rule to where it belongs (cookbook for "which widget for which field type", `_overview.md` for family-wide rules, this doc for component-specific).
- Replace the duplicated content in the original location with a one-line link.

Show the user what you trimmed.

### Step 5 — Cross-link

Update:
- `.context/design/console.md` Component Inventory table — add a row with a link to the new doc.
- The cookbook row pointing at this widget (if any) — update to reference this doc.
- Sibling docs' `See also` sections.

### Step 6 — Status

- `proposed` — doc exists, code does not. Useful for SDD: agree on doc first, then build.
- `stable` — code matches doc, ≥1 callsite.
- `deprecated` — slated for removal; keep doc until last callsite migrates.

## Anti-patterns to refuse

- Visual screenshots — Figma owns visual.
- Long tutorials — cookbook owns how-to.
- API tables (`@Input` listings, prop types) — code is source of truth.
- Per-PR changelogs — git history is enough.
- Implementation code dumps — paste only minimal canonical usage if useful, otherwise omit.
- Project-specific paths in Behavior contract — must stay portable. Implementation guide may reference host primitives by name.

## Output

After writing:
1. Print the created/updated file path.
2. List any cross-links updated and what was trimmed.
3. Note the status assigned and why.
4. Ask if the user wants to update CLAUDE.md or `_overview.md` to surface the new doc.
