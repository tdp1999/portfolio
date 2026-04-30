# Epic: Profile Page Section Extraction + Error Handler Spec Fix

## Summary

Split the monolithic `profile-page.ts` (~900 lines, ~500 lines HTML) into 7 dedicated section
components, each owning its `FormGroup`, save action, signals, and `ServerErrorDirective` wiring.
Parent `profile-page` becomes a thin shell: loads profile data, lays out sections, owns the
scrollspy rail. Also fix 2 pre-existing failing tests in `error-handler.provider.spec.ts` that
have been red since before this session (unrelated to the section extraction; bundled together
because both are profile/error-handling cleanup).

## Why

The profile page is the only form in the console where one component owns 7 unrelated forms.
Every other feature (`feature-tag`, `feature-experience`, `feature-project`, etc.) has one form
per component. The asymmetry means:

- **Cognitive load** — editing one section means scrolling past 6 unrelated ones, plus 7 saving
  signals, 7 lastSaved signals, 7 dirty signals, 7 invalid signals interleaved.
- **Re-render scope** — OnPush helps, but signal reads in the 500-line template cause CD on the
  whole template when any section's state changes.
- **Pattern consistency** — new contributors now have a clear "one form = one component" rule
  to follow. Profile is the outlier.
- **Testability** — per-section specs would be smaller and focused; today's spec mocks the
  entire `ProfileService` to test one section at a time.

The 2 failing tests are unrelated to extraction but are the last red marks in the affected
projects. Bundled here so the epic closes with green tests across the board.

## Target Users

- **Future maintainers** of the profile page (any new field, any layout change).
- **Anyone running the test suite in CI** (no more red).

## Scope

### In Scope

- Extract all 7 sections into per-section components in `libs/console/feature-profile/src/lib/sections/`:
  - `IdentitySectionComponent` (also owns Avatar picker)
  - `WorkAvailabilitySectionComponent`
  - `ContactSectionComponent`
  - `LocationSectionComponent`
  - `SocialLinksSectionComponent` (owns resume URL pickers + dynamic FormArrays)
  - `SeoOgSectionComponent` (also owns OG image picker)
  - `AdminContactAddressSectionComponent`
- Each section component:
  - Standalone, OnPush change detection.
  - Takes initial profile data as a signal `input()`.
  - Builds its own `FormGroup` from input data.
  - Owns its own `saving`, `lastSaved`, `dirty`, `invalid`, `status` signals.
  - Wires `[consoleServerErrorMap]` on its root form group.
  - Calls `profileService.update*()` directly.
  - Emits a `(saved)` event the parent uses to refresh in-memory profile state.
- Parent `ProfilePageComponent`:
  - Becomes a thin shell: load profile, lay out section components, own the scrollspy rail.
  - Holds the loaded profile in a signal that section components read from.
  - Listens for each section's `(saved)` event and re-fetches (or merges) profile state so
    cross-section reads stay in sync.
- Update `profile-page.spec.ts` for the new structure. Add minimal per-section spec for at least
  one section as a template (`identity-section.spec.ts`) so future sections get tested.
- **Fix 2 failing tests** in `apps/console/src/app/error-handler.provider.spec.ts`:
  - "should show generic fallback toast for unknown errors"
  - "should show generic fallback when message is an object (not a string)"
  - Root cause: tests assert `'An unexpected error occurred. Please try again.'` but
    `extractApiError` defaults to `'An unexpected error occurred'` (no period or "try again"),
    and the global handler's `apiError.message` branch toasts that defaulted message before
    reaching the hardcoded fallback. Either align the assertion with what `extractApiError`
    returns, or change the handler's fallback path so the hardcoded fallback always wins on
    truly unknown errors. **Decision:** align the test assertions with the actual behavior —
    the message-from-body path is the correct one, and the test's expectation was always wrong.
- Clear "Profile-page section extraction" bullet from
  `.context/patterns-error-handling.md` "What's deliberately not here (yet)".

### Out of Scope

- No business logic changes — this is a pure refactor. Same forms, same fields, same save
  endpoints, same UX.
- No design / styling changes. Each section card looks identical to today.
- No service/API changes (e.g. no merging `updateContact` + `updateLocation` into one
  `updatePartial` endpoint). The `AdminContactAddress` quirk is preserved as-is.
- No removal of `FormSnapshotDirective`, `consoleFormSnapshotRebuild`, or other existing
  cross-cutting directives — they move into each section unchanged.
- No conversion of media pickers to a shared `MediaFieldComponent` (tempting but separate
  cleanup).
- The 4 still-deferred entries elsewhere (per-violation field codes, localization, two ADRs).
  We're only removing the profile-page bullet.

## High-Level Requirements

