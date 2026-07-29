# Task: Fix broad console-e2e test-drift unmasked by the 429 throttle fix

## Status: in-progress

## Goal

Repair the ~72 failing `console-e2e` tests (19 spec files) that surfaced once the login-throttle
`429` was fixed (task 384). Fix cluster by cluster, verify locally, then let CI confirm.

The opening premise was "all failures are **test-drift** — the app is healthy, the tests are stale". That holds
for most of the suite, and the drift is real: specs and POMs still use selectors from before the console UI
refactors (profile-per-section, media-picker-unification, console-ui-redesign). But it is not universal, and
treating it as universal is how a red suite hides live defects. **Seven** exceptions were found, each recorded
below:

1. the avatar/OG endpoints leaked a Prisma `P2025` as a 500;
2. "Passwords do not match" could never render;
3. PDF/JPEG e2e fixtures were never uploadable, because the helper always wrote PNG bytes;
4. `nx serve api` set no runtime `NODE_ENV`, so the login throttle task 384 was meant to lift was still on locally;
5. **`@Roles` declared at class level was never enforced** — the whole `admin/blog` API and dashboard stats were
   open to any authenticated non-admin;
6. icon-only `console-chip-select` chips had **no accessible name** (WCAG 4.1.2);
7. `/profile` never warns on unsaved changes — `hasUnsavedChanges()` is a hard-coded `signal(false)`.

An eighth surfaced only _because_ (5) was fixed: the console dashboard calls an admin-only endpoint for every user,
so once the guard started enforcing, a non-admin was bounced to a full-page 403. A broken guard had been hiding a
broken page.

When a spec fails, the question is which of the two sides is wrong — not which selector to update.

## Context

- Task 384 fixed the auth login `429` (throttle now prod-only). Before that, ~every e2e test died at
  login `429`, masking the real state of the suite. First green-login CI run (`28651005883`): **72 failed
  / 94 passed**, all timeout-style failures (`locator.waitFor/click`), zero `429`.
- Root cause confirmed against live DOM (via playwright-skill + a real local admin login): the console UI
  was restructured and the specs were never updated.
- **The local runner was believed blocked** by a Playwright browser "version mismatch", so most of this task was
  written without ever running it — verification went through **playwright-skill** driving the real app, plus CI.
  That diagnosis was wrong; see "The local runner was never actually version-mismatched" below. The runner now
  works locally via `PW_CHANNEL=msedge`, with no download.
- Local admin for skill-driven verification: user-provided (do not hardcode/commit). e2e test users
  (`test-*@e2e.local`) are seeded by `global-setup` and removed by `global-teardown`, so they are NOT
  present between runs — use the real local admin for skill checks.

## Drift map (corrected 2026-07-28 — the first version named the wrong cause in five rows)

Rewritten in place after each cluster was read against the templates. The original map was assembled from
failure messages plus a partial DOM read, and every timeout looks alike, so it attributed several clusters to
selector drift when the page had actually been restructured underneath the spec. What each row says now is what
the source says. The audit trail of what the first version got wrong is kept below under "What the first map got
wrong".

| Cluster           | Spec(s)                                                                                                      | Real cause                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Status                                                                                                                                                         |
| ----------------- | ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Profile avatar/OG | `profile-avatar-picker`                                                                                      | Trigger is an icon-only `button.media-trigger--{avatar,og}` with no accessible name; spec used `button:has-text('Change')`. Compounding it, `PATCH /api/admin/profile/avatar` leaked a Prisma `P2025` as a 500 when no profile row existed, so setup died before any assertion.                                                                                                                                                                                                                                                               | **Done.** FE `aria-label="Change avatar"` / `"Change OG image"`; API now returns a shaped 404; spec seeds a profile row.                                       |
| Media picker POM  | (shared) `media-picker.page.ts`                                                                              | **Not** a selector problem — `getByRole('radio', { name: 'Library' })` was already right. A race: `waitForOpen()` returned on host visibility, before the segmented control, filter bar and grid mounted.                                                                                                                                                                                                                                                                                                                                     | **Done.** `waitForOpen()` waits for the Library toggle _and_ a settled grid (`waitForGridSettled()`, keyed on `aria-busy`).                                    |
| Profile sections  | `profile-per-section`, and the setup half of every profile spec                                              | Section gating. `profile.html` renders every section but gates its body with `[hidden]="!showAll() && activeId() !== id"`, so an unselected section resolves as a locator and never becomes visible. Also `nav.scrollspy-rail` is gone — nav is `console-section-tabs`, rendered twice (rail + sub-laptop strip), so unscoped locators trip strict mode.                                                                                                                                                                                      | **Done.** `SectionTabs` + `activate(sectionId)` in `section-form.page.ts`; every locator scopes to `nav.section-tabs__rail`.                                   |
| Resume            | `profile-resume-picker`                                                                                      | Resume is a **subsection of Social Links**, not a section: no `section#section-resume`, no `[data-locale]`. The old spec was written speculatively before the UI existed — none of its selectors ever matched anything. Separately, its PDF fixture could never upload (see the fixture bug below).                                                                                                                                                                                                                                           | **Done.** Rewritten against `.resume-row` / `.locale-badge`; real PDF bytes via `MediaPage.createTestPdf`.                                                     |
| Certifications    | `profile-certification-picker`                                                                               | Same subsection story, rows are `.cert-row` (not `[role="group"]`). The mode control is a `console-chip-select`; despite the `[attr.role]="'radio'"` in its template the chips resolve as **`option`** with **`aria-selected`** — Material's inner `<button role="option">` owns the accessible node. (An earlier version of this row said `radio`/`aria-checked`; that came from reading the template rather than the rendered tree.) `mode` is never persisted: `save()` strips it and the section re-derives it with `inferCertMode(url)`. | **Done.** Rewritten, 13 tests; `seedProfile` moved to `beforeEach` because saved rows bled between tests.                                                      |
| Routed forms      | `skill-icon-picker`, `project-gallery-picker`, `blog-featured-picker`, `skill-crud`                          | **Not** trigger drift. Skill/project/post create+edit became **routed pages with section tabs**; the specs and `SkillsPage` still assumed `mat-dialog-container`. They never reached the picker at all.                                                                                                                                                                                                                                                                                                                                       | **Done.** New `skill-form.page.ts`, `project-form.page.ts`, `post-form.page.ts` on the shared `SectionFormPage`; `SkillsPage.dialog` / `createButton` deleted. |
| Validation        | `validation-tag-name`, `validation-numeric-silent-strip`, `auth-password`, `auth-login`                      | **Not** stale error locators — `<mat-error>` is still correct in all four. Four different causes: tag = submit is the sticky bar's "Save changes"; numeric = Team Size is inside the gated Context section; auth-password = the message could never render (product bug, fixed); auth-login = `required` copy became field-agnostic, so an unscoped text lookup matches every empty control.                                                                                                                                                  | **Done.**                                                                                                                                                      |
| CRUD              | `category-crud`, `tag-crud`, `project-crud`, `blog-crud`, `media-crud`, `experience-crud`, `contact-message` | Untriaged. Expect the same dialog-era assumption at least in `project-crud` and `blog-crud`; `ExperiencesPage` and `TagsPage` still carry `mat-dialog-container` locators for flows that now navigate.                                                                                                                                                                                                                                                                                                                                        | **Open.**                                                                                                                                                      |
| Auth              | `auth-google` (Change Password sidebar)                                                                      | Untriaged; sidebar/menu selector drift suspected.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | **Open.**                                                                                                                                                      |
| Visual            | `visual-regression`                                                                                          | Snapshots stale after the redesign.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | **Open** — re-baseline last, only once the UI is confirmed right.                                                                                              |

## Acceptance Criteria

- [ ] Every failing console-e2e spec updated to current DOM; POMs hold all locators (no inline CSS/tag selectors).
- [ ] Icon-only trigger buttons given `aria-label` (FE testability) instead of tests relying on CSS classes.
- [ ] Tests that need data (avatar preview, cert row) seed it rather than assuming prior state.
- [ ] Each cluster verified locally (playwright-skill against real app) before commit; final proof via CI (3 e2e shards green).
- [ ] No production behavior changed except additive `aria-label`s / testability attributes, **and the two bugs
      the specs uncovered**, each recorded below and each with unit coverage: the avatar/OG endpoints returning a
      shaped 404 instead of leaking a Prisma `P2025` as a 500, and `passwordsMatchValidator` mirroring its error
      onto the confirm control so the "Passwords do not match" message can render at all. Both were premise
      failures — the specs asserted behaviour the app did not have — so leaving them would have meant weakening
      the specs to match a defect.

