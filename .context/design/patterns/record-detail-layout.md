---
name: Record Detail Layout
category: pattern
principles: [chunking-progressive-disclosure]
tags: [detail, read-view, crud, layout, properties, disclosure, locale]
---

Read-view counterpart to [`long-form-layout.md`](long-form-layout.md). That file
governs how a record is **edited**; this one governs how it is **read**. They are
a pair — see "Keeping the pair aligned" at the bottom.

> **Universal kernel:** `→ skill patterns/record-detail-layout` (split-by-data-shape, split
> view, absence-reported-once) and `→ skill patterns/read-view-chassis` (the slot model and
> 3-layer logic split). This file keeps the project's measured results, ADR-026, and the
> `console-record-*` wiring.

## The governing rule

**Split by data shape, not by topic.**

| Shape                           | Examples                                        | Treatment                                                         |
| ------------------------------- | ----------------------------------------------- | ----------------------------------------------------------------- |
| **Attribute** — short scalar    | slug, status, dates, order, counts, tags, links | Dense aligned rows in a rail. Always visible, never in the scroll |
| **Content** — long-form         | description, body, motivation, RTE blocks       | Reading column, own heading, capped measure (≈68ch)               |
| **Collection** — repeated child | highlights, responsibilities, images            | Carded, numbered, inside a titled section                         |

Applying one row template to all three is the failure mode this pattern exists
to correct: a 400-word description inherits the layout designed for a slug.

## The 3 candidates

| Pattern                     | Shape                                                     | Real-world                                     | Verdict                                                                                    |
| --------------------------- | --------------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------ |
| **Summary + sections**      | One column; key-fact band under the header, then sections | Salesforce Lightning highlights panel          | Rejected — with prose capped to a measure and no rail, the right third of the page is dead |
| **Split view**              | 2fr content / 1fr sticky rail                             | Linear, Jira, GitHub, Polaris resource details | **Chosen**                                                                                 |
| **Split + collapsed depth** | Split view, heavy children compressed to a gist row       | Split view + progressive disclosure            | **Chosen** — same chassis, density switch                                                  |

Measured against one fully-populated project record at 1440×900:

|                                       | Scroll height | vs. baseline | Chars / line |
| ------------------------------------- | ------------- | ------------ | ------------ |
| Baseline (`.detail-field` everywhere) | 2617px        | —            | ~130         |
| Summary + sections                    | 2289px        | −13%         | 75           |
| Split view                            | 1949px        | −25%         | 75           |
| Split, collapsed                      | 1025px        | −61%         | 75           |

## Hierarchy — three levels, three treatments

```
SECTION            ← L1: a group the record owns. Header + rule.
 │
 ├── field         ← L2: a field of the record. Quiet uppercase label.
 └── item          ← L2: a member of a collection. Carded + numbered.
      └── sub-part ← L3: challenge / approach / outcome
```

Levels must never share a type treatment. Rendering a collection member with a
field's label style makes a highlight look like a sibling of "Motivation" — the
single most disorienting defect in the page this replaced.

## Absence — report once, where it is actionable

| Scope                                     | Treatment                                                   | Why                                                                                                                      |
| ----------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Field, inside a section already on screen | One muted "Not set" line, kept in place                     | Tells the author what to write next; hiding it forces a hunt                                                             |
| Whole section                             | Withheld; name folded into one "Show N empty sections" line | An empty section header teaches nothing; a row of em-dashes per field turns a sparse record into a ladder of punctuation |
| Locale                                    | Its own state: "Not written in Vietnamese yet"              | Falling back silently to the other language hides exactly the gap the author needs to see                                |
| Partial section                           | Count in the section's own header ("1 to write")            | Makes "partial" legible from the top of the page instead of discovered by scrolling                                      |

Never report the same absence twice. A field listed inline must not also appear
in the empty-sections list.

## Degradation

Attribute-only records (tag, category, skill) have no content column. The grid
engages only when both slots carry content, so those pages collapse to a single
properties panel **with no branch at the call site**. Verified: empty content
slot → one 1125px column; populated → 723px / 362px.

## Density: when to collapse

Collapse a section's children when the section has more than ~3 heavy blocks, or
when the record's expanded height exceeds ~2 screens. A collapsed row **must**
carry a one-line gist of its content — that is the whole difference between this
and a tab. A tab hides its siblings; a fold summarises them.

## Anti-patterns

- Tabs or a segmented control as the primary structure of a read view — fragments small records, hides content in large ones.
- A fixed side label beside a paragraph — steals a third of the measure from every line.
- Uncapped prose in a wide column (measure the result: >90 chars/line is a defect).
- Scalars interleaved between prose blocks, so a date lives three screens down.
- A row of "—" per empty field.
- Silent locale fallback.
- A collapsed row with no gist.

## Keeping the pair aligned

Forms keep their own chassis (`console-section-tabs`, ADR-024) — the two are not
unified, and should not be. What must match is the **section vocabulary**:
section names and their order are identical in the form and the read view, so
"Story" denotes the same place whether the author is writing or reading. A
mismatch here is what makes an editor feel like a different product from the
page it produces.

## Implementation

`console-record-*` in `libs/console/shared/ui`; styles in
`styles/patterns/_record-view.scss`. Living reference: `/ddl/detail-layouts`
(switchable full / partial / sparse record × EN / VI). See ADR-026 and
`.context/design/components/record-view/_overview.md`.

## Sources

External provenance lives in the skill: `→ skill sources.md` (rows for `record-detail-layout`
and `read-view-chassis`).
