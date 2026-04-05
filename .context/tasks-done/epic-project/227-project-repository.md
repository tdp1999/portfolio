# Task: Project repository (port + adapter)

## Status: done

## Goal
Create the Project repository port (interface) and Prisma adapter with nested includes for highlights, images, and skills.

## Context
Repository follows port/adapter pattern. The Project repo is more complex than existing repos (Skill, Category) because it must handle nested includes for 3 child tables and support filtered queries (published, featured, soft-deleted).

## Acceptance Criteria
- [x] `IProjectRepository` port interface in `application/ports/project.repository.port.ts`
- [x] Methods: `create`, `update`, `findById`, `findBySlug`, `findAll` (admin, paginated), `findPublished`, `findFeatured`, `softDelete`, `restore`, `slugExists`, `batchUpdateOrder`
- [x] `create` accepts project data + highlights + imageIds + skillIds — inserts all in transaction
- [x] `update` accepts project data + highlights + imageIds + skillIds — replaces child records in transaction (PRJ-005)
- [x] All read methods include nested relations: `highlights` (ordered), `images` (ordered, with media), `skills` (with skill data)
- [x] `findPublished` filters: `status: PUBLISHED`, `deletedAt: null`, ordered by `displayOrder`
- [x] `findFeatured` filters: `featured: true` + published + not deleted
- [x] `slugExists(slug, excludeId?)` for collision detection
- [x] `ProjectMapper` in `infrastructure/mapper/project.mapper.ts` — maps Prisma result to domain entity
- [x] Repository injection token in `application/project.token.ts`
- [x] Unit tests for mapper (Prisma record → domain entity)

## Technical Notes
- **Specialized Skill:** `be-test` — read `.claude/skills/be-test/SKILL.md` for guidelines. **Key sections to read:** `Core Workflow: Analyze -> Plan -> Write -> Validate`, `references/layer-rules.md` (Mapper section)
- Follow Skill repo pattern: `apps/api/src/modules/skill/infrastructure/repositories/skill.repository.ts`
- Use `this.prisma.$transaction()` for atomic create/update with child records
- Replace-all strategy for highlights: `deleteMany({ projectId })` then `createMany(newHighlights)`
- Replace-all for images: `deleteMany({ projectId })` then `createMany(newImages)`
- Replace-all for skills: `deleteMany({ projectId })` then `createMany(newSkills)`
- Include `media` relation on ProjectImage for URL resolution in presenter

## Files to Touch
- apps/api/src/modules/project/application/ports/project.repository.port.ts (new)
- apps/api/src/modules/project/application/project.token.ts (new)
- apps/api/src/modules/project/infrastructure/repositories/project.repository.ts (new)
- apps/api/src/modules/project/infrastructure/mapper/project.mapper.ts (new)
- apps/api/src/modules/project/infrastructure/mapper/project.mapper.spec.ts (new)

## Dependencies
- 225 - Schema must exist
- 226 - Entity must exist for mapper

## Complexity: L
- Transaction-based nested writes, multiple query variants, mapper for complex nested result

## Progress Log
- [2026-04-05] Started
- [2026-04-05] Done — all ACs satisfied. Port, repository, mapper + 5 mapper tests passing
