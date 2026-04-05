# Task: Experience controller + module wiring

## Status: done

## Goal
Create the Experience REST controller with public and admin endpoints, wire up the NestJS module with all providers, and register in AppModule.

## Context
Experience controller follows established pattern: thin controller dispatching to CommandBus/QueryBus, no validation logic, no error throwing. Public endpoints (GET) have no auth, admin endpoints (POST/PUT/DELETE/PATCH) require JWT + ADMIN role.

## Acceptance Criteria

### Controller (experience.controller.ts)
- [x] `@Controller('experiences')`
- [x] `GET /experiences` — public, dispatches `ListPublicExperiencesQuery`, no auth
- [x] `GET /experiences/:idOrSlug` — public, dispatches `GetExperienceBySlugQuery` (detects UUID vs slug), no auth
- [x] `POST /experiences` — admin, dispatches `CreateExperienceCommand(body, req.user.id)`, `@UseGuards(JwtAccessGuard, RoleGuard)`, `@Roles(['ADMIN'])`
- [x] `PUT /experiences/:id` — admin, dispatches `UpdateExperienceCommand(id, body, req.user.id)`
- [x] `DELETE /experiences/:id` — admin, dispatches `DeleteExperienceCommand(id, req.user.id)`
- [x] `PATCH /experiences/:id/restore` — admin, dispatches `RestoreExperienceCommand(id, req.user.id)`
- [x] `PATCH /experiences/reorder` — admin, dispatches `ReorderExperiencesCommand(body, req.user.id)`
- [x] All `@Body()` and `@Query()` parameters typed as `unknown` (validation in handlers, not controller)
- [x] Controller never throws errors (error logic in command/query handlers)

### Module (experience.module.ts)
- [x] Imports: `CqrsModule`, `forwardRef(() => AuthModule)`, `forwardRef(() => UserModule)`
- [x] Controllers: `[ExperienceController]`
- [x] Providers:
  - `{ provide: EXPERIENCE_REPOSITORY, useClass: ExperienceRepository }`
  - `...commandHandlers` (all 5)
  - `...queryHandlers` (all 4)
- [x] Exports: `[EXPERIENCE_REPOSITORY]` (for future Project module to validate FK)

### App Registration
- [x] Import `ExperienceModule` in `apps/api/src/app/app.module.ts`
- [x] Verify module loads without circular dependency errors

### Smoke Test
- [x] API starts without errors
- [x] `GET /experiences` returns empty array (no data yet)
- [x] `POST /experiences` with valid JWT + body creates experience

## Technical Notes
- Follow Skill controller/module pattern as reference
- `idOrSlug` detection: UUID v7 format check (36 chars with dashes) → use GetById, otherwise → use GetBySlug
- `PATCH /experiences/reorder` path must be registered BEFORE `/:id` routes to avoid route conflict
- `forwardRef` needed for AuthModule and UserModule to avoid circular DI

## Files to Touch
- New: `apps/api/src/modules/experience/presentation/experience.controller.ts`
- New: `apps/api/src/modules/experience/experience.module.ts`
- New: `apps/api/src/modules/experience/index.ts`
- Update: `apps/api/src/app/app.module.ts` (import ExperienceModule)

## Dependencies
- 219 (Commands)
- 220 (Queries)

## Complexity: M

## Progress Log
- [2026-04-04] Started
- [2026-04-04] Done — all ACs satisfied. Smoke tests passed live on port 3000.
