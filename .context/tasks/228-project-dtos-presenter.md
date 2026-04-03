# Task: Project DTOs and Presenter

## Status: pending

## Goal
Create Zod validation schemas for project input and the Presenter class for response shaping.

## Context
Project has the most complex DTO in the system — nested TechnicalHighlight array with translatable JSON fields. Presenter needs two shapes: list summary (for `/projects` card) and full detail (for `/projects/:slug`). Reuses TranslatableSchema from shared lib (Profile module dependency — if not yet available, define locally and refactor later).

## Acceptance Criteria
- [ ] `CreateProjectSchema` — Zod schema validating all fields per epic spec
- [ ] `UpdateProjectSchema` — partial version for updates
- [ ] `TechnicalHighlightSchema` — nested schema (challenge, approach, outcome as TranslatableSchema, optional codeUrl)
- [ ] Highlights array max 4 (PRJ-002)
- [ ] URL validation on sourceUrl, projectUrl, codeUrl
- [ ] `ProjectPresenter.toListItem(project)` — slug, title, oneLiner, startDate, thumbnailUrl (resolved), skills (name + slug), featured
- [ ] `ProjectPresenter.toDetail(project)` — full response with highlights, images (resolved URLs), skills
- [ ] `ProjectPresenter.toAdminResponse(project)` — full response including audit fields and IDs
- [ ] Unit tests for DTO validation (valid, invalid, edge cases — empty highlights, max highlights, invalid URLs)
- [ ] Unit tests for Presenter (list item shape, detail shape, null thumbnail handling)

## Technical Notes
- **Specialized Skill:** `be-test` — read `.claude/skills/be-test/SKILL.md` for guidelines. **Key sections to read:** `Core Workflow: Analyze -> Plan -> Write -> Validate`, `references/layer-rules.md` (DTO section)
- Follow Skill DTO pattern: `apps/api/src/modules/skill/application/skill.dto.ts`
- Follow Skill Presenter pattern: `apps/api/src/modules/skill/application/skill.presenter.ts`
- TranslatableSchema: `z.object({ en: z.string().min(1), vi: z.string().min(1) })`
- If TranslatableSchema not yet in shared lib, define in this DTO file with a TODO to extract
- Resolve `thumbnailUrl` from Media relation in presenter (access `media.url`)
- Resolve `images[].url` from ProjectImage → Media relation

## Files to Touch
- apps/api/src/modules/project/application/project.dto.ts (new)
- apps/api/src/modules/project/application/project.dto.spec.ts (new)
- apps/api/src/modules/project/application/project.presenter.ts (new)
- apps/api/src/modules/project/application/project.presenter.spec.ts (new)

## Dependencies
- 226 - Entity types needed for presenter

## Complexity: M

## Progress Log
