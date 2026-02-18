---
name: style-review
description: |
  Style Review & Architecture Evolution workflow. Manages the style-review.md Event Stack:
  add review items, discuss findings, resolve decisions, and promote accepted patterns to
  CLAUDE.md or .context/ files. Triggers: "style review", "review item", "SR", "/style-review"
---

# Style Review & Architecture Evolution

Manage the feedback loop between manual code review findings and codified project standards.

## Concepts

### Event Stack (`.context/style-review.md`)

A working document containing **only unresolved review items** with full descriptions and code snippets.

- Items are added when the user reports a finding from manual review.
- Items are discussed, refined, and resolved collaboratively.
- **Cleanup Rule:** Once resolved, remove the detailed discussion. Retain only a one-line entry in the Summary Table at the top.

### Promotion

When a review item is resolved, determine impact and persist the decision:

| Impact Level | Target File | Example |
|---|---|---|
| **Core standard** (fundamental rule) | `CLAUDE.md` — add to Critical Guardrails table | "Validation in Application Layer, not Controllers" |
| **Architecture pattern** (backend structure) | `.context/patterns-architecture.md` | CQRS handler patterns, layer responsibilities |
| **Angular pattern** (frontend convention) | `.context/angular-style-guide.md` | Signal usage, component structure |
| **Design pattern** (UI/component) | `.context/patterns-design-system.md` | Component API conventions |
| **Testing pattern** | `.context/testing-guide.md` | Test structure, mocking approach |

## Workflow

### 1. Adding a Review Item

When the user reports a finding:

1. Read `.context/style-review.md`
2. Assign the next `SR-XXX` number
3. Add the item to the **Event Stack** section with:
   - Title, status (`Open`), file references
   - **Current** code snippet (what exists)
   - **Proposed** code snippet or description (what user wants)
   - User's rationale
4. Discuss and refine with the user

### 2. Resolving a Review Item

When agreement is reached:

1. Set status to `Accepted` or `Rejected`
2. **If Accepted:**
   a. Determine impact level (see Promotion table)
   b. Update the target file with the new rule/pattern
   c. If Core standard → also add a guardrail row to `CLAUDE.md`
   d. Move the item from Event Stack to Summary Table (one-line only)
3. **If Rejected:**
   a. Move to Summary Table with reason
   b. No file updates

### 3. Pre-Task Compliance Check

**Before starting any new implementation task**, the agent MUST:

1. Read `.context/style-review.md` — check for `Open` items that affect the current task
2. Consult `CLAUDE.md` and relevant `.context/` files for promoted standards
3. Flag any conflicts between pending items and the current task

## Commands

The user can invoke this skill with:

- `/style-review add` — Report a new finding
- `/style-review list` — Show all open items
- `/style-review resolve SR-XXX` — Mark item as resolved and trigger promotion
- `/style-review check` — Run pre-task compliance check against open items

## File Format

See the structure defined in `.context/style-review.md`. The skill reads and writes to this file directly.
