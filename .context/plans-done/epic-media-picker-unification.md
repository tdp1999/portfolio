# Epic: Universal MediaPickerDialog + Media Module Refactor

## Summary

Promote `MediaPickerDialog` to the single, canonical picker used by every console module that needs to select a file (image, document, PDF, video). Split the existing media page and picker into three reusable atoms (`asset-grid`, `asset-upload-zone`, `asset-filter-bar`) so that the media page and the picker share the same UI/behavior. Upgrade the picker with a second tab (Upload), extended search, sort, folder filter, grid/list toggle, and a localStorage-backed "recently used" strip. Migrate all remaining inline-upload or URL-text-input fields (Profile avatar, Profile OG image, Profile resume URLs EN/VI, Profile certifications, Skill icon) to the picker.

## Why

- **Consistency:** Today Profile uses inline upload, Project/Blog use picker, Skill uses a bare URL text input, and Certifications use a text input. Editors see 3 different paradigms for the same operation ("pick or upload a file").
- **Reuse:** Media page and picker currently duplicate grid/upload code. A single set of atoms means every future module that needs a file selector plugs in without rebuilding UI.
- **UX quality:** Industry standard (Atlassian, Contentful, Optimizely, WordPress, Box) is a tabbed picker with Library + Upload, grid+list modes, sort, filters, and selection that persists across tabs. Current picker has none of that.
- **Accessibility:** W3C ARIA Dialog spec (focus trap, ESC, arrow-key navigation, `role=dialog`, `aria-modal`) is required by the project's a11y stance and is not met by the current picker.
- **Data integrity:** Skill and Certification currently store raw URL strings — editors can paste anything. Moving to Media FK (for Skill) or a toggleable dual-mode (for Certification) tightens the data model and lets us track orphaned media later.

## Target Users

- **Admin (site owner):** Every console form that picks a file, across Profile, Project, Blog, Skill, Certification, Media page.
- **Future modules:** Any new module that needs a file field reuses the picker with zero bespoke UI work.

## Scope

### In Scope

**New shared atoms (libs/console/shared/ui/):**
- `asset-grid/` — thumbnail grid + list toggle, Cloudinary URL transforms (`c_thumb,w_160,h_160`), skeleton, pagination, selection overlay (single/multi), keyboard navigation per W3C Grid pattern.
- `asset-upload-zone/` — generalized from existing `upload-dropzone`; multi-file, per-file progress bar, per-file error + retry, cancel, drag-drop + file picker.
- `asset-filter-bar/` — search input (300ms debounce), MIME group chips (image / video / pdf / doc / archive), folder dropdown bound to `UPLOAD_FOLDERS`, sort dropdown.
- `media-picker-dialog/` — dialog shell with 2 tabs (Library default, Upload), focus trap, ARIA `role=dialog` + `aria-modal`, ESC with confirm if upload is in progress.

**Picker behavioral upgrades:**
- Search extended from filename-only to filename + altText + caption (BE `OR` query + FE input).
- Sort options: Newest (default) / Oldest / Name A→Z / Size desc.
- Filters v1: MIME group + Folder.
- Selection model: single-click = select (no auto-close); primary CTA reads "Insert" (single) or "Insert N items" (multi); double-click = select + confirm.
- View modes: grid + list toggle, persisted in localStorage.
- Recently used: localStorage per-user, last 5 picked Media IDs, rendered as a horizontal strip at the top of the Library tab. Zero DB change.
- Upload tab: newly uploaded items auto-select in Library tab after upload completes, picker switches back to Library; selection persists across tab switches.
- Empty library state = same drop zone UI as Upload tab (unified surface).
- Existing public API (`mode`, `mimeFilter`, `selectedIds`) preserved — project-dialog and blog-editor call sites unchanged.

**Media module refactor:**
- Media page (`libs/console/feature-media/`) rebuilt to consume `asset-grid` + `asset-upload-zone` + `asset-filter-bar`. Visual parity with picker guaranteed by construction.

**Migration targets (replace inline upload / URL text input with MediaPickerDialog):**
1. `Profile.avatarId` — single, `mimeFilter: 'image/'`, default folder `avatars`.
2. `Profile.ogImageId` — single, `mimeFilter: 'image/'`, default folder `logos`.
3. `Profile.resumeUrls` — JSON structure `{ en?: string, vi?: string }` kept. Picker returns the Media URL for each locale slot. Single per locale, `mimeFilter: 'application/pdf'`.
4. `Profile.certifications[].url` — dual-mode toggle "Upload file" vs "External link". File mode uses picker (single, `mimeFilter: 'application/pdf'`); link mode keeps existing text input. `url` field reused for both modes; mode inferred from URL origin or a companion flag.
5. `Skill.iconUrl` — expand-contract migration: add `iconId` FK to Media, backfill/migrate data, deprecate `iconUrl` in contract phase. Single, `mimeFilter: 'image/svg+xml, image/png, image/webp'`.

