# Task: Experience DTOs (Zod schemas) + Presenter

## Status: pending

## Goal
Define Zod v4 validation schemas for all Experience operations and create the Presenter for public vs admin response shaping.

## Context
Experience has 4 translatable JSON fields requiring Zod validation. Reuses `TranslatableStringSchema` and `TranslatableStringArraySchema` from shared types (established in Profile epic). Presenter has two variants: public (filtered, no audit/private fields) and admin (full).

## Acceptance Criteria

### DTO Schemas (experience.dto.ts)
- [ ] `CreateExperienceSchema` — Zod schema for creation:
  - `companyName`: `z.string().min(1).max(200)`
  - `companyUrl`: `z.string().url().max(500).optional()`
  - `companyLogoId`: `z.string().uuid().optional()`
  - `position`: `TranslatableStringSchema` (required en + vi)
  - `description`: `OptionalTranslatableStringSchema` (nullable)
  - `achievements`: `TranslatableStringArraySchema` (default { en: [], vi: [] })
  - `teamRole`: `OptionalTranslatableStringSchema` (nullable)
  - `employmentType`: `z.nativeEnum(EmploymentType).default('FULL_TIME')`
  - `locationType`: `z.nativeEnum(LocationType).default('ONSITE')`
  - `locationCountry`, `locationCity`: `z.string().max(100).optional()`
  - `locationPostalCode`: `z.string().max(20).optional()`
  - `locationAddress1`, `locationAddress2`: `z.string().max(300).optional()`
  - `clientName`: `z.string().max(200).optional()`
  - `clientIndustry`: `z.string().max(100).optional()`
  - `domain`: `z.string().max(100).optional()`
  - `teamSize`: `z.number().int().min(1).optional()`
  - `startDate`: `z.coerce.date()`
  - `endDate`: `z.coerce.date().optional()` (nullable = current position)
  - `skillIds`: `z.array(z.string().uuid()).default([])`
  - `displayOrder`: `z.number().int().min(0).default(0)`
- [ ] `UpdateExperienceSchema` — uses `nonEmptyPartial()` from shared utils (all fields optional, at least one required)
- [ ] `ListExperiencesSchema` — extends `PaginatedQuerySchema` with optional filters:
  - `employmentType`: `z.nativeEnum(EmploymentType).optional()`
  - `locationType`: `z.nativeEnum(LocationType).optional()`
  - `includeDeleted`: `z.coerce.boolean().default(false)`
- [ ] `ReorderExperiencesSchema` — `z.array(z.object({ id: z.string().uuid(), displayOrder: z.number().int().min(0) })).min(1)`
- [ ] TypeScript types exported: `CreateExperienceDto`, `UpdateExperienceDto`, `ListExperiencesDto`, `ReorderExperiencesDto`

### DTO Tests (experience.dto.spec.ts)
- [ ] CreateExperienceSchema validates valid complete input
- [ ] CreateExperienceSchema rejects missing required fields (companyName, position, startDate)
- [ ] CreateExperienceSchema validates translatable fields structure ({ en, vi })
- [ ] UpdateExperienceSchema rejects empty object (nonEmptyPartial)
- [ ] TranslatableStringArraySchema defaults to { en: [], vi: [] }

### Presenter (experience.presenter.ts)
- [ ] `ExperiencePresenter.toPublicResponse(entity, skills, companyLogoUrl)` — returns:
  - All non-private fields (id, slug, companyName, companyUrl, companyLogoUrl, position, description, achievements, teamRole, employmentType, locationType, locationCountry, locationCity, domain, teamSize, startDate, endDate, skills)
  - Excludes: clientName, clientIndustry, locationPostalCode, locationAddress1, locationAddress2, displayOrder, all audit fields (EXP-002)
  - Skills formatted as `{ id, name, slug }[]`
- [ ] `ExperiencePresenter.toAdminResponse(entity, skills, companyLogoUrl)` — returns all fields including audit, private location, client metadata
- [ ] `ExperiencePresenter.toPublicListResponse(entities)` — maps array
- [ ] `ExperiencePresenter.toAdminListResponse(entities, total)` — maps array with pagination metadata

## Technical Notes
- **Specialized Skill:** `be-test` — read `.claude/skills/be-test/SKILL.md` for guidelines. **Key sections to read:** `Core Workflow: Analyze -> Plan -> Write -> Validate`, `references/layer-rules.md` (DTO section)
- `TranslatableStringSchema` and `TranslatableStringArraySchema` should come from shared types. If Profile hasn't created them yet, define locally with a TODO to refactor.
- `z.coerce.date()` handles ISO string → Date conversion from JSON body
- `nonEmptyPartial()` is from `@portfolio/shared/utils` — makes all fields optional with at-least-one refinement
- Follow Skill DTO pattern for reference

## Files to Touch
- New: `apps/api/src/modules/experience/application/experience.dto.ts`
- New: `apps/api/src/modules/experience/application/experience.dto.spec.ts`
- New: `apps/api/src/modules/experience/application/experience.presenter.ts`

## Dependencies
- 216 (Domain entity types)

## Complexity: M

## Progress Log
