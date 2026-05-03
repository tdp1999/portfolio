# Task: Console form updates for new Profile + Project fields

## Status: pending

## Goal
Update Console forms so Owner can edit the new Profile content blocks (tagline, stackIntro, contactIntro, footerTagline + multi-timezone) and the revised Project shape (links array + markdown body) entirely from the admin UI — fulfilling the "90% landing copy editable from console" goal.

## Context
Task 277 changes the schema and API. Without matching console forms, the new fields are invisible to the Owner. This task wires the admin UX so the Owner never has to touch code or DB to author landing copy.

## Acceptance Criteria
- [ ] **Profile form (`libs/console/feature-profile/`):**
  - Timezones: multi-select / chip-input bound to IANA zone list; existing single-zone value migrates to first chip; can add/remove freely
  - 4 new fields rendered in their own labeled block (e.g., "Landing copy"): tagline, stackIntro, contactIntro, footerTagline
  - Each is a markdown editor (reuse the same editor used for blog/post content) with EN/VI tab for translatable JSON
  - Helper text on each field explains *which surface* on landing it controls (e.g., tagline → "Hero sub-line on home page")
  - Optional/empty values supported — placeholder hint shown when null
- [ ] **Project form (`libs/console/feature-project/`):**
  - Links: array editor (add/remove/reorder rows) with fields: label (text), url (text, validated URL), type (select with 5 options: repo/demo/case-study/doc/post)
  - Existing single `sourceUrl` and `projectUrl` form fields **removed**
  - Body: markdown editor (EN/VI tabs) for the long-form D3.c case-study content; placeholder text suggests writing H2/H3 sections that become the ToC
  - Save flow validates link URLs and translatable JSON shape; surfaces errors per field per locale
- [ ] No regression: existing Profile/Project save flows still work for unchanged fields
- [ ] Console form types match the API DTOs from task 277 (no `as` casts, no `$any` per memory rule on template type discipline)

## Technical Notes
- Reuse existing markdown editor (whatever the blog post form uses) — do not introduce a second editor library.
- Multi-timezone: a small autocomplete on common IANA zones is enough for V1 (Asia/Ho_Chi_Minh, Asia/Singapore, America/New_York, Europe/London, etc.); full zone list is overkill.
- Per CLAUDE.md design rule: dashboard prefers Material; can mix `ui-*` shared components.
- Per memory: types in separate files; no nested rxjs subscribes; prefer template `routerLink`; pure helpers + template pipes.
- Per memory: no 1:1 payload re-mapping — pass `getRawValue()` through, push normalization into the service.

## Files to Touch
- `libs/console/feature-profile/src/lib/profile-page/**` (form, types, service)
- `libs/console/feature-project/src/lib/project-form-page/**` (form, types, service)
- Possibly a shared markdown-editor wrapper if not already extracted

## Dependencies
- 277 (schema + API + DTOs must exist first)

## Complexity: M

## Progress Log
