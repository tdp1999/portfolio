# 393 — Write the 7 mode docs

> from: `epic-design-skill.md`. Depends on 390 (stubs) and benefits from 391/392 (library + project
> layout to reference). Fills the mode logic that the router delegates to.

## Goal

Author `modes/*.md` so each mode carries its full workflow and obeys the core rules. Each mode reads
its relevant `shared/conventions/*` and library files on demand (progressive disclosure).

## Modes

- **init** — detect/scaffold the project `.context/design/` layout (ctx `context-init` pattern:
  check state → report → scaffold from `shared/templates/`). (WF1)
- **adopt** — review the global `patterns/`, pick the ones fitting a new project, instantiate thin
  project stubs that link the global parent. (WF1)
- **research** — a feature/component: gather reference + docs + the author's `taste/`, present as
  DDL ideas/prototypes; end with save-routing (default global). (WF2)
- **ingest** — a source (article / repo / skill / effect): extract, **cross-check against the bank,
  detect conflicts, report them ELI5**, author picks; then save-routing. Import = resource-only. (WF3)
- **revamp** — change structure/taste; refactor from simple to comprehensive, staged. (WF4)
- **review** — advise / pick / search / audit a component against the bank. (WF5)
- **document** — write a **thin** decision-record per the SoT rule; default push the portable kernel
  to global, keep residue in project.

## Acceptance criteria

- [x] All 7 modes authored; router dispatches to each; no-arg menu lists all 7.
- [x] Every mode obeys core rules (SoT, save-routing, minimal-record, import=resource, progressive disclosure).
- [x] `ingest` conflict report is plain/detailed and defers the pick to the author (no silent overwrite).
- [x] `research`/`document` default save target = global; author can redirect to project.
- [x] `init`/`adopt` operate on project-local `.context/design/` without hardcoding portfolio paths.

## Files to touch

- `~/.claude/skills/design/modes/**`
- `~/.claude/skills/design/shared/conventions/**` (referenced)

## Trạng thái

`done` — created 2026-07-24, completed 2026-07-24. All 7 `modes/*.md` expanded from stubs
to full workflows: init (check→report→scaffold, 7 buckets, no placeholder docs), adopt
(lazy thin-stub instantiation linking global parents), research (broaden-before-converge +
DDL presentation + global save), ingest (full ELI5 conflict-report template, author picks),
revamp (staged simple→comprehensive, per-stage review, DDL-same-commit), review
(measure-don't-eyeball + whole-page pass + recommend-not-survey), document (classify → thin
SoT record → global default). Stub markers removed.
