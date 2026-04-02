# Layer-Specific Test Rules

Detailed rules for what each DDD layer owns in terms of testing.
The Single Owner Rule applies across all layers: if a behavior is tested at one layer, it must NOT be retested at another.

## Entity / Value Object Layer

**Purpose:** Domain business logic, invariants, state machine.

**Test these:**
- Factory method defaults (e.g., `availability ?? 'EMPLOYED'`) -- these are YOUR business decisions
- Factory method ID generation and audit field setup (UUID format, createdAt/updatedAt set)
- Computed properties with branching logic (e.g., `isOpenToWork` with multiple conditions)
- Domain guards (reject self-referencing parent, reject circular hierarchy)
- State transitions (soft delete, restore, publish, archive)
- Nullable field clearing via `!== undefined` pattern -- this is a conscious design choice
- Immutability invariant (mutation returns new instance) -- test ONCE per entity, not per method
- Value object validation rules (Email format, Slug generation, money calculations)

**Skip these:**
- `load()` / `fromProps()` -- pure reconstitution, no logic
- `toProps()` -- shallow copy, no computation
- Getters that return `this.props.x` -- property access is not logic
- Spread operator preserving fields -- trust JavaScript
- Testing every optional field stores correctly when provided -- this is field assignment
- Constructor parameter passing -- trust the language
- Testing the same default multiple ways (e.g., separate test for "with defaults" and "without optional fields")

**Consolidation tips:**
- Merge "generates UUID" + "sets audit fields" + "applies defaults" into ONE test
- For nullable clearing, test 2-3 representative fields in one test, not every nullable field separately
- For immutability, one test proving the pattern is enough -- all mutation methods use `new Entity({...})`

## DTO / Schema Layer

**Purpose:** Input validation, shape definition, custom transforms.

**Test these:**
- Schema shape: which fields are required vs optional
- YOUR custom transforms (stripHtml, trim, slug generation in schema)
- YOUR custom refinements (nonEmptyPartial rejects `{}`, cross-field validation)
- Default values defined in schema
- Required field missing -> returns error (tests YOUR schema design decisions)

**Skip these:**
- `z.string().max(100)` works -- trust Zod
- `z.coerce.number()` coerces -- trust Zod
- `z.enum(['A','B'])` rejects 'C' -- trust Zod
- `z.email()` validates email format -- trust Zod
- Each enum value individually accepted -- trust Zod
- Boundary values for Zod built-in validators (exactly 100 chars, 101 chars) -- trust Zod

**Consolidation tips:**
- One test for "accepts valid input with all required fields" that also checks defaults
- One test per custom transform
- One test for "rejects when required field X missing" (pick the most important 1-2, not all)

## Command / Handler Layer

**Purpose:** Orchestration -- the sequence of steps and branching.

**Test these:**
- Happy path: the full sequence (validate -> find -> check -> save -> return)
- Each error branch: not found, duplicate name, hierarchy violation, permission denied
- Edge cases in orchestration: "update with same name allowed for self"
- Repo method call verification (was `save()` called with correct entity?)
- Cross-entity coordination (e.g., check parent exists before assigning)

**Skip these:**
- Input validation -- DTO spec owns this. Command receives already-parsed data.
- Domain rules -- Entity spec owns these. Command just calls `entity.doSomething()`.
- "Should reject invalid DTO" -- this test belongs in DTO spec
- Retesting what entity.create() returns -- Entity spec owns that

**Mock strategy:**
- Mock repository interface (not implementation)
- Mock entity factory if needed, but prefer real entity instances when possible
- Single describe block for all commands in a CRUD module, shared mock setup

## Query / Handler Layer

**Purpose:** Data retrieval composition.

**Test these:**
- Filter composition logic (when filters combine)
- Sort parameter handling
- Pagination edge cases (page 0, negative, beyond total)
- Not-found scenarios that return error (if handler throws instead of returning null)
- Presenter/response mapping IF it has logic (computed fields)

**Skip these:**
- Simple `findById` pass-through -- no orchestration to test
- `findAll` with no filters -- just a repo call
- Testing that Prisma query returns correct data -- that's integration/E2E territory

## Mapper Layer

**Default: NO tests.** E2E catches mapping bugs implicitly.

**Exception -- test ONLY when mapper has computation:**
- Decimal string -> number conversion
- Nested relation flattening into flat DTO
- Computed fields (combining first+last name, calculating age from DOB)
- Enum/status mapping with logic

**Never test:**
- `entity.name -> dto.name` (field copy)
- `entity.createdAt -> dto.createdAt` (field copy)
- Any mapping that is purely structural (same field name, same type)

## Controller Layer

**NO unit tests. Ever.**

Controllers in this project are thin transport adapters:
1. Extract input from request (`@Body()`, `@Param()`, `@Query()`)
2. Dispatch to command/query bus
3. Return the result

No validation, no error throwing, no business logic. E2E tests cover the full HTTP cycle.

## Cross-Layer Ownership Cheat Sheet

| Behavior | Owner | NOT here |
|---|---|---|
| Field required/optional | DTO | Entity, Command |
| String max length | DTO (if custom), else SKIP | Anywhere |
| HTML stripping | DTO (if in schema) or Entity (if in factory) | Both |
| Duplicate name rejection | Command (needs repo) | Entity |
| Hierarchy depth limit | Entity (domain rule) | Command (unless needs repo lookup) |
| Soft delete guard (has children) | Command (needs repo to check) | Entity |
| Response field presence | E2E | Mapper, Controller |
| Auth/permission check | Command or Guard | Controller |
