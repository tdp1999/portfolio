# Task: Skill Module - Queries & Handlers

## Status: done

## Goal

Implement CQRS queries for Skill: GetAll (with filters), GetById, GetBySlug, GetChildren.

## Context

Queries support filtering by category, isLibrary, parentSkillId, and search. List response includes parent skill name. Follows Category query pattern with additional filters.

## Acceptance Criteria

- [x] `GetSkillsQuery` + handler: paginated list with category/isLibrary/parentSkillId/search filters
- [x] `GetSkillByIdQuery` + handler: single skill with parent info
- [x] `GetSkillBySlugQuery` + handler: single skill by slug
- [x] `GetSkillChildrenQuery` + handler: children of a specific skill
- [x] Response includes parent skill name/id when applicable
- [x] Default sort: displayOrder ASC, name ASC (handled by repository)
- [x] Unit tests for each handler

## Files to Touch

- apps/api/src/skill/application/queries/
- apps/api/src/skill/application/queries/handlers/
- Tests for each handler

## Dependencies

- 155-skill-repository

## Complexity: M

More query variants than Category but straightforward.

## Progress Log

- [2026-03-19] Started
- [2026-03-19] Done — all ACs satisfied (7/7 tests passing)