## Progress Log

- [2026-07-03] Investigated; root cause = broad test-drift post-refactor (not app regression), unmasked by the 429 fix.
  Confirmed live via playwright-skill. **Done + verified live:** FE `aria-label` on avatar+OG media triggers
  (`profile-identity.section.html`, `profile-seo-og.section.html`); MediaPickerPage Library/Upload → `getByRole('radio')`.
  Remaining clusters per the map above.
- [2026-07-28] Re-baselined against CI run `30329930187` (commit `b05597ee`). The 2026-07-03 work **is committed** and
  present in the tree (`profile-identity.section.html:21`, `profile-seo-og.section.html:21`, `media-picker.page.ts:17-18`);
  the earlier "not yet committed" note was stale. Failure count is essentially unchanged (~76 across 3 shards), so no
  cluster below has landed yet. Failures by shard:
  - shard 1: `blog-featured-picker`, `auth-login`, `auth-google`, `contact-message`, `category-crud`, `blog-crud`, `auth-password`
  - shard 2: `profile-certification-picker`, `profile-avatar-picker`, `profile-resume-picker`, `profile-per-section`, `media-crud`, `experience-crud`
  - shard 3: `profile-resume-picker`, `skill-icon-picker`, `project-gallery-picker`, `visual-regression`, `validation-numeric-silent-strip`, `validation-tag-name`, `tag-crud`, `skill-crud`, `project-crud`

  Every failure is `locator.click/fill timeout 30000ms` or `element(s) not found` — the drift signature, no `429`, no app error.
  Side effect worth fixing: each shard burns **44-47 min**, most of it ~76 tests waiting out a 30s timeout.

- [2026-07-28] Unrelated red badge cleared first so CI signal is readable while this task runs: the `ci` job had been failing
  on `coverageThreshold` with zero failing tests. See ADR-031. `ci` is now green; any remaining red on `master` is this task.

### What the first map got wrong

Kept as an audit trail — the map above already reflects ground truth, this records how it got there and what the
first version claimed. All five rows were checked against the templates, and the first three also live on
`localhost:4300` with playwright-skill using the seeded `test-admin@e2e.local`.

The through-line is worth naming, because it will recur: **every drift failure surfaces as the same 30s
`locator.click/fill` timeout**, so the failure message carries no information about the cause. Reading the
template is what distinguishes "the selector changed" from "the element is `[hidden]`" from "this page is not a
dialog any more" from "this element never existed". Guessing from the message picked wrong five times out of
nine.

| The first map said                                                            | Actually                                                                                                                                                                                                                                                            |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Validation locators moved to `getByRole('alert')` / `<console-error-message>` | Still `<mat-error>`. What changed is the **copy**: `DEFAULT_VALIDATION_MESSAGES.required` is now field-agnostic ("This field is required."), so an unscoped text lookup matches every empty control and trips strict mode. Scope the error to its `mat-form-field`. |
| Media-picker POM Library/Upload fix "DONE"                                    | It was already correct — `getByRole('radio')` resolves fine. The failures were a **race**, not a selector: `waitForOpen()` returned on host visibility, before the segmented control / filter bar / grid mounted.                                                   |
| Resume/cert failures are selector drift inside the section                    | The dominant cause is **section gating**. `profile.html` renders every section but gates it with `[hidden]="!showAll() && activeId() !== id"`, so an unselected section resolves as a locator and never becomes visible — a 30s click timeout, not "not found".     |
| Skill/gallery/featured triggers "drifted like avatar/OG"                      | Those pages stopped being dialogs. Skill, project and post create+edit are routed pages with section tabs; the specs never reached a picker to have a trigger problem. Applying the avatar/OG fix would have changed nothing.                                       |
| `validation-tag-name` / `-numeric` are stale error locators                   | Neither has an error-locator problem. Tag clicks a button named "Save" that does not exist (it is "Save changes" in the sticky bar); numeric fills a field inside the gated Context section. `auth-password` is not drift at all — see the product bug below.       |

**Also newly found (not in the map):**

- `nav.scrollspy-rail` no longer exists. Section nav is `console-section-tabs`: rail `nav.section-tabs__rail` >
  `button.section-tabs__item` (label in `.section-tabs__label`, glyph in `.section-tabs__icon`, active via `aria-current`),
  plus a duplicate `role="tab"` strip for sub-laptop. Both are always in the DOM — every locator must scope to the rail
  or it matches two nodes.
- A new certification row starts in **Link** mode; "Choose file" does not exist until the `console-chip-select` is set to
  **File**.
- The section save button is named **"Save section"** and is disabled while pristine.
- `asset-grid` marks loading with `aria-busy="true"` and only then renders items or the "No media found" empty state.
  Waiting on the grid host alone still reads 0 items.
- Assert with auto-retrying `expect(...)`, never a raw `isDisabled()` / `count()` read — the enable transition after a
  picker selection lands a tick later.

### Done this session

- **`login.page.ts`** — added field-scoped `emailError` / `passwordError`; `auth-login.spec.ts` validation tests assert
  shape (`/required/i`, `/valid email address/i`) instead of exact dictionary copy. Verified live, 6/6 checks.
- **`profile.page.ts`** — `RailLocator` → `SectionTabs` (real selectors, `showAll` toggle); new `activate(sectionId)`
  that selects the tab and waits for visibility; `SECTION_LABELS` map; resume helpers (`resumeRow` / `resumeChangeButton`
  / `resumeRemoveButton` / `resumeLink` / `resumeUrl`); cert helpers (`certRows`, `setCertificationMode`,
  `certificationChooseFileButton`). Verified live, 27/27 checks.
- **`media-picker.page.ts`** — `waitForOpen()` now waits for the Library toggle **and** a settled grid; added
  `waitForGridSettled()` keyed on `aria-busy`. Verified live: settles in ~811 ms and a full select → insert →
  URL-written round trip works.
- **`profile-resume-picker.spec.ts`** — rewritten (10 tests). The old file was written speculatively before the UI
  existed (`section#section-resume`, `[data-locale="en"]`, a text "Save" button, `waitForResponse(url.includes('PATCH'))`
  — none ever existed). Not yet executed by the Playwright runner.
- **e2e DB helpers** — three schema-drift type errors fixed: `Experience.slug` is indexed, not unique
  (`findUnique` → `findFirst`); `achievements` was dropped in task 363; `Profile.timezone` → `timezones`.
  `tsc -p apps/console-e2e/tsconfig.spec.json` is now clean (it was not before).

### Local verification setup

`global-setup` seeds `test-admin@e2e.local` / `TestPass1!` and its cleanup is scoped to `test-*@e2e.local` / `e2e-*`
rows only. Seed it standalone with:
`npx tsx --tsconfig apps/console-e2e/tsconfig.spec.json <script calling global-setup default export>`.
No need for the owner's real admin password.

### G1 (section gating) — done

Failures are grouped by root cause, not by file, because one POM-level fix clears several specs at once.

- **`profile-per-section`** — the page is tabbed now, not one long scroll. Tests that reason across sections at once
  use the new `gotoAllSections()` ("Show all sections"); single-section tests call `activate(id)`. The two scrollspy
  tests were re-pointed at tab semantics: selecting a rail item reveals its section, hides the previous one, and still
  mirrors the id into the URL fragment. `toBeInViewport()` was meaningless once only one section renders.
  Verified live, 16/16: showAll reveals 6/6 sections, fragment sync works both ways, deep-link lands correctly, the
  ⚠ glyph still appears on an invalid Contact, and `a[routerlink="/skills"]` still exists for the guard tests.
  Endpoints (`/api/admin/profile/identity`, `/social-links`) and toast copy ("Identity saved") are **unchanged**.
- **`profile-avatar-picker`** — three separate defects: icon-only triggers (`hasText: 'Change'` can never match a
  button whose only accessible name is `aria-label="Change avatar"`), `rail.item('SEO')` against a label that reads
  "SEO / OG", and `input[formControlName="ogImageId"]` which has never existed — `avatarId` / `ogImageId` are signals,
  so the assertion target is the preview `<img>`. Now uses `avatarTrigger` / `avatarPreview` / `avatarRemoveButton`
  and the OG equivalents from the POM. Verified live end to end: pick → PATCH 200 → preview and "Remove photo" appear.
