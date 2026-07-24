# 395 — [security] Relocate live credentials out of `visual-feedback.md`

> from: `epic-design-skill.md` (classification ambiguity H). Independent of the skill build — can run
> anytime. Repo-hygiene, not design knowledge.

## Problem

`.context/design/visual-feedback.md` embeds a **live console login (email + password)** committed to
the repo. A checked-in credential is a security smell and must not be carried forward verbatim into
the restructured `workflow/visual-feedback.md`.

## What to do

- Remove the literal credentials from the doc; replace with a reference to an ignored/env location
  (e.g. a gitignored local notes file or an env var the author sets) plus instructions to obtain them.
- Confirm the target file is gitignored / not committed.
- Flag to the author: **rotate the password** — it already exists in git history, so removal from the
  working tree does not undo exposure.

## Acceptance criteria

- [x] No literal credentials remain in any `.context/design/**` file.
- [x] The doc references a secure, non-committed location instead.
- [x] Author reminded to rotate the password (history exposure noted).

## Files to touch

- `.context/design/visual-feedback.md` (→ `workflow/visual-feedback.md` after task 392)
- `.gitignore` (if a local notes file is introduced)

## Trạng thái

`done` — created 2026-07-24, completed 2026-07-24. Literal email+password removed from
`workflow/visual-feedback.md` Step-2 snippet, replaced with `<CONSOLE_EMAIL>` / `<CONSOLE_PASSWORD>`
placeholders that reference a gitignored local file. Created `workflow/visual-feedback-creds.local.md`
as a **placeholder template** (deliberately NOT carrying the old password forward — it is compromised
and must be rotated). Added `.gitignore` rule `.context/design/workflow/*.local.md`; verified via
`git check-ignore` that the local file is ignored and untracked. Rotation reminder placed in both the
doc and the template. Grep confirms no `thunderphong`/`100100100` literals remain in any
`.context/design/**` file (the AC's scope).

**Residual copies outside this task's scope** (pre-existing, NOT touched here — flagged for follow-up):
the same live credential still sits in `apps/console-e2e/src/visual-regression.spec.ts:16`,
`tasks-done/.../271-media-picker-e2e.md:26`, and `tasks-done/.../258-e2e-profile-per-section-save.md:30`.
The e2e spec should read the login from an env var; the two archived task docs can be placeholdered.

**⚠️ Author action required:** rotate the console admin password — it exists in git history and in the
three files above, so working-tree removal does not undo the exposure. (History scrubbing via
filter-repo/BFG is optional and out of scope here.)
