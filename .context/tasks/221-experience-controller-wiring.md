# Task: Experience controller + module wiring

## Status: pending

## Goal
Create the Experience REST controller with public and admin endpoints, wire up the NestJS module with all providers, and register in AppModule.

## Context
Experience controller follows established pattern: thin controller dispatching to CommandBus/QueryBus, no validation logic, no error throwing. Public endpoints (GET) have no auth, admin endpoints (POST/PUT/DELETE/PATCH) require JWT + ADMIN role.

## Acceptance Criteria

### Controller (experience.controller.ts)
- [ ] `@Controller('experiences')`
- [ ] `GET /experiences` — public, dispatches `ListPublicExperiencesQuery`, no auth
- [ ] `GET /experiences/:idOrSlug` — public, dispatches `GetExperienceBySlugQuery` (detects UUID vs slug), no auth
- [ ] `POST /experiences` — admin, dispatches `CreateExperienceCommand(body, req.user.id)`, `@UseGuards(JwtAccessGuard, RoleGuard)`, `@Roles(['ADMIN'])`
- [ ] `PUT /experiences/:id` — admin, dispatches `UpdateExperienceCommand(id, body, req.user.id)`
- [ ] `DELETE /experiences/:id` — admin, dispatches `DeleteExperienceCommand(id, req.user.id)`
- [ ] `PATCH /experiences/:id/restore` — admin, dispatches `RestoreExperienceCommand(id, req.user.id)`
- [ ] `PATCH /experiences/reorder` — admin, dispatches `ReorderExperiencesCommand(body, req.user.id)`
- [ ] All `@Body()` and `@Query()` parameters typed as `unknown` (validation in handlers, not controller)
- [ ] Controller never throws errors (error logic in command/query handlers)

### Module (experience.module.ts)
- [ ] Imports: `CqrsModule`, `forwardRef(() => AuthModule)`, `forwardRef(() => UserModule)`
- [ ] Controllers: `[ExperienceController]`
- [ ] Providers:
  - `{ provide: EXPERIENCE_REPOSITORY, useClass: ExperienceRepository }`
  - `...commandHandlers` (all 5)
  - `...queryHandlers` (all 4)
- [ ] Exports: `[EXPERIENCE_REPOSITORY]` (for future Project module to validate FK)

### App Registration
- [ ] Import `ExperienceModule` in `apps/api/src/app/app.module.ts`
- [ ] Verify module loads without circular dependency errors

### Smoke Test
- [ ] API starts without errors
- [ ] `GET /experiences` returns empty array (no data yet)
- [ ] `POST /experiences` with valid JWT + body creates experience

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
