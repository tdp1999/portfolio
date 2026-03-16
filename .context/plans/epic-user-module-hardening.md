# Epic: User Module Production Hardening

## Summary

Comprehensive security hardening, functional completion, and code quality improvement of the User module. Covers authentication enforcement on all endpoints, RBAC foundation, invite-only user registration, Google SSO restriction to login-only, refresh token hashing, soft-delete, admin seeding, and industry-standard input handling.

## Why

The User module was built as a functional prototype. It currently has unprotected endpoints (no auth guards), no role system, no ownership checks (IDOR), plain-text refresh token storage, and an orphaned public registration endpoint. These gaps are unacceptable for production and represent real attack surface even for a personal portfolio site shared with friends.

## Target Users

- Site owner (admin) — manages invited users
- Invited users — access dashboard features
- Developers (future) — extensible role/permission foundation

## Scope

### In Scope

**Security (Critical)**
- Auth guards on all User controller endpoints
- IDOR protection (ownership check: user sees own profile, admin sees any)
- Refresh token hashing (SHA-256, matching password-reset-token pattern)
- Timing-safe token comparison
- Rate limiting on admin user creation endpoint
- Email case normalization (lowercase before storage/lookup)
- Input trimming on name field
- Name field XSS sanitization (strip HTML tags)

**Role System**
- `role` enum column on User model (`ADMIN`, `USER`, default `USER`)
- `RoleGuard` decorator for endpoint protection
- Role included in JWT access token payload
- Role included in `toPublicProps()` response

**Google SSO Restriction**
- GoogleLoginCommand rejects unknown emails (no auto-create)
- Returns clear error: "This site is invite-only. Contact the administrator."
- Keeps existing behavior: link googleId if user exists but not yet linked

**Admin Seed**
- Prisma seed script (`prisma/seed.ts`)
- Reads `ADMIN_EMAIL`, `ADMIN_NAME`, `ADMIN_PASSWORD` from env
- Creates admin user with role `ADMIN` and bcrypt-hashed password
- Idempotent (skip if email already exists)

**Admin Invite Flow**
- `POST /users` becomes admin-only (JwtAccessGuard + RoleGuard)
- Creates user with role `USER`, generates password-set token, sends invite email
- "Set password" endpoint (reuse/extend reset-password flow with dedicated token type)

**Email Immutability**
- Remove `email` from `UpdateUserSchema`
- Remove `email` from `updateProfile()` entity method

**Soft-Delete**
- `deletedAt` nullable timestamp column on User model
- `DELETE /users/:id` endpoint (admin-only, sets deletedAt)
- All queries filter out soft-deleted users
- Soft-deleted users cannot log in

**Pagination**
- `findAll` repository method with cursor/offset pagination
- `GET /users` admin-only endpoint with search by name/email, pagination

**Code Quality**
- Partial updates in repository (only changed fields to Prisma)
- Fix `zod` import to `zod/v4` in `get-user-by-email.query.ts`
- Typed return DTOs on query handlers
- Repository `update()` returns `void`
- Pass authenticated user ID to `BaseCommand` (not hardcoded `'system'`)
- Add `hasGoogleLinked` to `toPublicProps()`

**Frontend — Set-Password Page**
- New page at `/auth/set-password` for invited users to set their password via email link
- Accepts `token` and `userId` query params (same pattern as reset-password)
- Form: new password + confirm password with validation
- On success: redirects to login with success message
- Error handling: invalid/expired token feedback

**Frontend — UserProfile & Auth Store Updates**
- `UserProfile` interface updated with `role` and `hasGoogleLinked` fields
- Auth store and sidebar reflect new user data
- Admin badge shown next to user name in sidebar when role is `ADMIN`

**Frontend — Admin User Management Page**
- Dedicated `/admin/users` route section (protected by admin role guard)
- Material table listing users with pagination and search (name/email)
- "Invite User" button → dialog with name + email form
- Soft-delete action per user row with confirmation dialog
- Shows user role, status (active/deleted), created date
- Admin route guard (frontend) checks user role from auth store

