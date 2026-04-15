# Epic: Profile Per-Section Refactor

## Summary

Restructure the Profile module from a monolithic aggregate + single-form save into sectioned value objects + per-section commands + per-section save UX. This is the first concrete adoption of the long-form chassis (ADR-013) and per-section save semantics (ADR-014). Delivers 5 reusable shared layout components (`LongFormLayoutComponent`, `ScrollspyRailComponent`, `SectionCardComponent`, `StickySaveBarComponent`, `UnsavedChangesGuard`) that all future long-form pages (Experience, Project, Article, Notifications, Billing) will consume.

## Why

- Current Profile UX is broken: 40+ flat controls, single page-bottom Save, no orientation aid, no per-field save granularity. Failure in one field blocks save of all others.
- ADR-013/014 just adopted — Profile is the canonical Settings module; refactoring it proves out the chassis before applying to other modules.
- BE already has breadcrumbs (`UpdateAvatarCommand`, `UpdateOgImageCommand`) showing the fine-grained command pattern; this epic generalizes that pattern to all sections.
- Shared layout components built here are reused across the entire console long-form surface — high leverage.

## Target Users

- **Admin (site owner)**: Edits profile sections independently; saves only the section they touched; sees clear status per section.
- **Future module developers (us)**: Consume `LongFormLayoutComponent` + friends to build Experience-edit-page, Project-edit-page, etc., without re-inventing the chassis.

## Scope

### In Scope

**Shared FE layout components** (`libs/console/shared/ui`):

- `LongFormLayoutComponent` — outer two-column layout (rail + content)
- `ScrollspyRailComponent` — sticky left rail with section list, status icons, scrollspy via Angular CDK + IntersectionObserver, fragment-link click handling
- `SectionCardComponent` — description-left / form-right card with anchor id, optional per-section save footer
- `StickySaveBarComponent` — atomic-save bar (built here for Experience/Project later, exported now to validate API)
- `UnsavedChangesGuard` — `CanDeactivateFn` + `beforeunload` listener (in `libs/console/shared/util`)

**BE refactor** (`apps/api/src/modules/profile`):

- Domain: split `Profile` aggregate into value objects matching the 6 logical sections (Identity, WorkAvailability, Contact, Location, SocialLinks, SeoOg). Aggregate keeps the same Prisma row but composes VOs.
- Application: replace `UpsertProfileCommand` with 6 section commands (`UpdateProfileIdentityCommand`, `UpdateProfileWorkAvailabilityCommand`, `UpdateProfileContactCommand`, `UpdateProfileLocationCommand`, `UpdateProfileSocialLinksCommand`, `UpdateProfileSeoCommand`). Keep `UpdateAvatarCommand` and `UpdateOgImageCommand` as-is (already fine-grained).
- DTO: 6 section-level Zod schemas, one per command. Drop monolithic `UpsertProfileSchema`.
- Repository: 6 targeted `update*Section()` methods using Prisma `.update()` with section-scoped field map (pattern from `updateAvatar()`).
- Tests: per-command handler tests + per-section repo tests (existing TDD pattern).
- Controller: 6 PATCH endpoints, one per section. Public GET unchanged.

**FE refactor** (`libs/console/feature-profile`):

- `ProfilePageComponent` adopts new chassis: parent `FormGroup` with 6 child `FormGroup`s (one per section).
- Each section card binds to its child FormGroup; section-level Save button calls section command via `ProfileService.updateSection()`.
- Bilingual fields (EN/VI) inside each section grouped consistently — establish convention (nested FormGroup `{ en, vi }` per bilingual field).
- Wire dirty/error/saved status from each child FormGroup → ScrollspyRail status icons.
- Avatar + OG image keep their existing dedicated upload flows (already section-scoped).

**E2E tests** (`apps/console-e2e`):

- Page Object for new long-form layout (rail + section cards)
- Test: save Identity section → other sections remain pristine, no spurious requests
- Test: validation error in Skills section → other sections unaffected, error icon shows on rail
- Test: navigate-away with dirty section → guard fires, modal options work
- Test: scrollspy active state updates as user scrolls

### Out of Scope

