# Task: Give project gallery images a localized caption of their own

## Status: pending

## Goal

Stop reusing `ProjectImage.alt` as the visible `FIG. 0N` caption, and give the caption its own bilingual field so gallery captions are not English-only.

## Context

Found while uploading the Document Engine image set (task 361 / B7). The author pasted the alt strings from `.shot-composer/manifest.json` into the console and the home page printed the whole sentence, all-caps, across four lines, which pushed the top row of the 2×2 grid out of alignment.

Three separate problems sit behind that one symptom:

1. **`alt` is doing two jobs.** `home.selected-work-tab.ts:67` builds the caption as `caption: img.alt || fallbackCaption`, where `fallbackCaption` is the uppercased slug — which is why the other four cells read `DOCUMENT ENGINE`. `project.detail.html:157-163` does the same thing. An alt string is a full description written for a screen reader; a caption is a short label written for someone looking at the image. They are not interchangeable, and today there is nowhere to put the second one.
2. **Captions are English-only.** `ProjectImage` is `{ url: string; alt: string | null }` (`project.types.ts:41`). Every other landing text field is `TranslatableJson`. Nothing in the current shape can hold Vietnamese.
3. **The data layer is already most of the way there.** `Media` has both `altText` and `caption` columns (`schema.prisma:292-293`), and `project.mapper.ts:159` already reads `caption` off the media row. Only `project.presenter.ts:164` drops it, publishing `alt: i.altText` and nothing else.

An interim CSS clamp already shipped: a figure that shares a row or a track holds its caption to one line and ellipses the overflow (`figure.scss`, documented at `/ddl/figure` → Caption clamp). That stops the layout damage but does not make captions bilingual, and it does not stop an author from pasting a description into the wrong field.

## Acceptance Criteria

- [ ] `ProjectImage` carries a localized caption; a gallery cell can render a Vietnamese caption when `locale() === 'vi'`
- [ ] `alt` is no longer used as the caption source in `home.selected-work-tab.ts` or `project.detail.html`
- [ ] `alt` keeps its own job: it stays the full description and continues to reach the `<img alt>` attribute
- [ ] The uppercased-slug fallback is either removed or reduced to a deliberate choice rather than an accident of `img.alt` being empty
- [ ] The console can set caption EN and VI per image on a project
- [ ] Existing images with a populated `alt` are handled by the migration without a blank caption appearing on prod
- [ ] The five Document Engine images carry real bilingual captions, written from scratch — there is no existing draft to crib from (see Technical Notes)
- [ ] `project.presenter.spec.ts` is updated deliberately, with its two comments rewritten to state the new intent rather than silently loosened
- [ ] Unit tests cover the localized read path; existing figure/gallery specs stay green

## Technical Notes

**Put the caption on `ProjectImage`, not on `Media`.** Two reasons. A caption is editorial — it belongs to *this project's use of* the asset, and the same asset could be captioned differently elsewhere. And `Media.caption` is already spoken for as the console's media-library label; the comment at `project.mapper.ts:50` says so explicitly. Repurposing it would break that surface.

So: `caption Json?` on the `project_images` join table, following the `TranslatableJson` convention used by every other localized field. `Media.altText` stays where it is and keeps feeding `alt`.

Migration path for existing rows: the only project with images today is `document-engine`, whose captions are being rewritten by hand anyway, so a plain nullable column with no backfill is acceptable. Confirm that before writing the migration — if another project has gained images by then, seed `caption.en` from `altText` so nothing renders blank.

Use the `prisma-migrate` skill for the schema change, per the project guardrail.

**The write path is the hidden cost, and it is bigger than the read path.** A per-image caption cannot travel through the contract as it stands: `project.dto.ts:57` and `:84` declare `imageIds: z.array(z.uuid())`, the port repeats `imageIds: string[]` at `project.repository.port.ts:27` and `:34`, and `project.repository.ts:64`/`:124` delete every join row and recreate it from that bare id list. Carrying a caption means turning `imageIds: string[]` into an array of objects across zod DTO → command → port → repository → console payload, and deciding how a delete-and-recreate write preserves captions across a save. Budget most of the task here.

**Reversing a stated intent, not filling a gap.** `project.presenter.spec.ts:93` pins the public image DTO with an exact `toEqual({ url, alt })`, and two comments (`:91-92`, `:176-178`) say in words that caption must NOT reach the public payload. That was a deliberate decision made in `bed35af7`, so this task overturns it rather than completing it. Rewrite both comments to state the new rule; do not just widen the assertion.