- **`profile-certification-picker`** — _not_ G1. It targets `section#section-certifications` and `/profile#certifications`,
  neither of which ever existed. Reclassified to G4 (rewrite), same as the resume spec.

### Two findings worth separating

1. **A missing test precondition, now fixed.** `global-setup` seeds the admin _user_ but no `Profile` row, and neither
   the avatar nor the certification spec called `seedProfile()`. Every avatar test therefore died in setup, not on its
   own assertion. Both specs now seed in `beforeAll` and clean up in `afterAll`, matching `profile-per-section`.

2. **An API robustness gap — real bug, fixed on the owner's go-ahead.** With no profile row,
   `PATCH /api/admin/profile/avatar` returned **500 "Internal server error"**: `profile.repository.ts:47` runs
   `prisma.profile.update({ where: { userId } })` and the resulting P2025 was unhandled. `update-avatar.command.ts`
   threw a proper `NotFoundError` for missing _media_ but never checked that the user had a profile. `updateOgImage`
   had the identical shape. Every sibling command already carried this guard — see
   `update-profile-identity.command.ts` — so this was an oversight, not a design choice.

   Both handlers now do the standard `findByUserId` → `NotFoundError(ProfileErrorCode.NOT_FOUND)` check before
   writing. Verified against the running API: both endpoints return
   `404 {"errorCode":"PROFILE_NOT_FOUND","name":"DomainError"}` instead of a bare 500. Four unit tests added
   (404 shape + no write attempted); the existing avatar/OG tests had to start mocking `findByUserId`, which is
   itself evidence the guard was missing. `api` suite: **1041 passed**, coverage gate still green
   (81.08 / 65.21 / 70.73 / 80.09).

   This is the concrete counterexample to the task's opening claim that "all failures are test-drift". Most are. This
   one was the suite pointing at something real, buried under a red badge nobody could read.

### G2 (picker race) — the highest-leverage fix, already landed

All six picker specs drive the same `MediaPickerPage`, and between them they call `waitForOpen()` **29 times**:

| Spec                           | `waitForOpen()` calls |
| ------------------------------ | --------------------- |
| `profile-avatar-picker`        | 8                     |
| `skill-icon-picker`            | 6                     |
| `project-gallery-picker`       | 5                     |
| `blog-featured-picker`         | 4                     |
| `profile-certification-picker` | 3                     |
| `profile-resume-picker`        | 3                     |

Every one of those was returning as soon as the dialog host became visible, before the segmented control, filter bar
and asset grid had mounted — so the very next line queried an empty subtree. The single POM fix (host visible →
Library toggle visible → `.asset-grid:not([aria-busy="true"])`) covers all 29 without touching a spec. Whether that
is _sufficient_ for `skill-icon-picker`, `project-gallery-picker` and `blog-featured-picker` is **not** — see below.

### The dialog-era assumption (measured against the templates)

The three remaining picker specs never reach the picker at all, so the `waitForOpen()` fix cannot save them. Every
one was written against a `mat-dialog-container` shape that the console no longer has: skills, projects and blog
posts are all edited on routed full pages behind a `console-sticky-save-bar`. `projects.ts` still carries the
method name `openCreateDialog()`, but its body is `router.navigate(['/projects','new'])`.

| Spec assumption                               | Actual                                                                                                                                       |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `mat-dialog-container` holds the form         | `/skills/new`, `/projects/new`, `/admin/blog/new` — routed pages                                                                             |
| `getByRole('button', {name:'Create Skill'})`  | `<a mat-flat-button routerLink="./new">`; `MatButton`'s host binding sets only `classAttribute`, no `role`, so the element stays `role=link` |
| `dialog.getByRole('button', {name:'Create'})` | one "Save changes" button in the sticky save bar                                                                                             |
| `input[formControlName="iconId"]`             | signal-backed; only a preview `<img>` and a "Pick Icon"/"Change Icon" trigger                                                                |
| `button` matching `/gallery/i`                | the gallery trigger reads "Add Images"; `/gallery/i` matches only the `<p class="field-label">`                                              |
| `page.goto('/blog')`                          | route is `/admin/blog`; `/blog` hits the `**` redirect to the dashboard                                                                      |
| `input[placeholder*="title" i]` (blog)        | the title input has no placeholder, only a `<mat-label>`                                                                                     |
| `/api/blog-posts`                             | `/api/blog` (public) and `/api/admin/blog` (admin)                                                                                           |
| landing assertions via `page.goto('/')`       | `baseURL` is `localhost:4300` — that is the console dashboard, not the landing app                                                           |

Two of those tests were also passing _vacuously_: `if (data.data && data.data[0])` around a request to an endpoint
that 404s asserts nothing. That is how the drift stayed invisible.

Copy coupling (same class as the `auth-login` fix) showed up here too: the specs pinned `'Name is required'`,
`'Name must be 100 characters or less'`, `'Skill created successfully'` and `'Skill updated successfully'`, while
`validation-messages.ts` says `'This field is required.'` / `'Must be 100 characters or less.'` and the form's
toasts say `'Skill created'` / `'Skill updated'`.

### G4 (routed-form rewrite) — done

Shared POM extracted first, because five pages share the shell:

- `pages/section-form.page.ts` — new. `SectionCard`, `SectionTabs` and a `SectionFormPage<TSectionId>` base
  carrying `activate()`, `showAllSections()` and the sticky-save-bar locators. `profile.page.ts` now imports the
  first two instead of declaring its own copies.
- `pages/skill-form.page.ts`, `pages/project-form.page.ts`, `pages/post-form.page.ts` — new, one per editor.
  The blog editor deliberately does _not_ extend `SectionFormPage`: it has no `console-section-tabs`, it is a
  two-column layout with every card mounted.
- `pages/skills.page.ts` — rewritten. The `dialog` getter and `createButton` are gone; `openCreateForm()` /
  `openEditForm()` navigate and hand back a `SkillFormPage`.
- Specs rewritten: `skill-icon-picker` (7 tests), `project-gallery-picker` (7), `blog-featured-picker` (8),
  and `skill-crud` — which was not in G4 but is a caller of the same POM, so the change forced it.

Section gating differs per page and is worth remembering: `skill.form.ts` ships `showAll = signal(true)` (all
sections on screen), while `project.form.ts` and `profile.ts` ship `false`. `activate()` short-circuits when the
section is already visible, so callers do not have to branch.

Deliberate scope cuts, both stated in the spec headers:

- `project-gallery-picker` stops at the picker → form hand-off. A project needs title, one-liner, start date,
  motivation, description and role in both languages before the API accepts it; a `fillRequired` helper for that
  belongs with `project-crud`.
- `blog-featured-picker` likewise stops before save, because `content` carries `richTextRequiredValidator` and the
  editor is a document-engine instance mounted imperatively. It does cover the PST-011 cover-required gate.

### G4 — `profile-certification-picker` (last one, done)

Same relocation as Resume: certifications are a subsection of Social Links. There is no
`section#section-certifications` and no `/profile#certifications` fragment, rows are `.cert-row` rather than
`[role="group"]`, and the mode toggle is a `console-chip-select`.

That chip component overrides each `mat-chip-option` with `[attr.role]="'radio'"` inside a `role="radiogroup"`.
Material's own inner `<button role="option">` still exists underneath, so `getByRole('option')` happens to resolve —
but the radio is where `(click)="select(...)"` and `aria-checked` live, so the POM targets that and asserts mode via
`aria-checked` rather than by guessing which widget rendered.

> **Superseded.** The second half of that paragraph is wrong and the sixth-bug section below explains why: the
> `[attr.role]="'radio'"` and `[attr.aria-checked]` were dead attributes on a host Material marks
> `role="presentation"`, so there was never a radio to target. `getByRole('option')` did not "happen to" resolve; it
> was the only thing that could. The POM asserts `aria-selected` on the option, which is what it does today.
> `chip-select` has since been rebuilt on `mat-chip-listbox` and the contradictory doc line corrected (ADR-033).

The behaviour worth pinning: **`mode` is never persisted**. `save()` strips it (`({ mode: _mode, ...c })`) and the
section re-derives it on load with `inferCertMode(url)` — `res.cloudinary.com` → File, anything else → Link. Three
tests cover the round trip (Link, File, mixed).

The old spec also asserted "all fields are optional" against a _pristine_ form. Name, issuer and year are all
`Validators.required`, and `isSaveDisabled()` is `invalid || !dirty || saving` — so that button was disabled for a
reason unrelated to what the test claimed. Replaced with two tests that fill a valid row first, then clear one field
and watch Save flip.

