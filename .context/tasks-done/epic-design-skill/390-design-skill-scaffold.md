# 390 — Scaffold the global `design` skill

> from: `epic-design-skill.md`. First build step: create the on-disk structure + router; no content
> distillation yet (that is task 391) and no mode logic yet (task 393).

## Goal

Create `~/.claude/skills/design/` as a user-scope skill whose layout maps near-1:1 to a future
plugin, with a router `SKILL.md`, empty mode stubs, shared buckets, config, and the `imported/`
resource area.

## What to do

- Router `SKILL.md` — frontmatter (`name: design`; a `description` whose triggers absorb every old
  skill's triggers so muscle memory still fires: "design check", "ingest design", "component doc",
  "ui research", "review design", "revamp design"; `argument-hint`; `allowed-tools`). Body: the
  lifecycle map, verb→mode routing, and the no-arg behavior (print mode menu + bank status).
- `modes/` — 7 stub files: `init.md adopt.md research.md ingest.md revamp.md review.md document.md`.
- `shared/principles/ shared/patterns/ shared/taste/` — empty (filled by 391).
- `shared/conventions/` — `bank-format.md`, `save-routing.md`, `import-protocol.md`,
  `research-protocol.md`, `component-doc-format.md` (stubs carrying the core-rule text).
- `shared/templates/` — `principle.md`, `pattern.md`, `taste-source.md`, `component-doc.md`, `bank-index.md`.
- `imported/` — `README.md` stating resource-only + attribution policy.
- Config — a documented `design-config` template with the 3 knobs (`saveDefault`, `autoRecord`,
  `suggestGatedSources`) and where it is read from (user vs project).

## Acceptance criteria

- [x] `SKILL.md` router present; no-arg prints the 7-mode menu + bank status.
- [x] `description` triggers cover check / ingest / component-doc / ui-research / review / revamp.
- [x] 7 mode stubs exist under `modes/`.
- [x] `shared/{principles,patterns,taste,conventions,templates}/` exist; conventions carry core rules.
- [x] `imported/README.md` states resource-only + attribution.
- [x] config template documents the 3 knobs.
- [x] Layout matches the splittable plan in the epic (modes/ + shared/ + imported/).

## Files to touch

- `~/.claude/skills/design/**` (new)

## Trạng thái

`done` — created 2026-07-24, completed 2026-07-24. Scaffold at `~/.claude/skills/design/`
(router + 7 mode stubs + 5 conventions carrying core rules + 5 templates + imported/README
+ config template). No content distilled yet (task 391).
