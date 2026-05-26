# Task: Console — enforce cover-image-required in BlogPost form

## Status: pending

## Goal
Console blog post create/edit form must require a featured cover image before submit (matching domain rule PST-011 and the BE enforcement landed in task 357).

## Context
Per `epic-portfolio-blog.md` § Direction Pivot. The BE in task 357 will reject any submit without a cover; the console form must mirror that rule client-side so users get a clear error inline instead of a server-round-trip rejection.

Find the existing blog-post form in `libs/console/feature-blog-post/` (verify path). Add a synchronous required validator on the cover-image control and surface the error via the form-field's standard error chrome.

## Acceptance Criteria
- [ ] Console form requires a cover image before the submit button enables (or before submit triggers BE call).
- [ ] Validation message reads something coherent — e.g. "Cover image is required (PST-011)." Sentence-case, no exclamation.
- [ ] Submit attempt without cover surfaces the error inline next to the cover input (existing error-chrome pattern).
- [ ] If the user removes a previously-set cover and tries to save, same error fires.
- [ ] Existing posts that load with a cover already set start in valid state.
- [ ] Test: form unit test (existing harness) covers `requires cover image` case + `accepts when cover present` case.
- [ ] Type-check + landing console build pass.

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