`seedProfile` runs in `beforeEach`, not `beforeAll`: it resets `certifications: []`, and several tests here save,
so without a per-test reset every `certRows().first()` would pick up the previous test's row.

### A second, wider bug: PDF and JPEG fixtures were never uploadable

`MediaPage.createTestFile` always writes PNG bytes whatever name you give it, while Playwright derives the
multipart MIME type from the **extension**. `FileSecurityScanner.validate` compares magic bytes against that
declared type and rejects a mismatch as a security threat, so:

| Call                                | Declared          | Detected    | Result                  |
| ----------------------------------- | ----------------- | ----------- | ----------------------- |
| `createTestFile('cert-test.pdf')`   | `application/pdf` | `image/png` | 400, upload never lands |
| `createTestFile('resume-test.pdf')` | `application/pdf` | `image/png` | 400                     |
| `createTestFile('avatar-test.jpg')` | `image/jpeg`      | `image/png` | 400                     |

Fixed by adding `TEST_PDF_BASE64` (a real 539-byte single-page PDF) plus `MediaPage.createTestPdf`, and renaming
the avatar fixture to `.png`. `createTestFile`'s doc comment now says what it actually produces.

Related: the resume spec's "skip upload if the library already has media" guard queried `/api/media/list` with no
filter, but the resume and cert pickers both open with `mimeFilter: 'application/pdf'` — a library of images
satisfied the guard and still gave an empty grid. Both now query `mimeTypePrefix=application/pdf`.

### Verification note

`npx tsc --noEmit -p apps/console-e2e/tsconfig.json` type-checks **nothing** — that config is a solution-style
stub with `"files": []`, `"include": []` and a single project reference. Use
`npx tsc --noEmit -p apps/console-e2e/tsconfig.spec.json`.

Known hazard, not addressed here: `profile-avatar-picker`, `profile-resume-picker`,
`profile-certification-picker` and `profile-per-section` all mutate the same singleton profile row. CI runs
`workers: 1` so they serialise there, but locally `fullyParallel: true` with default workers can interleave them.

### G3 (validation specs) — done, and the drift map was wrong about all three

The map filed `validation-tag-name`, `validation-numeric-silent-strip` and `auth-password` under "client-side
validation error locators stale → update to `getByRole('alert')`". None of the three had a stale error locator.
`page.locator('mat-error')` was correct in every case; what was wrong sat upstream of the assertion.

| Spec                              | Actual cause                                                                                                                                                                                                                                                 |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `validation-tag-name`             | Submit control is the sticky bar's **"Save changes"**; the spec clicked `getByRole('button', { name: /^save$/i })`. The form's own `<button type="submit">` is `class="hidden" aria-hidden="true"` — unreachable by role on purpose.                         |
| `validation-numeric-silent-strip` | Team Size lives in the experience form's **Context** section, gated by `[hidden]="!showAll() && activeId() !== 'section-context'"`. The spec never clicked a tab, so `fill()` waited out 30s on a permanently invisible input. Same G1 gating as `/profile`. |
| `auth-password` (mismatch)        | The message was never rendered at all — see below. A product gap, not test drift.                                                                                                                                                                            |

New POMs: `tag-form.page.ts` (routed `/tags/new`, no section tabs) and `experience-form.page.ts` (extends
`SectionFormPage`; `section-settings` is labelled **"Admin"**, not "Settings"). `ExperienceFormPage.errorFor()`
scopes `<mat-error>` to the control's own `mat-form-field`, since Material keeps an error in the DOM only while
that field is in an error state and an unscoped locator picks up whichever field is currently complaining.

Worth recording: `openCreateDialog()` on the experience list is a misnomer — it calls
`router.navigate(['/experiences', 'new'])`. There is no dialog in that flow.

### A third bug: the "Passwords do not match" message could never appear

`passwordsMatchValidator` returned `{ passwordsMismatch: true }` on the **group** only. Three templates —
`reset-password.html`, `set-password.html`, `change-password.html` — map that key to a message via
`formError: { passwordsMismatch: … } : form`, and all three were dead code.

`<mat-form-field>` renders its projected `<mat-error>` only when `_getSubscriptMessageType()` returns `'error'`,
which requires `_control.errorState`. `errorState` comes from an `ErrorStateMatcher` that is handed the
**control**, never the group (`RewardEarlyErrorStateMatcher` is no different: `control.invalid && (touched ||
submitted)`). With the error only on the group, the confirm control stays valid, so the field never enters an
error state. The user saw a submit button that did nothing and no explanation anywhere.

Fix: the validator now also mirrors `passwordsMismatch` onto the confirm control, preserving that control's own
errors and clearing the mirror when the values agree. `setErrors` recalculates status and walks up the tree but
does not re-run validators, so calling it from inside a group validator cannot recurse; `emitEvent: false` keeps
it out of `statusChanges`, and Material still sees it because `MatInput` refreshes `errorState` in `ngDoCheck`.
Five unit tests added.

This exceeded the original acceptance criterion "no production behavior changed except additive `aria-label`s".
Raised with the owner rather than assumed, and confirmed on 2026-07-28 — the criterion now names this and the
avatar/OG 404 as its two deliberate exceptions.

The fix reaches all three forms at once, because all three go through the one validator. Checked that no other
group-level error is silent the same way: `formError: … : form` appears only in these three templates, and the
experience form's two group errors (`teamSizeRange`, `dateRange`) are rendered explicitly with
`@if (form.errors?.[…])`, so they were never affected.

### G6 (CRUD cluster + `auth-google`) — done

Every remaining spec in the cluster was rewritten, plus `auth-google`. The dialog-era assumption held for
`tag`, `category`, `experience`, `project` and `blog`: **create and edit are routed pages everywhere**, and the
only `mat-dialog-container` left in the console is the delete/restore confirmation. `media` and
`contact-message` failed for unrelated reasons.

