---
name: design-ingest
description: |
  Extract design knowledge from articles/URLs into the design bank. Accepts a URL or pasted text,
  fetches and summarizes content, cross-validates with industry sources, and saves to
  .context/design/bank/. Triggers: "design ingest", "ingest design", "/design-ingest"
---

# Design Knowledge Ingest

Extract, validate, and store UI/UX design knowledge from external sources into the project's design bank.

## Input

`$ARGUMENTS` — either:
- A **URL** to an article (Smashing Magazine, NNGroup, Baymard, GOV.UK, etc.)
- **Pasted text** from an article or book

## Workflow

### Step 1: Fetch & Extract

If the input looks like a URL:
- Use **WebFetch** with prompt: `"Extract only the article body text and headings. Ignore navigation, ads, sidebar, comments, cookie banners, author bios, and related article links. Preserve code examples if they illustrate UI patterns."`
- If WebFetch fails or content is too thin, inform the user and ask them to paste the content instead.

If the input is pasted text, use it directly.

### Step 2: Summarize & Present to User

Show the user a **structured summary**:

```
## Article Summary

**Title:** [article title]
**Source:** [publication/author]
**Topic:** [main topic]

### Key Findings
- [bullet points of main principles/guidelines discovered]

### Anti-patterns Identified
- [things the article says NOT to do]

### Actionable Rules
- [concrete, implementable rules with numbers/specs where available]
```

Do NOT skip this step. The user must see what was extracted.

### Step 3: Research & Cross-Validate

Use **WebSearch** to find 1-2 additional authoritative sources on the same topic:
- Search for the core topic + "best practice" or "research" or "usability study"
- Prioritize: NNGroup, Baymard Institute, GOV.UK Design System, Material Design, W3C/WCAG
- Use **WebFetch** on the best results to extract supporting or contradicting evidence

Show the user:

```
## Cross-Validation

### Additional Sources Found
1. [Source name] — [key finding that supports/contradicts/extends the article]
2. [Source name] — [key finding]

### Consensus
[What the sources agree on]

### Conflicts
[Where sources disagree, if any]
```

### Step 4: Propose & Confirm

Present a clear proposal:

```
## Proposed Action

**Category:** [principle | pattern | other — specify subfolder name]
**File:** [new file path, or existing file to merge into]
**Action:** [create new | merge into existing]

### Content Preview
[Show the actual content that will be written, in the bank file format]
```

**Wait for user confirmation.** Do not write any files until the user approves.

### Step 5: Write to Bank

After confirmation:

1. **Create directories** if they don't exist (e.g., `.context/design/bank/principles/`)
2. **Create or merge** the bank file using the format below
3. **Update `sources.md`** — append a row to the registry table
4. **Update `index.md`** — add an entry if it's a new file

## Bank File Formats

### Principle File (`.context/design/bank/principles/{slug}.md`)

```markdown
---
name: [Human-readable name]
category: principle
tags: [relevant, tags]
---

## Statement
[One-sentence definition of the principle]

## Key Takeaways
- [Bullet points]

## Application in UI
- [Practical, implementable rules with numbers where possible]

## Sources
- [Citations with URLs]
```

### Pattern File (`.context/design/bank/patterns/{slug}.md`)

```markdown
---
name: [Component/Pattern Name]
category: pattern
principles: [referenced-principle-slugs]
tags: [relevant, tags]
---

## Research-Backed Guidelines
- [Rules with rationale, referencing principles]

## Anti-patterns
- [What NOT to do, with reasoning]

## Sources
- [Citations with URLs]
```

### sources.md Format

```markdown
# Sources Registry

| Date | Source | URL | Extracted To |
|------|--------|-----|-------------|
| YYYY-MM-DD | Title | URL | file path(s) |
```

### index.md Format

```markdown
# Design Bank Index

## Principles
- [Fitts's Law](principles/fitts-law.md) — target size and distance affect acquisition time
- ...

## Patterns
- [Button](patterns/button.md) — sizing, hierarchy, states, labels
- ...
```

## Rules

- **Never write files without user confirmation** — always show content preview first
- **Cross-validate** — never save single-source claims without checking
- **Merge, don't duplicate** — if a bank file already exists for the topic, merge new findings
- **Slug naming** — use kebab-case for file names (e.g., `fitts-law.md`, `button.md`)
- **Link principles ↔ patterns** — patterns must reference which principles back them
- **Preserve specificity** — keep numbers, measurements, and concrete rules; don't vague-ify
