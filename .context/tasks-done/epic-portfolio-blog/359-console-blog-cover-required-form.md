# Task: Console — enforce cover-image-required in BlogPost form

## Status: done

## Goal
Console blog post create/edit form must require a featured cover image before submit (matching domain rule PST-011 and the BE enforcement landed in task 357).

## Context
Per `epic-portfolio-blog.md` § Direction Pivot. The BE in task 357 will reject any submit without a cover; the console form must mirror that rule client-side so users get a clear error inline instead of a server-round-trip rejection.

Find the existing blog-post form in `libs/console/feature-blog-post/` (verify path). Add a synchronous required validator on the cover-image control and surface the error via the form-field's standard error chrome.

## Acceptance Criteria
- [x] Console form requires a cover image before the submit button enables (or before submit triggers BE call).
- [x] Validation message reads something coherent — e.g. "Cover image is required (PST-011)." Sentence-case, no exclamation.
- [x] Submit attempt without cover surfaces the error inline next to the cover input (existing error-chrome pattern).
- [x] If the user removes a previously-set cover and tries to save, same error fires.
- [x] Existing posts that load with a cover already set start in valid state.
- [x] Test: form unit test (existing harness) covers `requires cover image` case + `accepts when cover present` case.
- [x] Type-check + landing console build pass.

## Technical Notes
- Reactive form: add `Validators.required` on the cover control. If the control is structured (separate `featuredImageId` + `featuredImageUrl` fields for preview), validate on the id field.
- Error dictionary: see `.context/patterns-error-handling.md` for the BE-throw → FE-toast/inline-error contract. The inline path is what we want here; no toast needed for a form-validation error.
- The submit handler should not optimistically POST; rely on the form's `.invalid` gate.
- Cover-upload UX is out of scope — assume the existing media picker works; just require its output.

**Specialized Skill:** None unless one applies — this is a small console form change.

## Files to Touch
- `libs/console/feature-blog-post/src/lib/.../<form>.component.{ts,html}` (exact path TBD — grep `featuredImage` in `libs/console/feature-blog-post`)
- Possibly `libs/console/feature-blog-post/src/lib/.../<form>.component.spec.ts`

## Dependencies
- 357 (BE side enforces the same rule; without 357 there's still BE drift, but the form change is safe to ship first since BE was already lax)

## Complexity: S

## Progress Log

### 2026-05-28 — Implemented + tested + built

**Design choice**
- Kept `featuredImageId` inside the existing `nonNullable.group` (no separate signal) using an **empty-string sentinel for "no cover"**. `Validators.required` rejects empty strings, so the same single validator gates create, edit, and post-clear states. Avoided introducing `null` into the form value (would have required non-null assertions on `getRawValue()` for every other field).

**Files touched**
- `libs/console/feature-blog/src/lib/post-form-page/post-form-page.ts`
  - Added `featuredImageId: ['', [Validators.required]]` to the form group.
  - Removed the standalone `featuredImageId = signal<string | null>(null)` (kept `featuredImageUrl` signal for preview rendering only).
  - `openFeaturedImagePicker()` writes to the control via `form.controls.featuredImageId.setValue(item.id)` and marks touched.
  - `clearFeaturedImage()` writes `''` + marks touched so the error surfaces immediately.
  - `save()` reads from `raw.featuredImageId` (already non-null because of `nonNullable.group`).
  - `discard()` + `loadPost()` round-trip through `''` for legacy/null incoming covers; non-empty ids load in valid state.
- `libs/console/feature-blog/src/lib/post-form-page/post-form-page.html`
  - Wrapped the cover block with `[class.field-block--invalid]` and added an inline `<p class="field-block__error">` driven by `formError: { required: 'Cover image is required (PST-011).' }`.
- `libs/console/feature-blog/src/lib/post-form-page/post-form-page.scss`
  - Added `.field-block--invalid` outline + `.field-block__error` text style using `--mat-sys-error`.
- `libs/console/feature-blog/src/lib/post-form-page/post-form-page.spec.ts` (new)
  - 3 specs covering: (a) empty form rejects with `required`, (b) form accepts with a media id set, (c) `clearFeaturedImage()` re-fires the error.

**Verification**
- `npx tsc --noEmit -p libs/console/feature-blog/tsconfig.lib.json` — clean.
- `npx tsc --noEmit -p apps/console/tsconfig.app.json` — clean.
- `npx jest --config libs/console/feature-blog/jest.config.cts post-form-page.spec.ts --no-coverage` — **3/3 pass**.
- `pnpm nx build console` — succeeded (pre-existing budget warning only).

### 2026-05-28 — Done — all ACs satisfied