| Spec              | What was actually wrong                                                                                                                                                                                                                                                                                                                                                      |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tag-crud`        | Whole file was dialog-driven. Also: success toasts are "Tag created" / "Tag updated" without "successfully" (only the list page's delete toast has it), and a duplicate name is an **interceptor toast**, not an in-dialog error — `ConflictError` carries no `fieldErrors` for `ServerErrorDirective` to bind.                                                              |
| `category-crud`   | Same, plus the form has two `console-section-card`s but **no** section tabs, so nothing needs activating.                                                                                                                                                                                                                                                                    |
| `experience-crud` | Heaviest. `position` became a nested group rendered by `console-translatable-group` (`formControlName="en"`/`"vi"`, not `position_en`); `description`/`responsibilities`/`highlights` became `richTextGroup`s on the document-engine editor; `achievements` was dropped in task 363; the list has no "Deleted" badge — soft delete shows as `opacity-50` + a Restore button. |
| `project-crud`    | `<h1>` is "Project Management", not "Projects". The All/Published/Draft/Trash **tabs no longer exist** — a Status `console-filter-select` plus a "Show deleted" chip replaced them, and a deleted project is _absent_ from the table until that chip is on, not merely dim. Row actions are `aria-label`ed icon buttons, not an "Actions" menu.                              |
| `blog-crud`       | Same tab/menu story. Status renders the label from `BLOG_POST_STATUS_LABELS` — **"Draft"**, not the raw `DRAFT` the spec matched.                                                                                                                                                                                                                                            |
| `media-crud`      | Not dialogs at all: the page was rebuilt from shared components. Metadata editing is a **drawer** (`console-media-drawer`) whose Save is disabled until dirty, and Delete moved into it; `console-asset-grid` renders _both_ view modes, so list view has no `<table>` and there is no `mat-paginator`; the dropzone's `aria-label` is a full sentence.                      |
| `contact-message` | Detail view's `<h1>` is the **sender's name**, not "Message Detail" — there is no constant string to wait on. Mark Unread / Archive / Delete moved into a `mat-menu` behind "More actions". The meta rows are Email/Subject/Purpose/Locale; the old "From" row is now the heading.                                                                                           |
| `auth-google`     | "Change Password" left the sidebar entirely. There is no "Settings" group; the link lives in the footer user menu, rendered `@if (hasPassword())` — which is what makes it a real signal for a Google-only account. "Profile" is an unrelated, always-present sidebar link.                                                                                                  |

**Verb traps worth remembering:** `Experience.update` and `Project.update` are **PUT**, not PATCH — PATCH on
both resources is _restore_ (and reorder, for projects), so a `waitForResponse` on PATCH matches the wrong call.

New POMs: `tag-form`, `category-form`, `posts`, `console-shell`. Rewritten: `tags`, `categories`,
`experiences`, `projects`, `messages`, `media`. `ProjectDialog` was deleted outright.

Refactor along the way: `StickyFormPage` extracted in `section-form.page.ts` as the base for _every_ routed
console form (save bar, `saveAndWait`, `errorFor`), with `SectionFormPage` now extending it for the pages that
additionally have section tabs. That is what let the tag/category forms share the section-form work.

Two tests were strengthened rather than merely re-selected, because they could not fail as written: the
contact-message unread badge assertion accepted a missing badge, and the old "all fields optional" checks
asserted a disabled Save on a pristine form.

### The local runner was never actually version-mismatched

The whole task ran without a local Playwright runner, blamed on a browser "version mismatch". That diagnosis was
wrong, which is why one debug pass got nowhere: it went looking for a correct build to point at, and there was
none on the machine to find.

| Fact                                            | Value                                                                                              |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `@playwright/test` in the repo                  | `1.58.1`, which pins **chromium revision 1208**                                                    |
| `~/Library/Caches/ms-playwright/chromium-1208/` | present but **428 KB**, and **missing the `INSTALLATION_COMPLETE` marker** (a full one is ~341 MB) |
| `chromium_headless_shell-1208/`                 | **absent entirely** — and this is the binary headless mode actually launches                       |
| Complete downloads on disk                      | `chromium-1194`, `chromium-1223`; Playwright 1.58 accepts neither                                  |

So it was an **interrupted download**, not a mismatch. The directory surviving is what makes the error read like a
version problem. `npx playwright install chromium` fixes it, but needs the network.

**Escape hatch that needs no download at all.** `PW_CHANNEL` was added to `playwright.config.ts`: set it and
Playwright drives an already-installed system browser instead of the bundled Chromium.

```
PW_CHANNEL=msedge npx playwright test --config=apps/console-e2e/playwright.config.ts --grep-invert @visual
```

Verified working on this machine (Edge `150.0.4078.99`). `channel: 'chrome'` is not an option here — Google Chrome
is not installed, only Edge. **Functional specs only:** a different browser build rasterises differently, so it
must never be used for `@visual`.

Two facts that make local runs safe against real content: `global-setup`/`global-teardown` only delete rows
prefixed `e2e-` or owned by `test-*@e2e.local`, and `Profile.userId` is `@unique`, so the profile specs write the
test admin's own profile row rather than a site-wide singleton.

### A fourth bug: task 384's throttle fix never reached the local API server

The first local run of the suite went red across every auth-dependent spec, all failing in 100-500 ms — far too
fast for a locator timeout, and the failure screenshot said why: **"Too many requests. Please wait a moment and
try again."** The `429` this whole task was named after was still live locally.

`nx serve api` runs two commands: `webpack-cli build --node-env=development --watch`, then
`node ../../dist/apps/api/main.js`. The flag configures the **build** process; the node runtime that actually
evaluates `app.module.ts` inherited no `NODE_ENV` at all. Combined with the throttler's deliberately fail-safe
gate —

```ts
const throttleEnabled = process.env['NODE_ENV'] !== 'test' && process.env['NODE_ENV'] !== 'development';
```

— an unset `NODE_ENV` means rate limiting stays **on**. Every `loginViaApi` call in the fixtures then races a
60-requests-per-minute budget that a 264-test suite exhausts almost immediately. CI escaped it only because the
e2e job declares `NODE_ENV: development` in its own `env` block, so nobody noticed the serve target never did.

Fixed by adding `env: { NODE_ENV: "development" }` to the `serve` target's options in `apps/api/project.json`.
`nx:run-commands` documents `env` as taking priority over `.env` files, so it holds regardless of what the local
`.env` says, and unlike a `NODE_ENV=… ` shell prefix it also works on Windows. The gate itself was left alone:
failing safe towards "throttle on" is the right default for a security control, and the correct fix is for each
non-prod caller to opt out explicitly.

**Takes effect only after the API server is restarted** — a running server keeps its old environment.

### G7 (`visual-regression`) — spec fixed, Linux baselines still owed by CI

The blocker for G7 turned out not to be the browser at all. `toHaveScreenshot` names its baseline
`<name>-<project>-<platform>.png`, and the platform suffix is load-bearing: font rasterisation and antialiasing
differ per OS, so a baseline is only valid on the platform that produced it.

|                               |                                                                         |
| ----------------------------- | ----------------------------------------------------------------------- |
| Baselines that were committed | `dashboard-chromium-**win32**.png`, `categories-chromium-**win32**.png` |
| What `ubuntu-latest` CI reads | `*-chromium-**linux**.png`                                              |
| What a macOS dev produces     | `*-chromium-**darwin**.png`                                             |

The committed pair was generated on Windows, so **CI has never once read them**. The consequence that matters:
**no CI-valid baseline can be authored from a Mac or a Windows box**, whatever you do about the browser. The bytes
have to come off a Linux runner.

What was done:

- **Deleted both `win32` baselines.** Unreadable by CI, unreadable by any dev on this machine, and stale against
  the rewritten spec anyway. They are in git history if ever needed.
- **Rewrote the spec**, which had four defects beyond selector drift:
  - it typed a **real admin password committed in the file** into the login form — replaced by the `adminPage`
    fixture, like every other spec, and the credential is gone;
  - it called `setViewportSize` **after** navigating, so the first render happened at the default 1280x720 and the
    shot caught a re-laid-out page — viewport now comes from `test.use`, which applies before the first `goto`;
  - it slept 1500 ms total with no font-loading or paint guarantee — replaced by `waitForStablePaint`
    (`helpers/visual.ts`): `document.fonts.ready` plus two chained `requestAnimationFrame`s, so webfont swap and
    uncommitted layout are both ruled out instead of slept through;
  - it photographed **live database counts and table rows**. Every other spec creates and deletes records, so
    those regions move between runs and the comparison could never settle. The dashboard's four stat values are
    now masked (fixed-size cards, so layout stays under test); the categories page is filtered to a no-match
    search first, because masking the table body would not help — row count changes the body's _height_, which
    moves the paginator and everything below it, outside any mask.
- **Tagged the block `@visual`** and excluded it from the gating run (`--grep-invert @visual`), verified by
  `--list`: `--grep @visual` → exactly 2 tests, `--grep-invert @visual` → 264 tests in 30 files, none of them
  visual.
- **Added an opt-in baseline generator to `ci.yml`**: a `workflow_dispatch` input `update_visual_baselines` runs
  the visual tests once, unsharded, on shard 1 with `--update-snapshots` and uploads the PNGs as the
  `visual-baselines-linux` artifact.

**Hand-off, one step, deliberately left to a human:** run the CI workflow manually with
`update_visual_baselines` checked, download `visual-baselines-linux`, commit the two PNGs into
`apps/console-e2e/src/visual-regression.spec.ts-snapshots/`, then delete `--grep-invert @visual` from the
"Run E2E tests" step so the visual pair starts gating. Until that commit lands, the visual tests assert nothing —
which is stated here rather than hidden behind a green tick.

### G8 — the first real runner pass, and what it found

With the throttle lifted and `PW_CHANNEL=msedge` working, the suite ran end to end for the first time in this
task: **174 passed, 30 failed, 57 not run** (serial describes abort after their first failure), 14.8 min at one
worker. Not one of the 30 was environmental. They reduce to a small number of root causes, most of them shared.

**Final local state after the fixes below: 256 passed, 5 skipped, 0 failed, exit 0 (8.8 min, one worker).** The
5 skipped are 3 pre-existing `test.skip`s in `media-picker` plus the 2 `test.fixme`s for the unsaved-changes guard.
Supporting unit suites all green with the production fixes in place: api 1048, console-shared-ui 146,
feature-profile 19, console/shared/util 85, feature-home 5 (new).

| Run                        | Result                    |
| -------------------------- | ------------------------- |
| CI, first green login      | 72 failed / 94 passed     |
| run2 (local, throttle off) | 30 failed / 174 passed    |
| run8 (local, final)        | **0 failed / 256 passed** |

Two things this pass made unmissable. First, **`mode: 'serial'` hides bugs behind bugs**: three
`media-crud` locators had never matched anything, and nobody could tell, because a failure in test 2 meant tests
3-16 never ran. Second, **an assertion that cannot fail is worse than a missing one** — several tests here were
green-by-construction or red-by-construction regardless of the app.

| Root cause                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Blast radius                                                        |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `MediaPickerPage.insertButton` matched `/insert\|select/i` dialog-wide. Accessible-name matching is substring-and-case-insensitive, and the recently-used strip renders a `button[aria-label="Select <file>"]` per item — so the locator resolved to two elements the moment a recent item existed. `ctaLabel()` never returns "Select" either. Now scoped to `.picker__footer-right` and matched on `/^Insert/`.                                                    | every picker spec: avatar, OG, cert, resume, gallery, blog-featured |
| Row action locators matched `{ name: 'Edit' }` non-exactly, and the row contains the record's own name — so `e2e-cat-edit`, `e2e-skill-edit`, `e2e-edit-tag` matched "Edit" themselves. `exact: true` added to Edit/Delete/Restore across all six list POMs.                                                                                                                                                                                                         | `category-crud`, `skill-crud`, `tag-crud`                           |
| Two different `save()` methods, one string argument each: `SectionCard.save(endpoint)` vs `*FormPage.save(method)`. `identity.save('PATCH')` type-checked and then hung the full 30s, because `url().includes('PATCH')` is never true. Renamed to `saveSection(endpoint)`.                                                                                                                                                                                           | avatar and resume timeouts                                          |
| `saveSection` resolved on **any** matching response, a rejected 400 included, and none of its eight callers checked the status. It now throws with the response body. This is what turned "the resume did not persist" into the actual `404 PROFILE_NOT_FOUND` in one run.                                                                                                                                                                                           | latent across every section save                                    |
| Avatar and OG image are not form fields — they PATCH on pick ("Avatar saves on upload" is in the section subtitle). Four tests clicked "Save section" afterwards and timed out on a button that is `disabled` precisely because the form never went dirty. `ProfilePage.pickAvatar()` / `pickOgImage()` now encode the real contract.                                                                                                                                | `profile-avatar-picker`                                             |
| `getItemByFilename` used `filter({ has: getByLabel(filename) })`, but `.asset-grid__item` carries the `aria-label` **itself** — `has` needs a descendant. And `getByLabel` reads `aria-label`/`<label>`, never an `<img alt>`. There is also no `.asset-grid__row`: list mode is the same item with an `--list` modifier, so `listRows` matched nothing either.                                                                                                      | `media-crud` (masked by serial abort)                               |
| `profile-resume-picker` was the only profile spec that seeded no profile row. It inherited whatever a sibling left behind, and `profile-avatar-picker` deletes the profile in its `afterAll` — alphabetically just before it. It now seeds its own.                                                                                                                                                                                                                  | `profile-resume-picker`                                             |
| `blog-crud` posted `{ title, content, language }`. `content` was dropped in task 363: `CreateBlogPostSchema` requires `contentJson` (an `EditorDocument`) plus a `featuredImageId` uuid with a real FK. The spec now uploads a cover through the API and sends the document shape.                                                                                                                                                                                   | `blog-crud` (serial, so it took the file down)                      |
| Assertion-mechanics traps, each looking obviously correct: `toHaveText` normalizes whitespace only for a **string** match, so `/Insert 1 item$/` could not match `" Insert 1 item "`; `toHaveValue` was called on an `<img>`; `src` was matched against a media id, but `UpdateAvatarHandler` returns `media.url`, which does not embed the id; a row was matched on `/e2e-skill-parent TECHNICAL/` when the cell renders `category \| enumLabel`, i.e. "Technical". | scattered                                                           |
| `ConsoleShell.navLink(label)` used `exact: true`, which can never match: every entry leads with a `<mat-icon>` whose ligature text joins the accessible name ("perm_mediaMedia", "person Profile"), and Messages appends its unread badge. `navLinkByRoute` is now the documented primitive.                                                                                                                                                                         | `auth-google`, `media-crud`                                         |

### A fifth bug, and it is an authorization hole: class-level `@Roles` was never enforced

Found by pulling a thread that first looked like something else. `auth-google` was landing on a full-page "403
Access Denied" — visible only in the failure's ARIA snapshot, never in an assertion. The first reading was "a
non-admin console user hits a 403 wall", since `/` is behind `authGuard` alone while `HomeComponent` immediately
calls the `@Roles(['ADMIN'])` endpoint `/api/dashboard/stats`. That reading was wrong, and checking it instead of
believing it is what surfaced the real bug.

Checked with a real, non-admin token against the running API:

| Endpoint                   | Where `@Roles(['ADMIN'])` sits | Response to a `USER` token |
| -------------------------- | ------------------------------ | -------------------------- |
| `GET /api/users`           | on the **method**              | `403` — enforced           |
| `GET /api/dashboard/stats` | on the **class**               | **`200`**                  |
| `GET /api/admin/blog`      | on the **class**               | **`200`**                  |

`RoleGuard` resolved its metadata with `this.reflector.get(Roles, context.getHandler())`, and `getHandler()` sees
method-level metadata only. A class-level decorator therefore yielded `undefined`, fell through the guard's
"nothing declared, allow" branch, and enforced nothing — while reading identically to the decorators that do work.
`DashboardController` and `BlogPostAdminController` both declare at class level, so **the entire `admin/blog` API**
— list, create, update, delete, bulk, restore, markdown convert — **plus dashboard stats were open to any
authenticated non-admin user.**

Fixed with the standard Nest idiom, `getAllAndOverride(Roles, [context.getHandler(), context.getClass()])`, so
handler-level still overrides class-level. `RoleGuard` had no spec at all; there is now one covering handler-level,
class-level, both-declared, and unauthenticated. The two class-level "denies" cases fail against the old guard and
pass against the new one. Full API suite: 1048 passed, no regressions.

The `auth-google` failure itself had a separate, mundane cause, and it took two wrong guesses before a trace
settled it. `mock-google-token` is not a real JWT, so every call the spec does not stub is rejected — and a single
rejection is enough to replace the page. Logging every ≥400 response gave the chain in one shot:

```
401 GET  /api/contact-messages/unread-count   ← sidebar badge, fake token
403 POST /api/auth/refresh                    ← refresh interceptor reacting to that 401
```

`error-handler.provider.ts` treats 403 as blocking: it closes every dialog and navigates to `/error/403`. So the
spec was inspecting an "Access Denied" page. `mockGoogleLogin` now stubs the badge (the trigger), refresh (so a
later 401 cannot re-arm it) and dashboard stats; `MOCK_GOOGLE_USER` carries `role: 'ADMIN'` so the nav renders at
all, since every sidebar group sits behind `@if (isAdmin())`.

Worth keeping as method, because guessing cost three passes here: the failure message named a locator, the first
guess blamed roles, the second blamed the stats endpoint, and only **logging the responses** named the badge. When
a page is replaced rather than merely mis-rendered, read the network, not the locator.

### A sixth bug: icon-only chips had no accessible name (WCAG 4.1.2)

The `profile-certification-picker` cluster and the `/media` view toggle were the same question, and the answer was
a real accessibility defect rather than a selector to update.

`chip-select.html` wrote `[attr.aria-label]="iconOnly() ? opt.label : null"`. That sets the attribute on the
`<mat-chip-option>` **host** — but the node the accessibility tree exposes is Material's inner
`<button role="option">`, and `MatChip` forwards a label onto that button from its `@Input('aria-label')`. An
attribute binding never reaches the input, so an icon-only chip ended up with no name at all. From the ARIA
snapshot of `/media` before the fix:

```
- radiogroup:
  - option [selected]:
    - img: grid_view      ← the icon ligature, not a label
  - option:
    - img: view_list
