# Task: Fix broad console-e2e test-drift unmasked by the 429 throttle fix

## Status: in-progress

## Goal
Repair the ~72 failing `console-e2e` tests (19 spec files) that surfaced once the login-throttle
`429` was fixed (task 384). All failures are **test-drift** — specs/POMs use selectors from before
the console UI refactors (profile-per-section, media-picker-unification, console-ui-redesign). The
app is healthy; the tests are stale. Fix cluster by cluster, verify locally, then let CI confirm.

## Context
- Task 384 fixed the auth login `429` (throttle now prod-only). Before that, ~every e2e test died at
  login `429`, masking the real state of the suite. First green-login CI run (`28651005883`): **72 failed
  / 94 passed**, all timeout-style failures (`locator.waitFor/click`), zero `429`.
- Root cause confirmed against live DOM (via playwright-skill + a real local admin login): the console UI
  was restructured and the specs were never updated.
- **Local project runner (`nx e2e`) is blocked** by a Playwright browser version mismatch (needs
  `chromium_headless_shell` build 1208; only 1194/1223 installed). User asked NOT to keep installing.
  Verification is therefore done via **playwright-skill** (its own working browser) driving the real app,
  plus **CI** as the full verifier (CI installs a clean browser + seeds its own DB — it ran all 257 tests).
- Local admin for skill-driven verification: user-provided (do not hardcode/commit). e2e test users
  (`test-*@e2e.local`) are seeded by `global-setup` and removed by `global-teardown`, so they are NOT
  present between runs — use the real local admin for skill checks.

## Ground-truth drift map (verified against live DOM)
| Cluster | Spec(s) | Drift | Fix |
|---|---|---|---|
| Profile avatar/OG | profile-avatar-picker | trigger is icon `button.media-trigger--{avatar,og}` with no accessible name; spec used `button:has-text('Change')` | **DONE (FE):** added `aria-label="Change avatar"` / `"Change OG image"`; spec → `getByRole('button',{name:'Change avatar'\|'Change OG image'})`. "renders current preview" test needs a seeded avatar (fresh e2e profile has none) — set one in the test/beforeEach. |
| Media picker POM | (shared) media-picker.page.ts | Library/Upload are a `mat-button-toggle` group (`role="radio"`), not `mat-tab-label` | **DONE:** `getByRole('radio',{name:'Library'\|'Upload'})`. Rest of POM (dialog `console-media-picker-dialog`, `console-asset-grid`, `[data-media-id]`, `h3` "Select Media", media card = button w/ `aria-label`=filename, Insert/Cancel) still correct. |
| Resume | profile-resume-picker | resume moved into `section#section-social-links` (subsection "Resume"); rows are `.resume-row` with a `.locale-badge` ("EN"/"VI"), NOT `[data-locale]`; "Change" button still has text | update section id + row/locale selectors; scope by `.locale-badge` text |
| Certifications | profile-certification-picker | moved into `section#section-social-links` (subsection "Certifications"); rows `.cert-row`; cert **file** picker button text is **"Choose file"** (not "Change"); "Add Certification" still text | update section id; cert picker button → "Choose file"; add a cert row first (starts empty) |
| Skill icon / project gallery / blog featured | skill-icon-picker, project-gallery-picker, blog-featured-picker | host-page trigger selectors + picker interactions drifted like avatar/OG | apply same media-trigger aria-label + MediaPickerPage patterns; verify each host page's trigger via skill |
| CRUD | category/tag/skill/project/experience/blog-crud | "navigate to page / create" flows time out — verify list/table + create-dialog selectors against current console (Material table = `getByRole('table')`, dialog = `getByRole('dialog')`) | re-verify per POM; likely table/dialog/role drift |
| Validation | auth-login (empty/invalid email), auth-password (mismatch), validation-tag-name | client-side validation error locators stale | update to `getByRole('alert')` / `<console-error-message>` |
| Auth | auth-google (Change Password sidebar) | sidebar/menu selector drift | verify sidebar item selectors |
| Visual | visual-regression | snapshots stale after redesign | re-baseline intentionally (only after UI confirmed correct) |

## Acceptance Criteria
- [ ] Every failing console-e2e spec updated to current DOM; POMs hold all locators (no inline CSS/tag selectors).
- [ ] Icon-only trigger buttons given `aria-label` (FE testability) instead of tests relying on CSS classes.
- [ ] Tests that need data (avatar preview, cert row) seed it rather than assuming prior state.
- [ ] Each cluster verified locally (playwright-skill against real app) before commit; final proof via CI (3 e2e shards green).
- [ ] No production behavior changed except additive `aria-label`s / testability attributes.

## Progress Log
- [2026-07-03] Investigated; root cause = broad test-drift post-refactor (not app regression), unmasked by the 429 fix.
  Confirmed live via playwright-skill. **Done + verified live:** FE `aria-label` on avatar+OG media triggers
  (`profile-identity.section.html`, `profile-seo-og.section.html`); MediaPickerPage Library/Upload → `getByRole('radio')`.
  Remaining clusters per the map above. Not yet committed (cluster specs still to update; keep uncommitted until a
  cluster passes locally).

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