**The render side is already waiting.** `gallery.types.ts` declares `readonly caption?: string | null` on `GalleryImage`, so the landing UI needs no new shape — only the data plumbing behind it.

**No caption drafts exist.** `.shot-composer/manifest.json` holds five entries carrying an `alt` key only, English, no `caption` and no Vietnamese anywhere; the folder is gitignored, so it lives on one machine. Treat the five captions as unwritten. If the manifest is to become the source it was described as, give each frame a `caption: { en, vi }`.

## Files to Touch

- `apps/api/prisma/schema.prisma` — `caption Json?` on `ProjectImage`
- `apps/api/prisma/migrations/` — new migration
- `apps/api/src/modules/project/infrastructure/mapper/project.mapper.ts` — reads `caption` off the media row at line 159
- `apps/api/src/modules/project/application/project.presenter.ts` — drops caption at line 164; public DTO shape at lines 46-49
- `apps/api/src/modules/project/application/project.presenter.spec.ts` — the exact-match pin at line 93 and the two intent comments
- `apps/api/src/modules/project/application/project.dto.ts` — `imageIds` at lines 57 and 84
- `apps/api/src/modules/project/application/ports/project.repository.port.ts` — `imageIds: string[]` at lines 27 and 34
- `apps/api/src/modules/project/infrastructure/repositories/project.repository.ts` — the delete-and-recreate join write at lines 64 and 124
- `libs/landing/shared/data-access/src/lib/project.types.ts` — `ProjectImage` at lines 41-44
- `libs/landing/feature-home/src/lib/selected-work/home.selected-work-tab.ts` — `galleryImages()` at line 61, `caption:` at line 67, slug fallback at line 63. No spec file exists for this component yet
- `libs/landing/feature-projects/src/lib/project.detail/project.detail.html` — the `project.images` loop, lines 146-166; `<figcaption>` at 157-163 with `img.alt` printed at 161
- `libs/console/feature-project/src/lib/project.form/project.form.html` — the Gallery Images block, lines 201-256; rows carry a filename and order buttons only, so a per-image text input is new markup
- `libs/console/feature-project/src/lib/project.form/project.form.ts` — `galleryImages` signal at 135, hydration at 539-541, and the save payload at 383 which flattens rows to `mediaId` alone
- `libs/console/feature-project/src/lib/project.form/project.form.types.ts` — `GalleryImage` has no caption field
- `libs/console/feature-project/src/lib/project.types.ts` — `AdminImage` at 66-74 and the `imageIds?: string[]` payloads at 116 and 135

## Dependencies

**Cleared 2026-08-09.** The console/API changeset this waited on (`project.presenter.ts`, `project.mapper.ts`, the project DTOs, media-picker-dialog, asset-upload-zone, asset-grid) landed in `5e28b750..06fcc740`. Nothing in `Files to Touch` sits in another session's working set now.

Related: task 361 (content authoring master) — work item B7.

## Complexity: XL

**Reasoning:** Raised from L on 2026-08-09 after verification. The read path is the small half: schema, mapper, presenter, FE types, two render sites, and the render shape already accepts a caption. The write path is the large half and was not costed originally — `imageIds: string[]` has to become an object array through zod DTO, command, port and repository, and the join rows are deleted and recreated on every save, so caption preservation needs a deliberate answer. On top of that sit a new console input, a public-DTO decision that reverses a written one, and five captions to write in two locales from nothing.

## Progress Log

- 2026-08-09 — Unblocked and verified. Every code citation written on 2026-08-02 still resolves to the exact line quoted; none had drifted. Four corrections folded in: the write path (`imageIds: string[]` through DTO, port and repository) was missing from the plan entirely, the public DTO is pinned by an exact-match spec whose comments state the opposite intent, `GalleryImage` already carries a `caption?` slot on the render side, and `.shot-composer/manifest.json` holds English `alt` strings only — no captions, no Vietnamese, and the folder is gitignored. Complexity raised L → XL. One nuance on the Context section: the `project.mapper.ts:50` comment cited as precedent was authored by `bed35af7`, the same changeset that unblocked this task, not by earlier work — the reasoning stands but it is not independent precedent.
- 2026-08-02 — Created. An interim caption clamp shipped separately: `figure.scss` reads `--landing-figure-caption-flex-wrap` / `--landing-figure-caption-white-space` (default off), `gallery.scss` turns them on for multi-cell layouts only, `carousel.scss` for every slide. Documented at `/ddl/figure` → Caption clamp. It stops a long caption from breaking the grid, but captions are still English-only and still sourced from `alt`, so this task stays open.