1. Each of the 7 sections is its own standalone component file under
   `libs/console/feature-profile/src/lib/sections/<name>-section/`.
2. Parent `profile-page.ts` is reduced to <300 lines (down from ~900) and contains no
   FormGroup definitions, no per-section save methods, no per-section signals.
3. Parent `profile-page.html` is reduced to <100 lines (down from ~500) and contains only the
   header, scrollspy rail, and `<console-foo-section ... />` references.
4. Every section continues to:
   - Render `mat-error` inline for validation failures (via `ServerErrorDirective`).
   - Show its own saving spinner, lastSaved indicator, error/editing/saved status badge.
   - Participate in the scrollspy rail with correct status.
5. The `AdminContactAddress` quirk (saves via `updateContact` + `updateLocation`) is preserved.
   This section reads non-admin sibling fields (email, country, city) from the parent's profile
   signal — kept up to date by the `(saved)` event dance.
6. Avatar and OG image pickers remain co-located with the sections that display them
   (Identity and SeoOg respectively).
7. The 2 failing tests in `error-handler.provider.spec.ts` are now green.
8. All other existing tests (`profile-page.spec.ts`, `experience.dto.spec.ts`, etc.) remain
   green.
9. Manual smoke: every section saves successfully, every validation error renders inline +
   toast, every dirty/invalid badge updates correctly, scrollspy rail status icons match.
10. The "Profile-page section extraction" bullet is removed from
    `patterns-error-handling.md`.

## Technical Considerations

### Architecture

- Follows the existing console feature library convention: `libs/console/feature-profile/src/lib/`.
- Each section is a private component in `sections/`, exported via `index.ts` only if needed
  by the parent.
- Section components import `ServerErrorDirective`, `FormErrorPipe`, `SectionCardComponent`,
  `FormSnapshotDirective`, the relevant Material modules, and any custom components they need
  (`ChipSelectComponent`, `TranslatableGroupComponent`, etc.).
- The parent's `mediaDataSource: MediaPickerDataSource` is created in the parent and passed
  down to sections that need pickers (Identity, SeoOg). Alternative: each section creates its
  own — slightly redundant but cleaner ownership. **Decision:** parent creates and injects via
  input, since the data source has no per-section state.

### Cross-section coordination

- Parent owns a single `profile = signal<ProfileAdminResponse | null>(null)` source of truth.
- Each section receives `[initialData]="profile()"` as a signal input.
- On a section's successful save, it emits `(saved)="onSectionSaved($event)"` carrying the
  patched response (or just calls `profileService.getProfile()` and emits the fresh blob).
- Parent merges the patch into the `profile` signal. Other sections re-derive their initial
  values from the new signal value if their input changes. This handles the
  `AdminContactAddress` cross-coupling cleanly.

### Scrollspy rail status

- Each section exposes a `readonly status: Signal<SectionStatus>`.
- Parent uses `viewChildren()` (Angular 21 signal queries) to collect references to all
  section components, then maps each to its `status` signal for the scrollspy `sections`
  array.

### `FormSnapshotDirective` placement

- Each section places `consoleFormSnapshot` on its own root form (same as before, just
  per-section now). Snapshot rebuild for SocialLinks goes with the SocialLinks section.

### Tests

- `profile-page.spec.ts` becomes much smaller — only verifies "loads profile, hands data to
  sections, tracks scrollspy status". The per-section save/error/rollback tests *move* into
  per-section specs.
- Add `identity-section.spec.ts` as a template, covering: form builds from input, validation
  shows inline, save calls `profileService.updateIdentity`, error path clears spinner without
  toasting (global handler covers).
- The other 6 sections can ship without specs in this epic (covered by manual smoke + e2e
  later); the `identity-section.spec.ts` is the pattern others can follow.

### Error handler spec fix

- Tests live at `apps/console/src/app/error-handler.provider.spec.ts:70-85`.
- The expectation `'An unexpected error occurred. Please try again.'` is wrong — when the BE
  returns a string body or a body with a non-string `message`, `extractApiError` produces
  `'An unexpected error occurred'` (or echoes the string body). Update the assertions to match
  what the extractor actually returns. No production code change.

## Risks & Warnings

⚠️ **Cross-section state synchronization**

- The `AdminContactAddress` section needs the latest values of email/country/city from
  Contact and Location sections. After extraction, those values come from the parent's
  `profile` signal, which is updated on every successful save.
- Risk: stale read if the user changes Contact section's email, hits Save, but the
  `updateContact` race overlaps with an `AdminContactAddress` save. Today's monolith has the
  same issue (it reads form values, not server values).
- Mitigation: `AdminContactAddress` continues to read sibling form values from `profile`
  signal *as it is now*. If user has unsaved edits in Contact section when triggering an
  Admin save, those unsaved edits are NOT included — same as today's behavior.

