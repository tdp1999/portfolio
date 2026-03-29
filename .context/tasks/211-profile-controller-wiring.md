# Task: Profile REST controller + module wiring

## Status: pending

## Goal
Create the HTTP transport layer with public and admin endpoints, and wire the Profile module into the application.

## Context
Profile controller is unique: it has both public endpoints (no auth, for landing page) and admin endpoints (JWT + ADMIN role). The public profile endpoint is the first public data endpoint in the API (aside from auth and contact message submit).

## Acceptance Criteria

### Controller — Public Endpoints
- [ ] `GET /profile` — no auth, dispatches `GetPublicProfileQuery`, returns filtered response
- [ ] `GET /profile/json-ld` — no auth, accepts `?locale=en|vi` query param, dispatches `GetJsonLdQuery`
- [ ] Returns 404 if Profile not yet created (not an error — just hasn't been set up)

### Controller — Admin Endpoints
- [ ] `GET /admin/profile` — admin auth, dispatches `GetProfileQuery(req.user.id)`, returns full response
- [ ] `PUT /admin/profile` — admin auth, dispatches `UpsertProfileCommand(body, req.user.id)`, returns `{ id }`
- [ ] `PATCH /admin/profile/avatar` — admin auth, dispatches `UpdateProfileAvatarCommand`
- [ ] `PATCH /admin/profile/og-image` — admin auth, dispatches `UpdateProfileOgImageCommand`
- [ ] All admin endpoints use `@UseGuards(JwtAccessGuard, RoleGuard)` + `@Roles(['ADMIN'])`

### Controller Rules
- [ ] Thin adapter — no validation, no error throwing (application layer handles both)
- [ ] `/profile/json-ld` registered BEFORE `/:id` style routes (no /:id routes here, but good practice)

### Module Wiring
- [ ] `ProfileModule` imports: `CqrsModule`, `AuthModule` (forwardRef), `UserModule` (forwardRef), `MediaModule` (forwardRef)
- [ ] Provides: `PROFILE_REPOSITORY` → `ProfileRepository`, all command handlers, all query handlers
- [ ] Exports: `PROFILE_REPOSITORY`
- [ ] Controller registered
- [ ] Module imported in `AppModule`

### Integration Verification
- [ ] App starts without errors
- [ ] `npx tsc --noEmit` passes
- [ ] Manual test: PUT `/admin/profile` with valid payload → 200 with `{ id }`
- [ ] Manual test: GET `/profile` → public response (no phone, no address details)
- [ ] Manual test: GET `/profile/json-ld?locale=en` → valid JSON-LD

## Technical Notes
- Two controller prefixes pattern: could use one controller with both public and admin routes, or two separate controllers. One controller with mixed guards is simpler — use `@Public()` decorator (if exists) or just don't apply guard to specific routes.
- Alternative: `ProfileController` for public routes, `AdminProfileController` for admin routes. Check what pattern other modules use.
- The `GET /profile` public endpoint finds the single Profile (no userId param needed — there's only one).

## Files to Touch
- New: `apps/api/src/modules/profile/presentation/profile.controller.ts`
- New: `apps/api/src/modules/profile/profile.module.ts`
- New: `apps/api/src/modules/profile/index.ts`
- Update: `apps/api/src/app/app.module.ts` (import ProfileModule)

## Dependencies
- 210 (Commands + queries must exist)

## Complexity: S

## Progress Log
