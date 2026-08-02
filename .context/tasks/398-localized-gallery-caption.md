# Task: Give project gallery images a localized caption of their own

## Status: blocked

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
- [ ] The five Document Engine images carry real bilingual captions (drafts sit in `.shot-composer/manifest.json`)
- [ ] Unit tests cover the localized read path; existing figure/gallery specs stay green

## Technical Notes

**Put the caption on `ProjectImage`, not on `Media`.** Two reasons. A caption is editorial — it belongs to *this project's use of* the asset, and the same asset could be captioned differently elsewhere. And `Media.caption` is already spoken for as the console's media-library label; the comment at `project.mapper.ts:50` says so explicitly. Repurposing it would break that surface.

So: `caption Json?` on the `project_images` join table, following the `TranslatableJson` convention used by every other localized field. `Media.altText` stays where it is and keeps feeding `alt`.

Migration path for existing rows: the only project with images today is `document-engine`, whose captions are being rewritten by hand anyway, so a plain nullable column with no backfill is acceptable. Confirm that before writing the migration — if another project has gained images by then, seed `caption.en` from `altText` so nothing renders blank.

Use the `prisma-migrate` skill for the schema change, per the project guardrail.

## Files to Touch

- `apps/api/prisma/schema.prisma` — `caption Json?` on `ProjectImage`
- `apps/api/prisma/migrations/` — new migration
- `apps/api/src/modules/project/infrastructure/mapper/project.mapper.ts`
- `apps/api/src/modules/project/application/project.presenter.ts` — currently drops caption at line 164
- `apps/api/src/modules/project/application/` — the project DTOs
- `libs/landing/shared/data-access/src/lib/project.types.ts` — `ProjectImage`
- `libs/landing/feature-home/src/lib/selected-work/home.selected-work-tab.ts` — `galleryImages()` at line 61
- `libs/landing/feature-projects/src/lib/project.detail/project.detail.html` — the synthesized images loop, lines 146-166
- Console project form, image rows — path to confirm, the console media components are being reshaped in parallel

## Dependencies

**Blocked on the console/API work in flight.** `project.presenter.ts`, `project.mapper.ts` and the project DTOs are all in another session's uncommitted working set as of 2026-08-02 (alongside media-picker-dialog, asset-upload-zone, asset-grid and the API DTO/presenter/mapper changes for blog-post, profile, project and skill). Start this only once that lands, or it will conflict head-on.

Related: task 361 (content authoring master) — work item B7.

## Complexity: L

**Reasoning:** A schema migration plus a full pass down the stack — Prisma, mapper, presenter, DTO, FE types, two render sites — and a console editing surface so the author can actually set the field. Individually each edit is small; the count of touched layers and the migration are what make it L rather than M.

## Progress Log

- 2026-08-02 — Created. An interim caption clamp shipped separately: `figure.scss` reads `--landing-figure-caption-flex-wrap` / `--landing-figure-caption-white-space` (default off), `gallery.scss` turns them on for multi-cell layouts only, `carousel.scss` for every slide. Documented at `/ddl/figure` → Caption clamp. It stops a long caption from breaking the grid, but captions are still English-only and still sourced from `alt`, so this task stays open.