### Out of Scope

- Avatar/profile picture support (separate epic)
- Audit log for user mutations (separate epic)
- Sessions management UI (list/revoke active sessions)
- Public self-registration page
- CORS audit (separate infrastructure task)
- Helmet/security headers (separate infrastructure task)
- Account lockout notification emails
- Request/correlation ID tracing

## High-Level Requirements

### Phase 1: Foundation (must be first — other phases depend on this)

1. **Add `role` enum to Prisma schema** — `enum Role { ADMIN USER }`, add `role Role @default(USER)` and `deletedAt DateTime?` columns to User model. Generate migration.
2. **Update User entity** — Add `role` and `deletedAt` to `IUserProps`, `ICreateUserPayload`, entity getters, `toPublicProps()` (include `role`, `hasGoogleLinked`). Add `softDelete()` method returning new User with `deletedAt` set. Make `email` immutable (remove from `updateProfile`).
3. **Update UserMapper** — Map `role` and `deletedAt` between Prisma and domain.
4. **Update DTOs** — Remove `email` from `UpdateUserSchema`. Add `CreateUserByAdminSchema` (name, email, role?). Add pagination/search query schema.
5. **Update JWT payload** — Include `role` in access token claims. Update `AccessTokenPayload` type in TokenService.
6. **Create `RoleGuard`** — Reads role from JWT payload, checks against required role(s). Decorator: `@Roles('ADMIN')`.
7. **Admin seed script** — `prisma/seed.ts`, idempotent, reads env vars, hashes password, creates admin with `ADMIN` role.

### Phase 2: Security Hardening

8. **Hash refresh tokens** — Before storing via `setRefreshToken()`, hash with SHA-256. On comparison in `RefreshTokenHandler`, hash incoming token and compare against stored hash. Use `crypto.timingSafeEqual` for comparison.
9. **Guard all User endpoints** — Add `JwtAccessGuard` to all routes. Add `RoleGuard('ADMIN')` to `POST /users`, `GET /users` (list), `DELETE /users/:id`. Self-access routes (`GET /users/:id`, `PATCH /users/:id`) check `req.user.id === param.id || req.user.role === 'ADMIN'`.
10. **IDOR ownership check** — Implement as a reusable guard or inline in handlers. User can only GET/PATCH own profile; admin can access any.
11. **Rate limit `POST /users`** — Apply `@Throttle` decorator (same pattern as login).
12. **Input sanitization** — Trim `name` in Zod schema (`.trim()`). Normalize email to lowercase in schemas and before DB lookup. Strip HTML from `name` (simple regex or `sanitize-html` micro-lib).

### Phase 3: Functional Completion

13. **Google SSO login-only** — Modify `GoogleLoginHandler`: if `findByEmail` returns null, throw `ForbiddenError('This site is invite-only...')` instead of creating user. Keep googleId linking for existing users.
14. **Admin invite flow** — New `InviteUserCommand`: validates admin schema, checks email uniqueness, creates user (no password, role USER), generates password-set token (SHA-256 hashed), stores on user, sends invite email with link. Reuse email service.
15. **Set-password endpoint** — `POST /auth/set-password` accepting `{ token, userId, newPassword }`. Similar to reset-password but checks for invite token. Clears token after use.
16. **Soft-delete endpoint** — `DELETE /users/:id` (admin-only). Sets `deletedAt`, clears refresh token, increments token version (invalidates sessions). Does NOT hard-delete.
17. **Soft-delete query filtering** — All `findById`, `findByEmail`, `findAll` exclude `deletedAt IS NOT NULL`. Login/refresh flows reject soft-deleted users.
18. **List users with pagination** — `GET /users` (admin-only). Repository `findAll({ page, limit, search? })`. Returns `{ data, total, page, limit }`.

### Phase 4: Code Quality