- **Auto-save (tier 2)** — explicit per-section save only for v1; localStorage draft autosave deferred
- **Atomic-save modules (Experience, Project)** — `StickySaveBarComponent` exported and unit-tested but not wired into Experience/Project pages (separate epic)
- **Mobile responsive variant of long-form chassis** — desktop-first; mobile breakpoint plan deferred
- **DB schema migration** — Prisma `Profile` model stays flat; only domain/application layer restructured
- **Public landing-page changes** — public `GET /profile` response shape unchanged; landing consumers untouched
- **Other Settings pages** (Notifications, Billing) — chassis built generically here, but those pages don't exist yet

## High-Level Requirements

1. Section commands validate independently — invalid Identity submission must not affect WorkAvailability state.
2. Section repository methods touch only the fields they own — verifiable via Prisma query inspection in tests.
3. ScrollspyRail correctly highlights the section currently in viewport (use IntersectionObserver, not scroll listener).
4. Clicking a rail item smooth-scrolls to the section AND updates URL fragment for deep-linkable sections.
5. Per-section Save button enables only when its FormGroup is dirty + valid.
6. Per-section Save shows: idle / loading / saved-2s-ago / error states inline within the card.
7. UnsavedChangesGuard fires on any-section-dirty navigation away (Angular Router) AND on browser close (`beforeunload`).
8. Console main sidebar collapses on the Profile page to keep visual density low (per ADR-013 layout contract).
9. All 6 section commands tested per existing CQRS test pattern (handler unit + repo integration where applicable).
10. E2E covers happy path + section-isolation + nav guard + scrollspy active state.
11. Shared components live in `libs/console/shared/ui` and are independently importable (Storybook-style demo on `/ddl` route per project convention).
12. Bilingual field convention documented in `.context/design/console.md` after implementation.

## Technical Considerations

### Architecture

- **Backend**: NestJS Controllers → Command/Query Handlers → Repositories → Prisma. Pattern unchanged; granularity refined.
  - Each section command implements the existing CQRS handler interface, validates via section-scoped Zod schema, then calls a single targeted repo method.
  - Profile aggregate gains static factory methods per section (`Profile.fromIdentity(...)` style not needed — use VO composition pattern: aggregate constructor takes all VOs, each section command loads aggregate, mutates only its VO, persists via section repo method).
  - Decision needed during build: do we surface VOs in repo signatures, or convert at handler boundary? **Recommendation**: convert at handler boundary — repo stays Prisma-shaped, domain stays VO-shaped.
- **Frontend**: Angular standalone components, signals, OnPush. New shared layout lib uses content projection (`<console-section-card>` projects header + form).
  - `LongFormLayoutComponent` slot-based: `<ng-content select="[rail]">` + `<ng-content select="[content]">`. Header projected into card via `<ng-template #header>` API.
  - `ScrollspyRailComponent` exposes `sections: input<SectionDescriptor[]>()` where descriptors include id, label, status signal, dirty signal.
  - `SectionCardComponent` exposes `formGroup: input<FormGroup>()` and emits `(save)` for per-section save mode.

### Dependencies

- ADR-013, ADR-014 (just adopted)
- Bank patterns: `long-form-layout`, `settings-section`, `atomic-save`
- Existing console design tokens, Material overrides, grain/glow effects
- Angular CDK (already a dependency) for `ScrollDispatcher` if needed; native `IntersectionObserver` preferred
- Existing `form-error` pipe + validators (per recent commit `cfd2ce7`)
- Existing TDD pattern + test-runner subagent
- `aqa-expert` skill for E2E

### Data Model

- **No DB schema changes.** Prisma `Profile` model stays flat (~28 columns).
- Domain layer: 1 aggregate (`Profile`) composed of 6 VOs (`Identity`, `WorkAvailability`, `Contact`, `Location`, `SocialLinks`, `SeoOg`). Each VO is a frozen object with its own validation invariants.
- API contract: 6 PATCH endpoints `/api/profile/identity`, `/api/profile/work-availability`, etc. Each accepts only its section's fields.

## Risks & Warnings

