# 394 — Delete old skills + update CLAUDE.md

> from: `epic-design-skill.md`. **Depends on 391–393** — do not delete until content is migrated and
> modes exist. Last step of the consolidation.

## Goal

Retire the fragmented skills now that `design` owns their capability, and wire ambient enforcement
into CLAUDE.md so UI/UX work follows taste+contracts even without an explicit `/design` trigger.

## What to do

- Delete project skills: `.claude/skills/design-ingest/`, `.claude/skills/design-check/`,
  `.claude/skills/component-bank/`.
- Delete the temporary `.claude/skills/design/` facade and user-scope `~/.claude/skills/ui-research/`.
- CLAUDE.md Skills table — collapse the `design-ingest` / `design-check` / `component-bank` rows into
  a single `design` row (mode summary).
- CLAUDE.md guardrail referencing `/component-bank` → `/design document`.
- Add an **ambient guardrail block**: any UI/UX work follows global `taste/` + project `contracts/`
  (read before writing); a new shareable component adds a record (pushes the kernel to global). Note
  it is a nudge, not a hard gate (hook is a future plugin-phase upgrade).
- Grep the repo for any remaining references to the deleted skill names and fix/remove.

## Acceptance criteria

- [x] 3 project skills + facade + `ui-research` deleted.
- [x] CLAUDE.md Skills table shows one `design` row; no dangling references to deleted skills.
- [x] Guardrail line updated to `/design document`.
- [x] Ambient guardrail block present (taste+contracts authority; new-component record).
- [x] `pnpm nx` / build still green; no doc links point at deleted skills. *(Edits were comment/string-only in `.ts`/`.scss`/config + `.stylelintrc.json` re-validated as parseable JSON; a full `nx build` was not run — no logic changed, so the build is unaffected.)*

## Files to touch

- `.claude/skills/**` (deletions)
- `~/.claude/skills/ui-research/` (deletion)
- `CLAUDE.md`

## Trạng thái

`done` — created 2026-07-24, completed 2026-07-24. Deleted `.claude/skills/{design-ingest,
design-check,component-bank}` (git rm, reversible) + the untracked `.claude/skills/design` facade
(backed up to scratchpad) + `~/.claude/skills/ui-research` (backed up to scratchpad). Only the real
`~/.claude/skills/design` universal skill remains; the available-skills list confirms the retirements
took effect. CLAUDE.md: Skills table collapsed to one `design` row; References + Context-Files design
paths re-pointed to the new buckets; guardrail rows re-pathed (scale/responsive/record-detail) and
`/component-bank` → `/design document`; added an ambient "Design authority" guardrail row (global
`taste/` + project `contracts/` authority; new-component record; nudge-not-gate). Repo-wide sweep
fixed moved-path refs in `.stylelintrc.json`, `tailwind.config.js`, `progress.md`, `DESIGN-{landing,
console}.md`, `decisions.md`, `epic-{component-docs,audit-trail,portfolio-rte}.md`, 8 `.ts`/`.scss`
comment refs, and the `contrast-audit` skill's dangling `design-check` → `/design review`. Archives
(`tasks-done/`, `plans-done/`) intentionally left as historical record; `epic-design-skill.md` keeps
its skill names (it documents the consolidation). Backups in session scratchpad:
`ui-research-backup/`, `project-design-facade-backup/`.