19. **Partial updates** — Repository `update()` accepts a partial changeset instead of full entity. Only sends changed fields to Prisma `update()`.
20. **Fix zod/v4 import** — `get-user-by-email.query.ts` line 3: `import { z } from 'zod/v4'`.
21. **Typed query responses** — Define `UserPublicDto` type, use as explicit return type on query handlers.
22. **Repository `update()` returns void** — Remove misleading `boolean` return.
23. **BaseCommand initiator** — Pass `req.user.id` from controller to command constructor. `'system'` only for internal/seed operations.

### Phase 5: Frontend

24. **Set-password page** — `/auth/set-password?token=...&userId=...`. New page mirroring reset-password UX: password + confirm fields, validation, submit calls `POST /auth/set-password`. Success → redirect to login with toast. Error → show invalid/expired token message.
25. **UserProfile & auth store updates** — Add `role` and `hasGoogleLinked` to `UserProfile` interface. Auth store populates from API. Sidebar shows admin badge when `role === 'ADMIN'`.
26. **Admin user management page** — New `/admin/users` route (admin role guard). Material table with pagination + search. "Invite User" button → dialog (name, email). Soft-delete action per row with confirmation. Shows role, status, created date.
27. **Admin role guard (frontend)** — Route guard checking `authStore.user().role === 'ADMIN'`, redirects non-admins to home.

## Technical Considerations

### Architecture

- Follows existing CQRS pattern: new commands (`InviteUserCommand`, `SoftDeleteUserCommand`), new queries (`ListUsersQuery`)
- `RoleGuard` lives in `modules/auth/application/guards/` alongside existing `JwtAccessGuard`
- Validation stays in handlers (not controllers), per architecture rules
- Controllers remain thin — no error throwing

### Dependencies

- Existing `@portfolio/shared/errors` factory functions (`ForbiddenError` may need adding if not present)
- Existing email service for invite emails
- Existing `hashPassword` utility for admin seed
- `crypto` built-in for SHA-256 hashing and `timingSafeEqual`

### Data Model Changes

```prisma
enum Role {
  ADMIN
  USER
}

model User {
  // ... existing fields ...
  role      Role      @default(USER)
  deletedAt DateTime?
  // ... rest unchanged ...
}
```

### Migration Safety

- Adding `role` with `@default(USER)` is non-destructive — existing rows get `USER`
- Adding `deletedAt` nullable is non-destructive
- No column removals or renames

## Risks & Warnings

**Partial Update Complexity**
- Switching from full-entity to partial updates changes the repository contract
- Must ensure all callers (auth module uses `repo.update()` extensively) are updated
- Mitigation: change incrementally, test each caller

**Seed Script in Production**
- Must be idempotent — running twice must not fail or create duplicates
- Password from env var must meet validation rules (8+ chars, upper, lower, number, special)
- Mitigation: seed script validates password before hashing

## Success Criteria

- [ ] All User endpoints require authentication (no anonymous access)
- [ ] Regular user can only read/update own profile
- [ ] Admin can CRUD any user
- [ ] Google SSO rejects unknown emails with clear invite-only message
- [ ] Admin can invite user via `POST /users` → user receives email → sets password → can log in
- [ ] Refresh tokens stored as SHA-256 hashes, compared with timing-safe equality
- [ ] Soft-deleted users cannot log in and are excluded from all queries
- [ ] `GET /users` returns paginated list (admin-only)
- [ ] Admin seed creates first admin user from env vars
- [ ] Email is immutable — cannot be changed after creation
- [ ] All inputs trimmed, email lowercased, name HTML-sanitized
- [ ] All existing tests pass + new tests for every requirement above
- [ ] Zero regressions in auth flows (login, refresh, logout, change-password, forgot/reset)

## Estimated Complexity

**L (Large)**

**Reasoning:** ~23 requirements across 4 phases touching User module, Auth module, Prisma schema, JWT payload, and seeding infrastructure. Each individual item is small-medium, but the aggregate scope and cross-cutting nature (auth token hashing affects login, refresh, logout flows) makes this a large effort. Recommend breaking into 4 task batches matching the phases.

## Status
done

## Broken Down
2026-03-03 — Tasks 124-132

## Created
2026-03-03
