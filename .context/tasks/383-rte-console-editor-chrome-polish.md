# Task: RTE — Console editor chrome/styling polish

## Status: mostly done (verify #3 backlog with owner)

## Goal
Fix the editor chrome (popovers, toolbar) styling and layout-stability issues in the console rich-text editor, so menus are readable and controls don't shift on interaction.

## Context
Found during **task 318** manual testing (2026-06-30), after the content-prose port landed. These are editor **chrome** issues (the engine's toolbar/popover UI), distinct from the content-prose layer 318 added. Deferred out of 318 into this task per owner.

The console pulls the engine's chrome stylesheet (`@phuong-tran-redoc/document-engine-angular/styles`) and remaps its shadcn-style CSS vars to console tokens in `libs/console/shared/ui/src/styles/vendor/document-engine.scss`. Several chrome surfaces are still wrong:

## Known Issues
1. **Link popover has a transparent background** → the popover (Link / Edit / Properties / unlink actions) is unreadable against the page. Likely the vendor remap covers the editor content vars but **misses `--popover` / `--popover-foreground`** (and any other surface the engine uses for floating menus). Note: floating popovers may be **portalled outside** `document-engine-editor`, so the current editor-scoped remap block won't reach them — the popover vars may need a non-scoped (or differently-scoped) remap.
2. **Toolbar layout jumps when an item is focused/active** — focusing/activating a toolbar button shifts the layout. It should stay static and only change visual state (color/bg), not box size. Likely an active/focus rule that adds border/padding instead of using an inset outline or transparent-border placeholder.
3. _(More issues to be enumerated — owner noted "một số vấn đề khác". Collect here before starting.)_

## Acceptance Criteria
- [ ] Link popover (and any other engine floating menu/popover) has a solid, token-driven background + foreground, readable in light and dark. Verify the remap reaches portalled popovers.
- [ ] Toolbar buttons do not shift surrounding layout on hover/focus/active — state change is visual only (no box-size change). Reserve space for any border (transparent placeholder) or use inset outline.
- [ ] Any additional issues collected under "Known Issues #3" addressed or split out.
- [ ] Verified in console (light + dark) after a server restart.

## Technical Notes
- Primary file: `libs/console/shared/ui/src/styles/vendor/document-engine.scss` (the var remap + chrome overrides). Editor host: `console-rich-text-editor` → `document-engine-editor`.
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
