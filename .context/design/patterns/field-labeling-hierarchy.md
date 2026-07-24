# Pattern: Field Labeling Hierarchy

> Project-specific label taxonomy for console forms — the fixed 5-level ladder, its
> typography classes, and the shared primitives that own each level. Universal principle:
> `→ skill principles/chunking-progressive-disclosure`. Console typography classes are the
> project's own (`contracts/scale-contract.md`, `cookbook/console.md`).

> **Scope: all console forms** (not Portfolio-only). Auth/settings forms typically only need levels 1–4.

A console form has at most **5 levels** of structural label. Each level has a fixed typography class and a fixed gap rule. Do not invent a 6th level — if a form needs deeper nesting, the section is too dense and should be split.

| # | Level | Renders | Typography | Owner / class | Spacing rule |
|---|---|---|---|---|---|
| 1 | **Page** | Page title + optional subtitle in the page header | `.text-page-title` + `.text-page-subtitle` | Page template | `gap-12` between page header and content |
| 2 | **Section card** | Eyebrow (Portfolio only) + title + description | `.text-stat-label` (eyebrow) + `.text-section-heading` (title) + `.text-body text-text-secondary` (description) | `console-section-card` | `gap-8` between cards (provided by `console-long-form-layout`) |
| 3 | **Sub-group inside a section** | An optional `<h4>` title for a logical cluster of fields — e.g. Profile Social Links → "Links", "Resume", "Certifications" | `.text-card-title` | `.form-subsection` wrapper (`<div class="form-subsection">` with optional `__header`) | `gap-6` between sub-groups |
| 4 | **Field** | The label of one editable control | Material's floating `<mat-label>` for `mat-form-field`; `.field-label` (in a `.field-block` wrapper) for non-Material widgets | `mat-form-field` / `.field-block` | `gap-4` between fields (provided by `.form-stack` or `.field-row`) |
| 5 | **Micro-label** | Hint, counter, inline annotation tied to a single field | `.text-caption` (12px muted) or Material's `<mat-hint>` | `mat-hint` / inline `<span class="text-caption">` | `gap-2` from the control it annotates |

## Decision rules

- **If the label introduces a section card → level 2.** Lives on `console-section-card`. Don't render an `<h2>`/`<h3>` inside the section yourself.
- **If the label introduces a logical cluster of 2+ fields inside one section → level 3.** Use `.form-subsection` + `<h4 class="text-card-title">`. Don't reach for level 3 just to title a single field — that's level 4.
- **If the label introduces a non-`mat-form-field` widget (custom picker, chip group, button group, file upload) → level 4 via `.field-block` + `.field-label`.** Material owns level 4 typography for `mat-form-field`; do not duplicate by adding a `<p class="field-label">` next to a Material label.
- **If the label is hint text under a field (counter, format example, "optional") → level 5.** Prefer `<mat-hint>` when inside `mat-form-field`; otherwise `<span class="text-caption">`.

## Anti-patterns (don't do)

❌ **`<h3>` inside a section card body.** That's level 2 leaking into level 3 territory. Use `.form-subsection` + `<h4 class="text-card-title">`.

❌ **Inventing typography classes ad hoc.** `class="text-sm font-medium"` next to a custom widget is a one-off level-4 label. Use `.field-label` instead — it lives in shared `components.scss`.

❌ **Re-defining `.field-label` / `.field-block` / `.form-subsection` in feature SCSS.** They are shared primitives. Feature SCSS only owns feature-specific layout (e.g. `.cert-row`, `.gallery-row`).

❌ **Using `.field-label` next to a `mat-form-field`.** Material's floating label is already a level-4 label — adding `.field-label` on top creates two labels for one control.

❌ **Using `.text-stat-label` for any purpose other than the section eyebrow** (Portfolio bucket marker) **or genuine stat-label slots in tables.** It is reserved.

❌ **A `console-section-card` containing one simple field.** A section card is a level-2 structural element; spending it on a single `mat-form-field` is structural inflation and forces a redundant micro-label (the section title and the field label say the same thing). Either merge the field into a sibling section or group it with related fields under `.form-subsection`. Exception: a section whose body is a single complex widget that *is* the section's content (markdown editor, gallery, file uploader) is fine — the widget's chrome substitutes for field-level labeling.

## Worked example — Profile · Social Links section

The Social Links section card has three logical sub-groups: links, resume URLs, and certifications. Levels in use:

```html
<console-section-card                                                         <!-- level 2 -->
  bucket="PUBLIC"
  title="Social Links"
  description="Public links, resume URLs, and certifications.">

  <div class="form-stack">
    <div class="form-subsection">                                              <!-- level 3 -->
      <div class="form-subsection__header">
        <h4 class="text-card-title">Links</h4>
        <button mat-stroked-button>Add Link</button>
      </div>

      <div class="field-row">                                                  <!-- level 4 row -->
        <mat-form-field>                                                       <!-- level 4 (Material) -->
          <mat-label>Platform</mat-label>
          <mat-select>...</mat-select>
        </mat-form-field>
        <mat-form-field>
          <mat-label>URL</mat-label>
          <input matInput />
          <mat-hint align="end">https://...</mat-hint>                        <!-- level 5 -->
        </mat-form-field>
      </div>
    </div>

    <div class="form-subsection">
      <h4 class="text-card-title">Resume</h4>                                  <!-- level 3 (no actions) -->
      ...
    </div>
  </div>
</console-section-card>
```

For a non-Material widget inside the same form (e.g. the avatar uploader on Identity):

```html
<div class="field-block">                                                     <!-- level 4 (custom widget) -->
  <p class="field-label">Avatar</p>
  <div class="media-upload">...</div>
</div>
```

## Shared primitives (do not redefine)

These live in `libs/shared/ui/styles/src/base/components.scss`. Feature SCSS must not redeclare them:

- `.form-subsection` + `.form-subsection__header` — level-3 wrapper
- `.field-block` — column wrapper for label + custom widget
- `.field-label` — level-4 label for non-Material controls
- `.field-row` — row of fields inside a sub-group
