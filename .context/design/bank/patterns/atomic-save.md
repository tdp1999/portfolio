---
name: Atomic Save
category: pattern
principles: [chunking-progressive-disclosure, reward-early-punish-late]
tags: [form, save, dirty-state, navigation-guard, transactional]
---

## When to Use
For domain entities with cross-field invariants where partial save would leave
the entity in an invalid state. Examples in this project: Experience, Project,
Article. Contrast with Settings/Preferences (use per-section save).

## The Atomic Save UX Combo

A correct atomic-save UX is **not** "one Save button at the bottom" — it is a
combination of 4–5 collaborating elements that together make atomic save feel
safe and discoverable.

### 1. Sticky Save Bar (footer)
- Footer bar bound to bottom of viewport, appears only when form is dirty
- Layout: `[● Unsaved changes]    [Discard]    [Save changes]`
- Save button: primary, shows loading state during request
- Discard: ghost; opens confirm dialog if changes are non-trivial
- Toast or inline confirm on successful save

### 2. Section Status on Scrollspy Rail
Even with a single atomic save, the rail shows per-section state:
- `●` Section has unsaved changes (dirty marker)
- `⚠` Section has validation errors after submit attempt
- Click `⚠` → smooth scroll to section + focus first errored field

This lets users see "errors are in 2 of 8 sections" without scrolling the whole page.

### 3. Submit-time Validation Summary
- On submit failure: banner at top: `"3 errors in 2 sections — Skills (1), Achievements (2)"`
- Each item links to the offending field (smooth scroll + focus)
- Plus inline error under each field (existing form-error pattern)
- Banner is dismissible but persists until errors resolved or new submit

### 4. Navigation Guard
- Angular `CanDeactivate` guard fires when form is dirty + user navigates away in-app
- Browser `beforeunload` event fires for tab close / external nav
- Modal: `"You have unsaved changes."` with three options:
  - **Stay on page** (default focus)
  - **Discard changes**
  - **Save and continue** (only if currently valid)

### 5. Auto-save Draft (optional, tier 2)
- Periodically save dirty form to `localStorage` (e.g., every 30s, throttled)
- On page load: if draft exists newer than persisted state, prompt:
  `"You have a draft from 2 hours ago. Restore?"`
- Does **not** replace explicit save — safety net for crash / accidental close
- Clear draft after successful explicit save

## Anti-patterns
- Save button only at page bottom on a 50-field form (forces scroll, lost-on-error)
- No dirty indicator — user can't tell if they have unsaved work
- Discard with no confirm — easy accidental data loss
- `beforeunload` only, no in-app nav guard — Angular Router bypasses it
- Validation summary that doesn't link to fields — useless for long forms
- Save button enabled when form is invalid — preferable: enabled but submit
  produces the validation summary; lets users discover what's wrong
- Auto-save without explicit save — users lose confidence ("did it save?")

## Angular Implementation Notes
- **Dirty state**: derive from `FormGroup.dirty` signal; expose to layout
- **Sticky bar**: place in layout; hidden when dirty=false
- **Nav guard**: `CanDeactivateFn` registered on the route
- **beforeunload**: `@HostListener('window:beforeunload', ['$event'])` — only sets
  `event.returnValue` (modern browsers ignore custom message)
- **Section status**: each section gets an `id` matching scrollspy entry;
  status derived from `FormGroup.get(sectionPath).status` + `.dirty`
- **Draft save**: separate service, debounced; clear on successful submit

## Sources
- [GitHub Primer — Saving pattern](https://primer.style/ui-patterns/saving/)
- [Cloudscape — Communicating unsaved changes](https://cloudscape.design/patterns/general/unsaved-changes/)
- [GitLab Pajamas — Saving and feedback](https://design.gitlab.com/product-foundations/saving-and-feedback/)
- [Oracle Alta UI — Save Model](https://www.oracle.com/webfolder/ux/middleware/alta/patterns/SaveModel.html)
- [Brian Lovin — Design to save people from themselves](https://brianlovin.com/writing/design-to-save-people-from-themselves)