⚠️ **First-mover component design risk**
- These shared components will be reused across many pages. A weak API now creates compounding cost.
- Mitigation: build Profile against the components, then sanity-check the API by sketching how Experience-edit-page would consume `StickySaveBarComponent` before merging.

⚠️ **Bilingual FormGroup convention**
- Profile has many `field_en` / `field_vi` pairs flat today. Naive nested grouping (`identity.bio.en`, `identity.bio.vi`) breaks all existing reactive bindings.
- Mitigation: pick convention up-front (recommend nested `{ en, vi }` per bilingual field), document in console design doc, apply uniformly.

⚠️ **Hard cut vs deprecation of `UpsertProfileCommand`**
- No external API consumers (only console FE). Hard cut is safe.
- Recommendation: hard cut. Delete `UpsertProfileCommand` + `UpsertProfileSchema` + repo `upsert()` in same PR as new section commands. Avoids dead code.

⚠️ **Scrollspy edge cases**
- Sections shorter than viewport make highlight ambiguous (multiple in view).
- Mitigation: highlight the section whose top is closest to viewport top; debounce on rapid scroll.

⚠️ **CanDeactivate + transitions/dialogs**
- Guard can fire spuriously inside dialogs or modal flows. Test with Material Dialog + Router edge cases.

⚠️ **Section status in rail desyncs from FormGroup state**
- If status icons read stale state, user trust collapses.
- Mitigation: status driven by `effect()` reading `formGroup.statusChanges` + `dirty` signal directly, no manual sync.

⚠️ **E2E flakiness on scrollspy**
- Scroll-based assertions notoriously flaky.
- Mitigation: assert via fragment URL update + `aria-current="true"` on rail item, not pixel positions. Use `aqa-expert` skill conventions.

## Alternatives Considered

### Keep monolithic command, only refactor FE into sections
- **Pros:** Less BE churn; FE can fake per-section save by sending full Profile each time.
- **Cons:** Validation still all-or-nothing; partial-save illusion masks the real save semantic; repo still rewrites all fields per save.
- **Why not chosen:** ADR-014 mandates per-section commands for Settings modules; faking it defeats the purpose.

### Build chassis as part of Profile feature lib (not shared)
- **Pros:** Faster delivery; avoids API design pressure.
- **Cons:** Re-implementation cost when next long-form page lands; component boundary unclear.
- **Why not chosen:** Chassis is the high-leverage deliverable; building it inline guarantees re-implementation later.

### Do BE refactor and FE refactor in separate epics
- **Pros:** Smaller PRs, each less risky.
- **Cons:** Either FE waits weeks for BE, or FE ships against deprecated commands and rewrites again.
- **Why not chosen:** Vertical slice per existing module-epic convention. BE + FE + E2E ship together.

## Success Criteria

- [ ] All 6 section commands implemented, tested, replacing `UpsertProfileCommand` (deleted)
- [ ] All 6 section repo methods touch only their fields (verified by query inspection in tests)
- [ ] 5 shared layout components live in `libs/console/shared/ui` with demo on `/ddl`
- [ ] `ProfilePageComponent` rebuilt on new chassis; per-section save works; scrollspy active state correct
- [ ] UnsavedChangesGuard fires correctly for in-app nav and browser close
- [ ] Bilingual FormGroup convention documented in `.context/design/console.md`
- [ ] E2E suite covers happy path, section isolation, nav guard, scrollspy
- [ ] No regressions in landing page (public profile GET response unchanged)
- [ ] Console build passes typecheck, lint, unit tests, E2E

## Estimated Complexity

**L** (large, but bounded)

**Reasoning:**
- BE refactor is mechanical once VO split is decided (~6 commands × ~3 files each + tests)
- FE shared components are 5 in number but each is small (under 200 lines)
- Profile-page rewrite is the riskiest piece (form restructure + bilingual convention + section save wiring)
- E2E is well-scoped given existing `aqa-expert` patterns
- No DB migration, no external API consumers, no business logic changes — purely structural

Likely 8–12 tasks after breakdown.

## Status

completed

## Created

2026-04-13

## Broken Down

2026-04-13 — into tasks 248–258 (11 tasks)