**BE changes:**
- `list-media` query: `OR` search across `originalFilename`, `altText`, `caption`.
- `list-media` query: `sort` param (`createdAt_desc` default, `createdAt_asc`, `filename_asc`, `bytes_desc`).
- `list-media` query: `folder` filter bound to `UPLOAD_FOLDERS` enum.
- Prisma migration: `Skill.iconId` FK added (expand), `iconUrl` removed in contract phase after data backfill.

### Out of Scope

- **"From URL" tab** — third tab for pasting external links. Defer until the mechanism (proxy download? direct link store?) is decided.
- **"Used in this module" filter** — would need per-module context passed to picker + reverse-relation queries.
- **Date range / size range filters.**
- **Tags / keywords / folder system** beyond existing `UPLOAD_FOLDERS`.
- **Crop/edit integration** — separate future component.
- **Orphan media cleanup / reference counting.**
- **Bulk metadata edit** in picker (already per-item in media page).

## High-Level Requirements

1. Three reusable atoms (`asset-grid`, `asset-upload-zone`, `asset-filter-bar`) live in `libs/console/shared/ui/`, exported via `index.ts`, with DDL showcase entries demonstrating single/multi selection, grid/list, upload progress, and empty state.
2. `MediaPickerDialog` is rebuilt as a 2-tab dialog (Library default, Upload) using the three atoms. Public API (`mode`, `mimeFilter`, `selectedIds`) preserved; call sites in project-dialog and blog-post editor unchanged.
3. `list-media` query accepts `search` (multi-field OR), `sort` (4 options), and `folder` (UPLOAD_FOLDERS enum) params. Existing `mimeTypePrefix` param kept.
4. Recently-used strip (last 5 Media IDs) reads/writes `localStorage` key `media-picker:recent`, scoped per admin user.
5. Grid/list preference persists in `localStorage` key `media-picker:view-mode`.
6. Media page (`libs/console/feature-media/`) consumes the three atoms — no duplicate grid/upload code remains.
7. All 5 migration points use `MediaPickerDialog`:
   - Profile avatar and OG image replace inline upload UI in the profile settings page.
   - Profile resume (EN/VI) uses picker per locale, stores returned URL in `resumeUrls` JSON.
   - Profile certification entries toggle between "File" (picker) and "Link" (text input) modes.
   - Skill icon uses picker; `iconId` FK replaces `iconUrl` after migration completes.
8. Keyboard: arrow keys navigate grid/list items, Space toggles selection, Enter confirms, ESC closes (with confirm prompt if upload is in progress). Focus trap active while dialog open, focus returns to trigger on close.
9. ARIA: dialog uses `role="dialog"` + `aria-modal="true"` + `aria-labelledby`. Grid items use appropriate `role="option"` (single) or `role="gridcell"` + `aria-selected` (multi). Selection count announced via `aria-live="polite"`.
10. Every migration point has at least one E2E test covering the full pick flow (open picker → browse / upload → select → confirm → verify persistence).

## Technical Considerations

### Architecture

**Frontend (Angular 21, standalone + signals):**

```
libs/console/shared/ui/
├── asset-grid/                    NEW — grid + list, selection, keyboard nav
├── asset-upload-zone/             NEW — generalize from upload-dropzone
├── asset-filter-bar/              NEW — search + filter chips + sort dropdown
└── media-picker-dialog/           REBUILT — 2 tabs, focus trap, a11y
```

Atoms are presentational (inputs + outputs, no HTTP). The `media-picker-dialog` composes them and owns orchestration (list query, upload progress, selection state, tab switching, localStorage for recently-used + view-mode).

Media page (`libs/console/feature-media/`) becomes a thin consumer: hosts the three atoms + its own page-level actions (bulk delete, trash view, storage stats).

**Backend (NestJS, CQRS):**
- Extend `ListMediaQuery` DTO with `search`, `sort`, `folder` fields.
- Extend `ListMediaQueryHandler` validation (Zod) and Prisma repository query.
- Expand-contract Prisma migration for `Skill.iconId`:
  - **Expand:** add `iconId String? @db.Uuid`, FK to Media. Deploy.
  - **Migrate:** data script — for each skill with `iconUrl`, find or create Media record, populate `iconId`.
  - **Contract:** drop `iconUrl` column. Deploy.

### Dependencies

