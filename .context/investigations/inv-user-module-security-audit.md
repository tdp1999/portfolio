# Investigation: User Module Security & Logic Audit

## Type

security

## Summary

A security audit of the User CRUD module revealed critical vulnerabilities: passwords stored in plain text (no hashing), sensitive fields leaked in API responses (passwordHash, refreshToken, etc.), and weak password validation (only `min(8)` with no complexity rules). These issues violate OWASP standards and must be remediated before any production deployment.

## Issue Description

**Expected:** Passwords hashed with bcrypt, API responses exclude sensitive fields, strong password validation enforced.
**Actual:** Passwords stored as plain text, full User entity (including passwordHash, tokens) returned in GET endpoints, password only requires 8+ characters.
**Severity:** critical

## Findings

### F-001: Passwords Stored in Plain Text

The `CreateUserCommand` handler passes the raw password string directly as `passwordHash`:

```ts
// create-user.command.ts
const user = User.create({
  email: data.email,
  passwordHash: data.password,  // ← raw password, NOT hashed
  name: data.name,
});
```

No hashing utility exists in the codebase. The field is named `passwordHash` but contains the original password.

**OWASP Ref:** A02:2021 — Cryptographic Failures

### F-002: Sensitive Data Leaked in API Responses

The `GET /users/:id` endpoint returns the full `User` entity via `toProps()` or direct serialization. This exposes:

- `passwordHash` (the raw password)
- `refreshToken`
- `refreshTokenExpiresAt`
- `passwordResetToken`
- `passwordResetExpiresAt`

```ts
// user.controller.ts — getById
const user = await this.queryBus.execute(new GetUserByIdQuery(id));
if (!user) throw NotFoundError(...);
return user;  // ← returns FULL User entity with all sensitive fields
```

The `GetUserByIdHandler` returns `User | null` directly from the repository with no field projection or response mapping.

**OWASP Ref:** A01:2021 — Broken Access Control

### F-003: Weak Password Validation

Current validation only checks minimum length:

```ts
// user.dto.ts
password: z.string().min(8)
```

No requirements for: uppercase, lowercase, digits, or special characters.

**Reference (notum-backend):** Uses regex requiring 8+ chars, 1 uppercase, 1 lowercase, 1 digit, 1 special character from `#?!@$%^&*-`.

### F-004: No Duplicate Email Check

`CreateUserCommand` does not verify if an email already exists before inserting. This relies entirely on a database unique constraint (if one exists), producing an unhandled Prisma error instead of a clean domain error.

### F-005: No Input Sanitization on `id` Parameter

`GET /users/:id` and `PATCH /users/:id` accept the `id` param as a raw string without UUID validation. Malformed IDs pass straight to Prisma, producing unhandled database errors.

### F-006: Controller Contains Error Logic

`UserController.getById()` checks for null and throws `NotFoundError` — this violates the hexagonal rule that controllers are thin adapters. The not-found check must move to `GetUserByIdHandler`.

```ts
// user.controller.ts — current (violates rule)
const user = await this.queryBus.execute(new GetUserByIdQuery(id));
if (!user) throw NotFoundError('User not found', ...);  // ← should be in handler
return user;
```

### Affected Files

| File | Role | Impact |
|---|---|---|
| `apps/api/src/modules/user/application/commands/create-user.command.ts` | Create handler | F-001: no hashing, F-004: no duplicate check |
| `apps/api/src/modules/user/application/user.dto.ts` | Zod schemas | F-003: weak password validation |
| `apps/api/src/modules/user/presentation/user.controller.ts` | HTTP layer | F-002: returns full entity, F-005: no id validation |
| `apps/api/src/modules/user/application/queries/get-user-by-id.query.ts` | Query handler | F-002: returns full User, no projection |
| `apps/api/src/modules/user/application/queries/get-user-by-email.query.ts` | Query handler | F-002: same issue |
| `apps/api/src/modules/user/domain/entities/user.entity.ts` | Domain entity | F-001: `create()` accepts raw password as hash |

### Execution Flow (Data Leakage)