```

Two unnamed options: a screen-reader user hears nothing useful. Fixed by binding the input, `[aria-label]="…"`.
`ChipSelect` had no spec; there is now one covering both the icon-only and the labelled case, plus selection state.

Two consequences for the specs, both now documented in the POMs: chip-select options resolve as **`option`**, not
`radio`, and their state is **`aria-selected`**, not `aria-checked`. The earlier note in this file claiming
otherwise was written from reading `chip-select.html` rather than from the rendered tree, and was wrong.

**The container role was a second, separate defect — fixed 2026-07-29 on the user's decision to do it properly.**
`chip-select` wrapped its options in a hand-written `<div role="radiogroup">` and wrote `[attr.role]="'radio'"` plus
`[attr.aria-checked]` onto each chip host, while the exposed children were `option`s. A `radiogroup` containing
`option`s is invalid ARIA and announces as nothing coherent.

Reading Material 21.1.3's source settled which way to fix it. `role="option"` is a **string literal in
`MatChipOption`'s template**, on the inner button, so it cannot be overridden from outside — the hand-written radio
semantics were never overrides, they were dead attributes on an element the accessibility tree skips. Reaching
`radiogroup` honestly would mean dropping the Material primitive and hand-rolling keyboard behaviour, which the
family doc forbids. So the container became `mat-chip-listbox`, which owns `role="listbox"`,
`aria-multiselectable="false"` and `aria-disabled`, and brings a `FocusKeyManager` with roving tabindex, arrow keys
and Home/End that the bare `<div>` never had.

Two things the source read turned up that a selector-level fix would have missed:

- **`hideSingleSelectionIndicator` is not an input on `mat-chip-option`.** The copy sitting there was inert, so every
  selected chip had been rendering a checkmark beside its icon — the opposite of the author's evident intent. Moved
  to the listbox, where it is a real input. Verified by screenshot on `/media` and the project status field: fill
  moves cleanly, no checkmark, no width jump between states.
- **Clicking the selected chip was already breaking the UI.** `_handlePrimaryActionInteraction` calls
  `toggleSelected(true)`, so Material deselects on a second click. The old `select()` guard returned early on an
  unchanged value, which kept the _form_ right and left the _chip_ deselected — `aria-selected="false"` on a control
  whose value was still `'grid'`. The rewrite refuses the deselection by assigning `listbox.value`, which re-runs
  `_setSelectionByValue` with `isUserInput: false`; the listbox propagates only user input, so it cannot loop. This
  is also exactly what `chips/chip-select.md` already required ("clicking the active chip is a no-op") and what the
  family's Non-goals section calls out ("Chips must not silently emit `null` from a click").

Tests were written first and 6 of them went red against the old component: container role, `aria-multiselectable`,
click-again-keeps-selection, arrow-key focus movement, single tab stop, and disabled propagation. `console-shared-ui`
is 155/155 after. Two jsdom details worth keeping: `MatChipSet._handleKeydown` forwards to the key manager only when
the event `_originatesFromChip`, so an arrow press must be dispatched on the focused option and bubble; and the key
manager reads `keyCode`, which jsdom leaves at 0 regardless of `key`, so the test defines it explicitly.

**The component doc was itself contradictory, and that is where the bug came from.**
`chips/chip-select.md` said "the group has `role="radiogroup"`" under A11y while its Implementation guide said to
apply "on top of `mat-chip-listbox`". Those cannot both hold. The A11y and Keyboard lines are corrected, and
`chips/_overview.md` gains a family-wide rule — **"The primitive owns the role. Never write ARIA that contradicts
it."** — because all three members shipped the same class of defect. That rule is portable and worth promoting to
the global `patterns/chip-toggles` kernel via `/design document`.

**Both siblings are still broken, and were not touched.** Found while reading the family, outside what was asked:

| Component           | What it renders                                                         | Why it is wrong                                                                                                                                                                        |
| ------------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `chip-boolean`      | a lone `mat-chip-option` with `[attr.aria-pressed]`                     | The inner button is `role="option"` with **no `listbox` owner** — an orphan `option`. `aria-pressed` is dead, and its own doc asks for `role="button"` + `aria-pressed`. 5 call sites. |
| `chip-toggle-group` | `<div role="group">` over `mat-chip-option`s with `[attr.aria-pressed]` | Same invalid pairing as the `radiogroup` case, same dead attribute. Its doc also asks for toggle buttons. 1 call site.                                                                 |

They do not have one shared fix: `chip-toggle-group` maps cleanly onto `mat-chip-listbox [multiple]` (giving
`aria-selected`, not the `aria-pressed` its doc asks for — so the doc needs a decision too), while `chip-boolean` is
semantically a toggle button and may not want a chip listbox at all. Needs the user's call per component.

### A seventh: `/profile` never warns about unsaved changes

`profile.routes.ts` declares `canDeactivate: [unsavedChangesGuard]`, but `unsavedChangesGuard` returns early unless
`component.hasUnsavedChanges()` is true — and `ProfileComponent.hasUnsavedChanges()` is a hard-coded
`signal(false)`, with a comment saying so: _"sections own their own dirty state, so the parent can't easily compute
a global dirty signal without leaking each section's form internals … each section can expose a `dirty` signal we
aggregate here later."_

So the dialog can never open, and **navigating away from a dirty section silently discards the edit**. Confirmed:
the failing run ended on Skill Management with no dialog ever shown.

The two guard specs were first marked `test.fixme` rather than deleted or rewritten. Rewriting them to assert the
current behaviour would have locked in "unsaved edits are lost without warning" as a contract; deleting them would
have erased the gap. `fixme` reports as skipped, so the suite stayed honest and the gap stayed actionable.

**Fixed 2026-07-29, on the user's decision to keep the warning.** Each of the eight sections already held a
`dirty = signal(false)` fed by its `form.events` subscription — seven were `private`, one was already public for
the sticky save bar. All eight are now public, and `Profile.isDirty` ors them together; `hasUnsavedChanges()`
returns that signal, so the guard sees later edits rather than a snapshot. The aggregation may read every
`viewChild.required` unconditionally because the tab rail hides inactive sections with `[hidden]` instead of
destroying them — the same property that already makes the rail's per-section status icons work.

Two deliberate choices:

- **No `onSaveAndContinue`.** The dialog only offers Stay and Discard. With eight independent endpoints,
  "save everything" would have to define what happens when one section is invalid while another has already
  committed, and that is a product question, not a guard detail.
- **`beforeunload` added too**, via the same `@HostListener('window:beforeunload')` idiom the other eight console
  forms use. The router guard never sees a reload or a tab close, so without it the warning had a hole exactly
  where users lose the most work.

Both specs are un-fixme'd, and a third was added: **a clean page must navigate with no dialog at all.** Without it,
the two positive specs would still pass against a guard that prompts unconditionally — an assertion that cannot
fail is worse than a missing one, which is the same lesson G8 produced. The parent's own spec grew a
`— unsaved changes` block that renders the real template (a stub template has no section refs to aggregate) and
covers: clean at load, dirty from any one section, the signal staying live after it is handed to the guard,
clean again after `markAsPristine`, and `beforeunload` blocking only while dirty. That block needs `provideRouter`
for `console-section-tabs` and a stub under `RTE_EDITOR`, since Tiptap cannot mount in jsdom.

Verified: `profile-per-section` 12/12 with the real runner, `feature-profile` 24/24.

### The dashboard's admin gate — a fix that only became necessary once the guard worked

Fixing `RoleGuard` turned four previously-green auth specs red, and that was the correct signal. A non-admin signs
in, lands on `/`, and `HomeComponent` calls `/api/dashboard/stats` — now genuinely `403` — which
`error-handler.provider.ts` treats as blocking, closing all dialogs and routing to `/error/403`. Before the guard
fix that call returned `200` to everyone, so nobody saw the wall: **a broken guard was hiding a broken page.**

Four pre-existing auth specs sign in as `TEST_USERS.standard` and expect the dashboard, so the product intent is
that a non-admin can use the console. `HomeComponent` now computes `isAdmin()` and skips both the request and the
stat tiles for non-admins — the tiles all link into admin-guarded areas (`/admin/blog`, `/media`) so showing them
was wrong anyway. `authGuard` resolves auth bootstrap before the component is constructed, so the role is known
without an effect. The component had no spec; there is now one covering both roles.

### Test-independence fixes, same class as the rest

- `experience-crud` soft delete asserted the row "stays but dims". It does not: `showDeleted` starts `false` and
  the query omits `includeDeleted`, so the row **leaves** the table and only returns dimmed once the chip is on.
  `ExperiencesPage.showDeleted()` added; the restore test shared the same wrong premise.
- `contact-message`'s "marks it READ" waited for a PATCH on `inbox-1` — which the test above it had already opened
  and read. Re-opening a read message fires nothing, so it burned 30s while the app was correct. It seeds its own
  message now.
- `media-crud`'s view-toggle test depended on an upload made by an earlier test in the describe, _and_ on that
  asset landing on page 1 of an internally paginated grid. It owns its asset and filters to it now.

### An eighth: `LoginPage.login()` could type into a form that was about to reset itself

Surfaced by the run that verified the `/profile` guard — one failure in 262, in a spec that had been green the run
before and that has nothing to do with `/profile`. The screenshot is what named it: both credential fields **empty**,
each under "This field is required.", on a form the test had just filled. The submit fired no request, so the test
died waiting 30s for `/api/auth/login`.

Cause: a login reached by _redirect_ (`/settings/change-password` → `authGuard` → `/auth/login`) is filled while the
auth-bootstrap request is still in flight. The inputs already exist in the rendered markup, so `fill` reports
success, and the form then resets both controls to pristine. Direct visits to `/auth/login` do not race, which is
why only one of the eight login-using specs ever flaked.

`fillCredentials` now wraps fill-then-verify in `expect(...).toPass()`, so the fill is retried until both values
stick. Deliberately not a wait on `console-full-page-spinner`: that element lives in the root `app.ts` template
permanently and only its inner overlay is conditional, so `waitFor({ state: 'detached' })` on it would hang every
login for the full timeout — and the indicator that was actually up in the failing run was the loading bar, not the
spinner. Retrying the observable symptom does not depend on guessing which indicator is showing.

Verified: 3/3 clean re-runs of `auth-guards`, then 51/51 across all eight specs that call `LoginPage.login()`.

### G7 resolved by deletion, not by hand-off

The user's call on 2026-07-29 was to delete the visual-regression pair rather than finish its baseline hand-off. The
reasoning is recorded as **ADR-032** in `decisions.md`; the short version is that the mechanism worked but the trade
was bad — two of ~twenty pages, both hollowed out (masked counters, an emptied list) to be diffable at all, needing a
CI round-trip on every deliberate design change, on a project mid-redesign. `.context/design/contracts/responsive-contract.md`
had already written "no pixel-diff baselines"; the spec was the outlier.

Gone: the spec, `helpers/visual.ts`, both win32 PNGs, the `@visual` tag, `--grep-invert @visual`, and the
`workflow_dispatch` baseline job. `console-e2e` runs unfiltered again, and `PW_CHANNEL=msedge` loses the one caveat
attached to it, since that warning was only ever about baselines.

### The two siblings, closed — and what checking the library's own docs changed

The siblings were fixed after reading Angular Material's Chips page rather than only its source, which is what the
sixth-bug entry above had done. Three things came out of that, and one of them was a defect in this task's own fix.

**The project doc's A11y lines were not fantasy, they were aimed at the wrong primitive.** `mat-button-toggle-group`
in `multiple` mode renders exactly `role="group"` over `role="button"` + `aria-pressed`, which is what both sibling
docs demanded all along. So each sibling was a real choice, not a bug with one answer: match the doc's semantic by
switching primitive and accept a connected segmented-control look, or keep the chip look and correct the doc. The
calls, per component:

| Component           | Now                           | Why                                                                                                                                                                      |
| ------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `chip-toggle-group` | `mat-chip-listbox [multiple]` | Material's documented answer for multi-select chips. Same primitive as `chip-select`, so the two are finally one pair. Doc corrected `aria-pressed` → `aria-selected`.   |
| `chip-boolean`      | `mat-chip`                    | Not a listbox at all. `mat-chip` declares no a11y pattern, has no inner button, and reflects `attr.role`/`attr.aria-label` from inputs, so the host is the exposed node. |

`chip-toggle-group` had also been failing its own quality checklist since April: the checklist asked for arrow-key
navigation and the hand-rolled `<div class="chip-row">` had no `FocusKeyManager`, so arrows did nothing. The listbox
supplies it with no code.

**A third defect the sixth-bug pass missed: not one container had a name.** Material's Accessibility section says to
label `mat-chip-listbox` with `aria-label`/`aria-labelledby`, and all four call sites left it off — including
`chip-select` after this task had already "finished" it, so a screen reader announced a bare "listbox". `aria-label` is
now a **required** input on both group members, bound as an attribute (the listbox host carries `role="listbox"`
itself), which is the exact opposite of the chips inside it.

**And a defect this task introduced: the rewrite silently removed the checkmark.** `hideSingleSelectionIndicator` had
been sitting on `mat-chip-option`, where it is not an input and was therefore inert, so selected chips had been drawing
a checkmark all along. Carrying the attribute up to the listbox during the sixth-bug rewrite made it effective for the
first time. Material warns the flag "makes the component less accessible", and `_overview.md` uses the check affordance
as the very thing separating `chip-select` from `console-segmented-control`. Removed, with a spec that fails if it
returns.

Both siblings had no spec file at all; they now carry 25 tests, written red first (19 failed before the port).
Neither public API changed, so the only call-site edits were the four added `aria-label`s. Recorded as ADR-033.

### A ninth: four profile specs share one profile row, and only a local parallel run notices

A pre-commit review turned this up while the chip work was being verified, and it explains the bulk of a
29-failure local run that had otherwise looked unattributable. `profile-per-section`, `profile-avatar-picker`,
`profile-certification-picker` and `profile-resume-picker` each call `seedProfile(TEST_USERS.admin.id, …)` in a
`beforeEach`, and that resets the **one** profile row the admin user has: `avatarId`, `ogImageId`, `certifications`
and `resumeUrls` all go back to defaults. One file's reset lands mid-assertion in another file, and the symptom is a
picker reading empty immediately after the test filled it. Twelve of that run's 29 failures were these three specs.

**CI cannot hit it.** Each shard is its own runner with its own Postgres service, and `workers: 1` inside a shard
serialises everything — the reasoning is already written into `ci.yml`'s own comment. Locally, `fullyParallel: true`
with `workers` unset puts the four files in four workers at once.

`test.describe.configure({ mode: 'serial' })` was tried and reverted: it orders tests _within_ a file and says
nothing about files racing each other, so the failures persisted, and it additionally skips the remainder of a file
after the first failure, which destroys the evidence needed to diagnose anything. Measured: 4 failed / 38 did not run
with it, against 45/45 passing under `--workers=1` without it.

What landed instead is the constraint written on `seedProfile` itself, where a caller will see it. The durable fix is
a profile row per spec file, which needs extra seeded users in `global-setup`, and is left below.

### Remaining

- **Give the four profile specs their own profile rows.** Seed one user per spec file in `global-setup.ts` instead of
  four files sharing the admin's row. Until then, a local run touching more than one of them needs `--workers=1`.
- **Assert 403 on the controllers that were actually open.** `auth-guards.spec.ts` only exercises `/api/users`, which
  was always method-decorated and therefore never part of the class-level hole. The six that were open —
  `admin/blog`, `dashboard`, `media`, `admin/profile`, `admin/about/failures`, `admin/about/principles` — have no test
  asserting a non-admin gets 403, and the unit spec uses a synthetic controller so it cannot catch a real controller
  that forgot `@UseGuards(RoleGuard)` either.
- **Single-option `mat-chip-listbox` on six list pages.** `projects.html`, `posts`, `experiences`, `tags`, `skills` and
  `categories` each ship a raw one-option listbox with no `aria-label`, which the family rules added above now forbid
  (minimum two options, named container). Not a regression — the new rule turned existing markup into stated debt.

- **Promote the "primitive owns the role" rule to the global kernel** (`patterns/chip-toggles`) via `/design document`.
  It is not Angular-specific — any wrapped chip/listbox primitive in any stack has the same trap. Worth carrying the
  companion rule with it: a wrapper's A11y section cites the primitive's docs, never the WAI-ARIA APG.
- **A visual check of the two rebuilt components** on a running console: `chip-boolean`'s pressed fill is now written
  from Material's chip tokens rather than inherited from the selected-chip class, and `chip-select`'s checkmark is back.
  Both are unverified by eye — the dev server is the user's to start.

## Files to Touch

- FE (aria-labels): `libs/console/feature-profile/src/lib/sections/profile-identity.section/*.html` (done),
  `.../profile-seo-og.section/*.html` (done); likely skill/project/blog picker host templates.
- POMs: `apps/console-e2e/src/pages/media-picker.page.ts` (done), `profile.page.ts`, `skills.page.ts`,
  `projects.page.ts`, `categories.page.ts`, `tags.page.ts`, `experiences.page.ts`, `media.page.ts`, `login.page.ts`, etc.
- Specs: the 19 files listed in the drift map.

## Dependencies

Follows task 384 (429 fix). Independent otherwise.

## Complexity: L

**Reasoning:** 19 spec files + POMs + a few FE aria-labels + some seed-data adjustments, each needing
verification. Mechanically repetitive but wide; some clusters (resume/cert relocation, visual re-baseline)
need judgment. Multi-session.