- **Existing atoms:** `upload-dropzone` (to be generalized into `asset-upload-zone`), existing `MediaPickerDialogComponent` (rebuilt in-place).
- **Existing services:** `MediaService` / `MediaApiClient` for list + upload.
- **Existing modules:** Profile, Skill (for migration), Media.
- **Existing callers preserved:** project-dialog, blog post editor (API-compatible rebuild).

### Data Model

- **New:** `Skill.iconId` (nullable FK to Media), `Skill.iconUrl` dropped after contract phase.
- **Unchanged:** Profile (`resumeUrls` JSON kept; `certifications` JSON kept — `url` field reused for both file and link modes).
- **Unchanged:** Media schema.

### Integration Points

- Profile settings page — replace inline avatar/ogImage upload and URL text inputs for resume/certifications with picker triggers.
- Skill CRUD dialog — replace `iconUrl` text input with picker trigger, wire `iconId` submission.
- Project dialog + blog editor — zero changes (API-compatible rebuild).
- Media page — refactored to consume shared atoms.

## Risks & Warnings

⚠️ **Expand-contract migration for Skill.iconUrl → iconId**
- Data script must run between expand and contract deploys. Missing skills (with invalid or empty `iconUrl`) must be handled (leave `iconId` null, don't fail migration).
- Mitigation: expand phase ships with dual-read (UI can read from either `iconId` or `iconUrl`); contract only drops `iconUrl` after verification that all skills in prod have `iconId` populated or intentionally null.

⚠️ **Picker API backward compatibility**
- Project and Blog currently depend on `mode`, `mimeFilter`, `selectedIds`, and the return shape (string for single, string[] for multi). Rebuilding the picker must preserve these exactly — or migration effort doubles.
- Mitigation: write a characterization test for current behavior before rebuild. Verify signature preserved after rebuild.

⚠️ **localStorage scoping**
- "Recently used" is per-browser, not per-admin-account. In practice single-admin-site is fine, but on shared machines entries will leak.
- Mitigation: key namespace includes admin user id if available; clear on logout.

⚠️ **Upload tab auto-select UX**
- If upload fails partially (3 of 5 files succeed), auto-selecting only the 3 successful uploads in Library could surprise users.
- Mitigation: explicit toast summarizing N uploaded, N failed. Only successful uploads get auto-selected. Failed rows stay in Upload tab for retry.

⚠️ **Certification dual-mode complexity**
- Two input modes for one field (url string) means the form needs a mode toggle plus validation that adapts (file-url pattern for file mode, any-url for link mode).
- Mitigation: keep the toggle local to the certifications row; persist as a transient UI flag only — the DB `url` field stays a string regardless. If picker returns a Cloudinary URL, trust it.

⚠️ **Performance of multi-field search**
- `OR` across `originalFilename`, `altText`, `caption` may be slow on large libraries without an index.
- Mitigation: Postgres GIN index on these columns if benchmarks show degradation. For current scale (single-admin portfolio, ~hundreds of media) likely unnecessary.

⚠️ **E2E test scope creep**
- Five migration points × picker flows × upload flows = large matrix.
- Mitigation: one canonical E2E per migration point covering happy path; consolidate cross-cutting picker behavior (keyboard nav, recently used) into one dedicated picker spec.

## Alternatives Considered

### A: Keep picker and media page as separate codebases

- **Pros:** No refactor cost. No risk of regression in media page.
- **Cons:** UI drift continues. Every picker improvement has to be re-applied to media page and vice versa. Violates DRY.
- **Why not chosen:** Explicit user decision to do "full split" — atoms shared between picker and media page. Long-term maintenance win outweighs short-term refactor cost.

### B: Skip Skill.iconUrl migration (keep URL text input)

- **Pros:** Zero Prisma migration. Smaller epic.
- **Cons:** Editor inconsistency (Skill is the only remaining file field that doesn't use picker). Invites invalid URLs.
- **Why not chosen:** Explicit user decision to migrate all 5 points in this epic, accepting larger breakdown.

### C: Certification file-only (drop dual mode)

- **Pros:** Simpler UI, single validation path.
- **Cons:** Industry standard (LinkedIn, Credly) supports both — external issuer URL is common (e.g., credential page on coursera.org) and preferable to uploading.
- **Why not chosen:** Dual mode matches real-world certification data shape.

### D: Add "From URL" tab in v1

- **Pros:** Power users can paste external links without upload.
- **Cons:** Security (SSRF), storage semantics (proxy vs reference), and UX (what does "selected" mean for an external URL?) are all unresolved.
- **Why not chosen:** Defer — not blocking v1.

## Success Criteria

### Atoms
- [ ] `asset-grid`, `asset-upload-zone`, `asset-filter-bar` live in `libs/console/shared/ui/`, exported, with DDL showcase entries.
- [ ] Each atom has unit tests for its outputs (selection change, upload progress events, filter/sort change).
- [ ] Keyboard navigation works in grid/list per W3C Grid pattern.

### Picker
- [ ] 2-tab dialog (Library default, Upload) renders with ARIA `role=dialog` + `aria-modal`.
- [ ] Focus trap active while open; ESC closes (with confirm if upload pending).
- [ ] Search filters by filename + altText + caption.
- [ ] Sort offers 4 options; Newest default.
- [ ] Filter chips (MIME group) + folder dropdown work.
- [ ] Selection persists across tab switches.
- [ ] Upload completion auto-selects new items, switches to Library tab.
- [ ] Recently-used strip shows last 5 picked IDs from localStorage.
- [ ] Grid/list toggle persists in localStorage.
- [ ] Public API (`mode`, `mimeFilter`, `selectedIds`) unchanged — project-dialog and blog-editor call sites untouched.

### Media page
- [ ] Media page consumes `asset-grid` + `asset-upload-zone` + `asset-filter-bar` — no duplicate grid/upload code.
- [ ] Visual parity with picker verified.

### BE
- [ ] `list-media` accepts `search` (multi-field OR), `sort` (4 options), `folder` (UPLOAD_FOLDERS enum).
- [ ] Existing `mimeTypePrefix` param still works.
- [ ] Prisma migration for `Skill.iconId` FK succeeds (expand + backfill + contract).
- [ ] Unit tests for extended `list-media` query handler.

### Migration
- [ ] Profile avatar picker works; replaces inline upload.
- [ ] Profile OG image picker works; replaces inline upload.
- [ ] Profile resume EN/VI pickers work; `resumeUrls` JSON populated with picker-returned URLs.
- [ ] Profile certifications row has "File / Link" toggle; file mode uses picker, link mode uses text input; `url` field populated for both.
- [ ] Skill icon picker works; `iconId` FK populated; `iconUrl` removed after contract.

### E2E
- [ ] Profile avatar: open picker → select existing → save → reload → avatar persists.
- [ ] Profile resume EN: open picker (mimeFilter pdf) → upload new → auto-selects → save → download link works.
- [ ] Project gallery: multi-select existing images → "Insert N items" → save.
- [ ] Blog featured image: pick existing → save.
- [ ] Skill icon: pick existing → save → icon renders on landing.
- [ ] Certification: toggle file mode → pick PDF → save; toggle link mode → paste URL → save.
- [ ] Keyboard-only flow: arrow → space → enter → dialog closes, selection applied.

## Estimated Complexity

**XL (Extra Large)**

**Reasoning:**
- Three brand-new shared atoms, each with selection, keyboard, and accessibility concerns.
- Picker rebuild preserving backward-compatible public API.
- Media page refactor consuming the atoms.
- BE query extension with validation and tests.
- Expand-contract Prisma migration for Skill (3 deploy phases).
- Five distinct migration points in the console, each with its own form wiring and E2E.
- Breakdown expected to produce more tasks than usual — user has pre-approved this.

## Specialized Skills

- **`ctx:breakdown`** — decompose this epic into individual task files (expected 12–16 tasks).
- **`be-test`** — extended `list-media` query handler tests (search, sort, folder). Triggered for BE task.
- **`ng-lib`** — scaffold three new Angular libs (`asset-grid`, `asset-upload-zone`, `asset-filter-bar`) with correct Nx tags, import paths, and module boundaries.
- **`ui-ux-pro-max`** — design direction for atoms (grid density, list density, tab style, empty/loading/error states, drag-drop visual, recently-used strip); also for the dialog shell (tab switcher style, footer CTA layout, keyboard hint overlay).
- **`design-check`** — review each atom and the dialog against `.context/design/bank/` after build.
- **`prisma-migrate`** — expand-contract migration for `Skill.iconUrl` → `iconId` (destructive column drop requires backup + data script).
- **`playwright-skill`** — visual validation of picker and migrated forms in a running browser during development.
- **`aqa-expert`** — authoring the E2E test suite (POM, network monitoring, session persistence, keyboard flows).
- **`simplify`** — review atoms after build to catch over-engineering (extra abstractions, unused props, speculative flexibility).

## Status

completed

> Broken down into tasks 259-271 on 2026-04-17
> Follow-up task 272 added on 2026-04-18 (Docs/Archives mime group filter bug surfaced during task 263 manual testing).

## Created

2026-04-17