1. Client calls `GET /users/:id`
2. Controller dispatches `GetUserByIdQuery`
3. Handler calls `repo.findById()` → Prisma loads ALL columns
4. Returns `User` entity with all props
5. NestJS serializes entire object → **passwordHash, tokens exposed in JSON**

### Execution Flow (Plain Text Password)

1. Client calls `POST /users` with `{ password: "abc12345" }`
2. Handler validates with Zod (passes — only checks min 8)
3. Calls `User.create({ passwordHash: "abc12345" })` — **no hashing**
4. Repository persists to DB with plain text in `passwordHash` column

## Proposed Remediation

### R-001: Add Password Hashing (bcryptjs)

- Add `bcryptjs` as a dependency
- Create `libs/shared/utils/src/lib/hash.util.ts` with `hashPassword()` and `comparePassword()`
- `CreateUserCommand` hashes password before passing to `User.create()`
- `User.create()` expects pre-hashed password (keep entity pure)
- **Effort:** S

### R-002: Add Response DTO / Projection

Two options:

**Option A: `toPublicProps()` method on User entity**
- Add a method that returns only safe fields: `{ id, email, name, createdAt, updatedAt }`
- Controller/query handler calls `user.toPublicProps()` before returning
- Simple, no new classes needed
- **Effort:** S

**Option B: Prisma `select` clause in repository**
- Repository methods accept a field projection parameter
- Sensitive fields never leave the DB layer
- More robust but more complex for current stage
- **Effort:** M

**Recommended: Option A** — simpler, matches current architecture. Can evolve to Option B when needed.

### R-003: Strong Password Validation

- Add `PASSWORD_REGEX` constant: `/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/`
- Create `PasswordSchema` using `z.string().regex(PASSWORD_REGEX, errorMessage)`
- Use in `CreateUserSchema` and any future password-change schema
- **Effort:** S

### R-004: Duplicate Email Check

- In `CreateUserCommand` handler, call `repo.findByEmail(data.email)` before creating
- If exists, throw `BadRequestError` with `UserErrorCode.EMAIL_TAKEN`
- Add `EMAIL_TAKEN = 'USER_EMAIL_TAKEN'` to `UserErrorCode`
- **Effort:** S

### R-005: Validate UUID Parameters

- In handlers that receive IDs, validate with `IdentifierValue.from(id)` before querying
- This already throws `BadRequestError` with `ErrorLayer.DOMAIN` (per SR-002 migration)
- Apply to: `GetUserByIdHandler`, `UpdateUserHandler`, `UpdateLastLoginHandler`, controller `getById`
- **Effort:** S

### R-006: Move Error Logic from Controller to Query Handler

- Move the null check + `NotFoundError` throw from `UserController.getById()` into `GetUserByIdHandler`
- Handler returns `User` (non-nullable) — throws if not found
- Controller becomes a one-liner: `return await this.queryBus.execute(...)`
- **Effort:** S

## Risks & Warnings

⚠️ **Existing data migration**
- If any users were created with plain-text passwords during development, they'll need to be re-created or manually hashed after R-001 is implemented.

⚠️ **Breaking change for tests**
- Password hashing is async (bcrypt) — `User.create()` callers and tests will need to account for the async hashing step.

## Dependencies

- `bcryptjs` package (for R-001)
- `@portfolio/shared/errors` (already in place for error handling)

## Test Strategy

- [ ] Unit test: hash utility produces valid bcrypt hash
- [ ] Unit test: CreateUserHandler stores hashed (not plain) password
- [ ] Unit test: GET /users/:id response does NOT contain passwordHash, refreshToken, etc.
- [ ] Unit test: weak passwords rejected (no uppercase, no digit, etc.)
- [ ] Unit test: duplicate email returns proper error
- [ ] Unit test: invalid UUID param returns BadRequestError

## Estimated Complexity

M (Medium)

**Reasoning:** 5 individual fixes, each small, but together they touch handlers, entity, schemas, tests, and require a new dependency. All fixes are straightforward with no architectural changes.

## Status

done

## Created

2026-02-18
