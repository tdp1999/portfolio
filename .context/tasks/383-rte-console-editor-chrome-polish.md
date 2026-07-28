# Task: RTE — Editor chrome/styling polish (console + landing)

## Status: in-progress

## Goal
Fix the editor chrome (popovers, toolbar) styling and layout-stability issues in the document-engine rich-text editor across **both** consumers — console (`console-rich-text-editor`) and the landing `/document-engine` product page — so menus are readable and controls don't shift on interaction.

## Scope (widened 2026-07-28)
Originally console-only. Widened by owner to cover both apps, because they share one engine version (`0.1.4`) and one panel shim, so testing a single surface is blind to half the problem.

The two consumers do **not** share their var remap — only the shim is common:

| Surface | Engine styles pulled from | Var remap lives in |
|---|---|---|
| Console | `libs/console/shared/ui/src/styles/vendor/document-engine.scss` (global, `apps/console/src/styles.scss`) | same file, scoped to `document-engine-editor`, maps to `--color-*` |
| Landing `/document-engine` | `apps/landing/.../document-engine.vendor.scss` (route lazy chunk) | `apps/landing/.../document-engine.scss:19`, maps to `--landing-*` |
| Both | — | shared shim `libs/shared/ui/src/styles/vendor/_document-engine-panels.scss` |

Read that as a triage signal: a defect in **one** app is usually a consumer remap gap (fix here); a defect in **both** is usually an engine defect (route to the DE repo, see below).

