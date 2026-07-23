# Record view — family overview

The `console-record-*` family: the read-only chassis for every CRUD detail page.
Rules here apply to **every** component in the family and are deliberately not
repeated in the per-component docs.

Research and measurements: [`bank/patterns/record-detail-layout.md`](../../bank/patterns/record-detail-layout.md).
Decision record: ADR-026.

## The family

| Component                                    | Level      | Holds                           |
| -------------------------------------------- | ---------- | ------------------------------- |
| `console-record-layout`                      | chassis    | content column + `[aside]` rail |
| `console-record-section`                     | L1         | a group the record owns         |
| `console-record-field`                       | L2         | one long-form field             |
| `console-record-item`                        | L2         | one member of a collection      |
| `console-record-fold`                        | L2 wrapper | the density switch              |
| `console-record-panel`                       | rail       | one titled panel                |
| `console-property-list` / `console-property` | rail       | the scalars                     |
| `console-record-empty-sections`              | tail       | sections absent in full         |

## Where the logic lives

Three layers. Getting this split wrong is how a shared chassis turns back into
nine copies of the same code.

| Layer                                                    | Lives in                                         | Example                                                                          |
| -------------------------------------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------- |
| **Mechanics** — no domain knowledge                      | `@portfolio/console/shared/util` → `record-view` | `resolveTranslatable`, `countGaps`, `countIncomplete`, `RecordExpansion`, `gist` |
| **Declaration** — the module's own field list, as _data_ | the feature lib, one `const` per section         | `STORY_FIELDS: RecordFieldDescriptor<AdminProject>[]`                            |
| **Template** — how this record looks                     | the feature lib's `.html`                        | the `console-record-*` markup                                                    |

**Derived state is not domain logic.** `hasAnyContent`, gap counts, fold ids and
translation progress all fall out of a field list; only the list itself is
domain. A module that hand-rolls those computeds has duplicated shared code.

**Stop before a schema-driven renderer.** Templates stay hand-written per
module. The nine console records diverge too much in their _content_ — a media
grid, a raw message body, an RTE document, three parallel collections — for one
config to describe without collecting escape hatches. Share the derivations,
which are error-prone; keep the markup, which is cheap and readable.

**`resolveTranslatable` is deliberately not the `translatable` pipe.** The pipe
resolves `locale → en → vi → '—'`, which is correct for the public site (a
visitor should see content, not a hole) and wrong here (an author must see that
a translation is missing). Two contexts, opposite goals. Do not merge them.

## Family-wide rules

**1 · Shape decides the component.** A short scalar goes to `console-property`
in the rail. Long-form goes to `console-record-field` in the column. If you find
yourself putting a paragraph in a `console-property`, the field is misplaced,
not the component.

**2 · Three levels, three treatments.** Section → field/item → sub-part. Never
render a collection member with a field's label style; that makes a child look
like a sibling.

**3 · Every item has a parent section.** `console-record-item` outside a
`console-record-section` is the hierarchy bug the family exists to prevent.

**4 · A fold must carry a gist.** Without one it is a tab, and tabs are rejected
for read views. The gist is what lets a reader decide without opening.

**5 · Absence is reported once.** Field-level gaps render inline; whole absent
sections go to `console-record-empty-sections`. Never both.

**6 · Locale absence is its own state.** Three states — `filled`,
`other-locale`, `unset` — never two. Silent fallback to the other language hides
the gap the author most needs to see.

**7 · Partial state belongs in the section header.** Pass `gaps` so a
half-written record is legible from the top of the page.

**8 · Rail order: controls above description.** Panels that change what the
content column _says_ (content language) sit above panels that describe the
record (properties).

**9 · Styles are global, in `styles/patterns/_record-view.scss`.** Every part is
content-projected, and scoped component styles do not reach projected content —
the same reason `.detail-page` and `.crud-page` live there. Do not add
`styleUrl` to a family component.

**10 · Degradation is declarative.** The chassis collapses to one column via
CSS `:has` when a slot is empty. Do not add `@if` branches for attribute-only
records.

## Family quality checklist

- [ ] No paragraph rendered inside a `console-property`, and no scalar inside a `console-record-field`.
- [ ] Prose measures ≤ ~75 characters per line at 1440px (measure it; do not eyeball).
- [ ] A collection member is visibly a child of its section, not a sibling of a field.
- [ ] Every fold shows a gist while collapsed.
- [ ] A field that is empty appears exactly once on the page.
- [ ] Switching locale changes both the prose _and_ the gap counts.
- [ ] An attribute-only record renders as a single panel with no call-site branch.
- [ ] Section names and order match the corresponding form 1:1.

## See also

- [`bank/patterns/long-form-layout.md`](../../bank/patterns/long-form-layout.md) — the write-side pair
- [`segmented-control.md`](../segmented-control.md) — used for the content-language switch
