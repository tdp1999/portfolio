---
name: design-check
description: |
  Review a component or UI element against the design knowledge bank. Checks compliance with
  research-backed guidelines and principles. Triggers: "design check", "check design", "/design-check"
---

# Design Check

Review a component's implementation against the design knowledge bank.

## Input

`$ARGUMENTS` — one of:
- A **component name** (e.g., `button`, `form`, `table`)
- A **file path** to a component (e.g., `libs/landing/shared/ui/src/lib/button/button.component.html`)

## Workflow

### Step 1: Identify Component

If a file path is given, extract the component name from it.
If a name is given, find the component file(s) using Glob/Grep.

### Step 2: Find Bank Entries

Search `.context/design/bank/` for:
1. **Direct pattern match** in `patterns/` (e.g., `patterns/button.md`)
2. **Tag matches** — grep bank files for tags matching the component type
3. **Principle references** — collect all principles referenced by matched patterns

Read all matched bank files.

### Step 3: Read Component

Read the component's template (`.html`), styles (`.scss`), and logic (`.ts`).

### Step 4: Compare & Report

For each guideline in the matched bank entries, check the component and report:

```
## Design Check: [Component Name]

### Matched Bank Entries
- [pattern/principle files found]

### Compliant
- [guidelines the component follows, with evidence]

### Needs Attention
- [guidelines the component violates or doesn't address]
- Include specific line references and suggested fixes

### Not Applicable
- [guidelines that don't apply to this component's context]
```

## Rules

- If no bank entries exist for the component, say so clearly — suggest running `/design-ingest` to build knowledge first
- Be specific — cite line numbers, CSS values, template patterns
- Reference both the bank file and the original research source
- Don't flag things that are intentional project decisions (check `.context/design/` spec files)
