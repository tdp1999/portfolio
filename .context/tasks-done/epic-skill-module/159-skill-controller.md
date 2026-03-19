# Task: Skill Module - REST Controller

## Status: done

## Goal

Create Skill REST controller with standard CRUD endpoints plus hierarchy-specific endpoints.

## Context

Follows Category controller pattern. No error logic in controller — all validation/errors in command/query handlers.

## Acceptance Criteria

- [x] `POST /skills` — create skill
- [x] `GET /skills` — list with query params (category, isLibrary, parentSkillId, search, pagination)
- [x] `GET /skills/:id` — get by ID
- [x] `GET /skills/slug/:slug` — get by slug
- [x] `GET /skills/:id/children` — get children of a skill
- [x] `PATCH /skills/:id` — update skill
- [x] `DELETE /skills/:id` — soft delete
- [x] `POST /skills/:id/restore` — restore soft-deleted
- [x] Auth guard on write operations
- [x] Zod validation pipe on request bodies/queries (validation in handlers)
- [x] No error handling in controller (delegated to handlers)
- [x] Unit tests for controller — skipped per testing standard (thin transport adapter, covered by E2E)

## Files to Touch

- apps/api/src/skill/skill.controller.ts
- apps/api/src/skill/skill.controller.spec.ts

## Dependencies

- 157-skill-commands
- 158-skill-queries

## Complexity: M

More endpoints than Category but follows established pattern.

## Progress Log

- [2026-03-19] Started
- [2026-03-19] Done — all ACs satisfied