⚠️ **`FormGroupDirective` injection**

- `ServerErrorDirective` injects `FormGroupDirective`. Each section must apply
  `[formGroup]="..."` (Angular's directive, which the section card already uses), so the
  injection works. No surprise here, but verify per section.

⚠️ **Parent–child ChangeDetection**

- Parent uses OnPush. When parent's `profile` signal updates, child sections receive new
  `initialData` input. Each section must rebuild its FormGroup from the new initial data —
  but only if the data actually changed for that section. Naive `effect()` over `initialData`
  could clobber unsaved user edits.
- Mitigation: section's FormGroup builds from `initialData` exactly **once** on construction
  (via `computed()` + `untracked()`), then ignores subsequent input changes. The parent's
  patch back to `profile` signal is informational only — the section's local form state stays
  authoritative until the next page reload.

⚠️ **Avatar / OG image side effects**

- Today, avatar and OG image saves bypass the form (save-on-pick). They live alongside their
  section. After extraction, Identity and SeoOg sections each own their own avatar/OG state
  signals (`avatarPreview`, `ogImagePreview`). The parent doesn't need to track these.

⚠️ **Test coverage temporarily drops**

- `profile-page.spec.ts` shrinks. The save-error rollback assertions for 6/7 sections move to
  manual smoke (only Identity gets a spec template in this epic). Acceptable, but flag in PR
  description.

⚠️ **Refactor scope creep**

- This is genuinely a 7-component creation pass. Stay focused. Do **not** also: rename
  `profile.types.ts`, factor out `bilingualGroup`, refactor `MediaPickerDataSource`,
  introduce a `BaseSectionComponent`, etc. Each is a separate cleanup if pursued.

## Alternatives Considered

### "Tiny tweak" — keep monolith, just relocate FormGroups into providers

- **Pros:** zero structural change, low risk.
- **Cons:** doesn't fix any of the cognitive-load / re-render / consistency issues. Profile
  remains the outlier. Tests don't get smaller.
- **Why not chosen:** It's the in-place migration we already did in the previous session.
  This epic is the *next* step.

### Service-based store (`ProfileStateService`) instead of signal-on-parent

- **Pros:** decouples sections from parent entirely. Each section pulls profile state from
  the service. Easier to test sections in isolation.
- **Cons:** introduces a new architectural primitive (state service) just for one feature.
  No other feature in the console works this way.
- **Why not chosen:** YAGNI. Signal-on-parent is enough. If we add a third feature with the
  same pattern, *then* extract a service.

### Merge `updateContact` + `updateLocation` into a single `updatePartial` endpoint

- **Pros:** removes the cross-section read entirely. AdminContactAddress becomes simple.
- **Cons:** BE change, separate concern, larger blast radius.
- **Why not chosen:** Out of scope for this refactor. Could be a follow-up if the
  cross-section read causes pain.

### Keep `AdminContactAddress` in parent, extract only the other 6

- **Pros:** sidesteps the cross-coupling problem entirely.
- **Cons:** inconsistent — one section is special-cased. The pattern "every section is its
  own component" weakens.
- **Why not chosen:** the cross-coupling is solvable via the `profile` signal pattern. Worth
  the small extra wiring to keep the pattern consistent.

## Success Criteria

- [ ] 7 section components exist under `libs/console/feature-profile/src/lib/sections/`.
- [ ] Parent `profile-page.ts` < 300 lines.
- [ ] Parent `profile-page.html` < 100 lines.
- [ ] All sections render and save correctly (manual smoke through every save action).
- [ ] Validation errors render inline + summary toast for every section.
- [ ] Scrollspy rail status icons match each section's actual state (untouched / editing /
      saved / error).
- [ ] `profile-page.spec.ts` passes (rewritten for the new shape).
- [ ] `identity-section.spec.ts` exists and passes.
- [ ] All other previously-passing tests still pass.
- [ ] The 2 previously-failing `error-handler.provider.spec.ts` tests now pass.
- [ ] "Profile-page section extraction" bullet removed from `patterns-error-handling.md`
      "What's deliberately not here (yet)".
- [ ] No new `extractApiError` callers anywhere in `feature-profile`.

## Estimated Complexity

**L** (Large)

**Reasoning:**

- 7 new component files (ts + html each = 14 files), plus 1 spec file, plus 2 file rewrites
  (parent ts + html), plus test file fixes = ~18 file touches.
- Cross-section state coordination needs careful wiring.
- Risk of subtle ChangeDetection / form-rebuild bugs requires post-implementation manual
  smoke through every save path.
- Single-session feasible if focused — no new architecture, no new library, no schema.

## Status

completed

## Created

2026-04-30