## Triage rule for new findings
- **Fixable consumer-side** (missing var, remap gap, override) → fix in this task, in the owning app's vendor/page SCSS.
- **Engine defect** (engine ships markup/CSS that can't be corrected cleanly from outside) → do **not** hack around it here. File against the `document-engine` repo — the known consumer-portability set is already captured as **de-016**; anything outside that set goes to **de-017** (repo-wide defect sweep). Keep document-engine consumer-free.
- Removal of the `_document-engine-panels.scss` shim is **not** this task — tracked as **361 · C2-B**, blocked on de-016 shipping + a version bump past `0.1.4`.

## Context
Found during **task 318** manual testing (2026-06-30), after the content-prose port landed. These are editor **chrome** issues (the engine's toolbar/popover UI), distinct from the content-prose layer 318 added. Deferred out of 318 into this task per owner.

The console pulls the engine's chrome stylesheet (`@phuong-tran-redoc/document-engine-angular/styles`) and remaps its shadcn-style CSS vars to console tokens in `libs/console/shared/ui/src/styles/vendor/document-engine.scss`. Several chrome surfaces are still wrong:

## Known Issues
1. **Link popover has a transparent background** → the popover (Link / Edit / Properties / unlink actions) is unreadable against the page. Likely the vendor remap covers the editor content vars but **misses `--popover` / `--popover-foreground`** (and any other surface the engine uses for floating menus). Note: floating popovers may be **portalled outside** `document-engine-editor`, so the current editor-scoped remap block won't reach them — the popover vars may need a non-scoped (or differently-scoped) remap.
2. **Toolbar layout jumps when an item is focused/active** — focusing/activating a toolbar button shifts the layout. It should stay static and only change visual state (color/bg), not box size. Likely an active/focus rule that adds border/padding instead of using an inset outline or transparent-border placeholder.
3. _(Open bucket — owner's manual sweep of both apps, 2026-07-28. Findings land in "Manual Test Findings" below.)_

## Manual Test Findings (owner, 2026-07-28)

Manual pass over both consumers. Fill one row per finding; leave the table as-is if a surface came back clean.

**Console** (`/admin/blog/new` and any other RTE host) — light + dark:

| # | Surface / control | What's wrong | Repro | Theme(s) | Verdict (consumer / engine) |
|---|---|---|---|---|---|
| | | | | | |

**Landing** `/document-engine` (embedded editor, lazy-loaded) — light + dark (landing themes via `:root[data-theme]`, `libs/landing/shared/ui/src/styles/tokens/palette.scss`):

| # | Surface / control | What's wrong | Repro | Theme(s) | Verdict (consumer / engine) |
|---|---|---|---|---|---|
| | | | | | |

Chrome surfaces worth walking, so nothing gets missed: toolbar (buttons, active state, overflow, the select/dropdowns), link bubble (add / edit / properties / unlink), colour picker, table create + table properties + cell properties panels, special characters, templates, dynamic fields, image bubble. For each: is the surface solid and readable, does it sit in the right place, does interacting with it shift anything.

## Acceptance Criteria
- [x] Link popover (and any other engine floating menu/popover) has a solid, token-driven background + foreground, readable in light and dark. Verify the remap reaches portalled popovers. _(console, 2026-07-23)_
- [x] Toolbar buttons do not shift surrounding layout on hover/focus/active — state change is visual only (no box-size change). _(no longer reproduces on 0.1.4; resolved upstream in 0.1.3)_
- [ ] Owner's manual sweep of **both** apps completed and findings recorded in the table above.
- [ ] Every consumer-side finding fixed in the owning app's SCSS; every engine-side finding routed to de-016 / de-017 with a pointer recorded here.
- [ ] Verified in console (light + dark) after a server restart.
- [ ] Verified on landing `/document-engine` after a server restart.

## Technical Notes
- Primary files: `libs/console/shared/ui/src/styles/vendor/document-engine.scss` (console var remap + chrome overrides; editor host `console-rich-text-editor` → `document-engine-editor`), `apps/landing/src/app/pages/document-engine/document-engine.scss` (landing remap, from ~line 19) and its sibling `document-engine.vendor.scss` (engine stylesheet, split out to keep the `anyComponentStyle` budget meaningful).
- For #1, check which CSS vars the engine's popover/menu components consume (grep the published `@phuong-tran-redoc/document-engine-angular/src/lib/styles/*.scss`), and whether the popover DOM is inside `document-engine-editor` or portalled to `body`. If portalled, remap at a higher scope.
- For #2, find the toolbar button active/focus rule in the engine's `toolbar.scss` / `button.scss` and neutralize the size-changing part with a console override.
- Some of these may be genuine **upstream engine** defects (chrome shipped by the lib). Where a clean console-side override isn't possible, file/track against document-engine rather than hacking around it — keep document-engine consumer-free (see DE-015 for the content-prose theme split).

## Dependencies
- 318-rte-obsidian-importer-migration (content-prose port landed there; this continues the editor styling work)

## Complexity: S

## Progress Log
- 2026-06-30 Created from task 318 manual-test findings. Two concrete issues captured (transparent link popover, toolbar layout jump on focus); owner has more to enumerate before work starts.
- 2026-07-23 Re-verified live on document-engine **0.1.4** (post DE-015) via Playwright, blog `/admin/blog/new` (full-mode RTE), light + dark:
  - **#1 transparent link popover — FIXED.** Root cause: the engine paints its floating
    menus (`.bubble-menu-wrapper` / `.toolbar-bubble-menu`, used by the link editor + image/
    color bubbles) with Tailwind utilities `bg-card text-card-foreground border-border
    shadow-elevation-2` in its template, delegating the colours to the CONSUMER's Tailwind.
    The console's Tailwind never defines `card`/`border`, so those classes emit nothing → the
    panel is transparent + border-less. It only *looked* solid in light because it floats over
    the editor's white content; over dark it was an unreadable ghost. Fix is console-side (not
    an engine defect): explicit token-driven surface for both wrappers in
    `libs/console/shared/ui/src/styles/vendor/document-engine.scss` (bg `--color-surface-elevated`,
    `color --color-text`, `border-color --color-border`, elevation shadow). Verified solid +
    readable in both themes (dark bg rgb(34,38,58) / light rgb(241,245,249)). Unscoped rule
    (engine-unique class names) so it also covers any portalled menu.
  - **#2 toolbar layout jump on focus/active — NO LONGER REPRODUCES.** Measured the Italic
    button box before/after activating Bold: dx=dy=0 (no shift); active state is visual-only.
    Resolved upstream by the 0.1.3 active-toggle-button work.
  - **#3 "more issues"** — none surfaced in this sweep beyond #1. Needs owner to enumerate any
    remaining chrome complaints, else close the task.
- 2026-07-28 **Scope widened by owner** from console-only to both consumers (console + landing
  `/document-engine`). Rationale: one engine version and one shared panel shim across two apps
  with *separate* var remaps, so a console-only pass cannot see landing-side gaps (and vice
  versa). Owner runs the manual sweep and reports into the "Manual Test Findings" tables; the
  triage rule above decides what is fixed here vs routed to de-016 / de-017. The two already-
  verified items (#1, #2) stay closed — the widened scope adds surfaces, it does not reopen them.
- 2026-07-28 Dòng status sửa `in progress — owner manual-testing both consumers` → `in-progress`.
  Hai lỗi trong một dòng: `in progress` viết rời (token đúng là `in-progress`) và phần chú thích
  đuôi. Cả hai đều làm `/ctx:sync` không khớp được token nào. **Đang chờ:** owner chạy sweep thủ
  công trên cả console lẫn landing `/document-engine`, điền vào bảng "Manual Test Findings".
