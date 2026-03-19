# Testing Guide

> **Single source of truth for all testing patterns and TDD workflow.**
> Referenced from: CLAUDE.md, patterns-architecture.md, vision.md

## Core Principle: Each Behavior Tested Once, at the Right Layer

Every test must answer: **"What breaks if I remove this test?"** If the answer is "nothing, another test catches it" — delete it.

```
DON'T test framework behavior (Zod validates max, Prisma maps types)
DON'T test the same rule at multiple layers
DO    test YOUR business logic, YOUR transforms, YOUR orchestration
DO    prefer E2E over many unit tests for CRUD modules
```

## Test-Driven Development (TDD)

### Workflow

```
Red → Green → Refactor
1. Write failing test for feature/fix
2. Write minimal code to pass test
3. Delegate test execution to test-runner subagent
4. Refactor while keeping tests green
5. Commit with tests included
```

### Coverage Targets

| Area                      | Target   | Notes                  |
| ------------------------- | -------- | ---------------------- |
| Business logic (services) | 80-90%   | Core application logic |
| API endpoints             | 90%+     | All routes tested      |
| Complex components        | 70-80%   | Interactive UI         |
| Utilities                 | 90%+     | Pure functions         |
| Simple UI components      | Optional | Focus on E2E instead   |

### Test Organization

- **Co-located tests:** `.spec.ts` files next to source files
- **AAA Pattern:** Arrange → Act → Assert
- **One assertion per test:** Keep tests focused
- **Descriptive names:** `it('should return 404 when project not found')`

### Testing Stack

| Type              | Tool            | Notes                             |
| ----------------- | --------------- | --------------------------------- |
| Unit/Integration  | Jest            | Configured in workspace           |
| Component Testing | Angular TestBed | Signal-based component testing    |
| E2E               | Playwright      | playwright-skill plugin available |
| API Testing       | Supertest       | For NestJS endpoints              |

---

## Backend Module Test Standard

### The Single-Owner Rule

Each behavior has exactly ONE test that owns it. Use this table to decide WHERE to test:

| What you're testing | Owner layer | NOT here |
|---|---|---|
| Field required/optional, min/max, type coercion | DTO spec | Entity, Command |
| Custom transforms (HTML strip, trim, slug) | DTO spec or Entity spec | Both |
| Domain business rules (hierarchy, guards, state) | Entity spec | Command (unless integration-only) |
| Orchestration (find → validate → save) | Command spec | Entity |
| Query composition, filters, sorting | Query spec | — |
| Full request → response cycle | E2E spec | Unit tests |
| Data mapping correctness | E2E spec (implicit) | Mapper spec (only if complex) |

### Test Budget per Module Type

#### CRUD Module (Tag, Category, Skill-like)

| Layer | File(s) | Tests | What to test |
|---|---|---|---|
| Entity | `entity.spec.ts` | 5-10 | Business logic ONLY: state transitions, guards, validations that live in the entity |
| DTO | `dto.spec.ts` | 6-10 | Schema shape, custom transforms, boundary values that YOU defined |
| Commands | `commands.spec.ts` (single file) | 8-12 | Orchestration: happy path + each error branch per command |
| Queries | `queries.spec.ts` (single file) | 3-5 | Filter/sort logic, pagination edge cases |
| Mapper | `mapper.spec.ts` | 0-2 | ONLY if mapping has logic (computed fields, type conversion). Skip for pure field copy. |
| E2E | `*.spec.ts` | 8-12 | Full CRUD flow, auth, validation errors, edge cases |
| **Total** | **4-6 files** | **30-50** | — |

#### Complex Module (Auth, multi-step workflows)

Higher test count is justified when there is real branching logic. Apply same single-owner rule.

### What NOT to Test (Anti-patterns)

```
❌ z.string().max(100) works          → Trust Zod
❌ z.coerce.number() coerces          → Trust Zod
❌ z.enum(['A','B']) rejects 'C'      → Trust Zod
❌ Prisma maps field A to column A    → Trust Prisma
❌ entity.load() returns what you put in → No logic, just assignment
❌ toProps() returns a copy            → Trivial
❌ "reject invalid dto" in command spec → DTO spec already covers
❌ Same domain rule in entity AND command spec → Pick one owner
```

### What TO Test

```
✅ stripHtmlTags() actually strips    → YOUR transform
✅ Slug generated from name           → YOUR logic
✅ nonEmptyPartial rejects {}         → YOUR refinement (test once in DTO)
✅ assignParent rejects circular ref  → YOUR business rule (entity)
✅ Delete rejects when hasChildren    → YOUR guard (command, needs repo mock)
✅ Update with same name allowed      → YOUR orchestration edge case
✅ Create → List → Update → Delete    → YOUR API contract (E2E)
```

### DTO Test Pattern

Test the SCHEMA SHAPE and YOUR CUSTOM LOGIC only:

```typescript
describe('CreateSkillSchema', () => {
  // ✅ Schema shape — what's required vs optional, what defaults apply
  it('should accept required fields with correct defaults', () => {
    const result = CreateSkillSchema.safeParse({ name: 'React', category: 'TECHNICAL' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isLibrary).toBe(false);    // YOUR default
      expect(result.data.displayOrder).toBe(0);      // YOUR default
    }
  });

  // ✅ YOUR custom transform
  it('should strip HTML and trim name', () => {
    const result = CreateSkillSchema.safeParse({ name: ' <b>React</b> ', category: 'TECHNICAL' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.name).toBe('React');
  });

  // ✅ Required field missing — tests YOUR schema design
  it('should reject when category is missing', () => {
    expect(CreateSkillSchema.safeParse({ name: 'React' }).success).toBe(false);
  });

  // ❌ DON'T: "should reject name over 100 chars" — tests z.max(100)
  // ❌ DON'T: "should coerce string to number"     — tests z.coerce
  // ❌ DON'T: "should accept all enum values"       — tests z.enum
});
```

### Entity Test Pattern

Test BUSINESS LOGIC and STATE TRANSITIONS only:

```typescript
describe('Skill Entity', () => {
  // ✅ Factory produces valid state with slug
  it('should create with generated slug and defaults', () => { ... });

  // ✅ Business rule: slug regeneration on name change
  it('should regenerate slug when name changes', () => { ... });

  // ✅ Business rule: nullable field clearing
  it('should clear nullable fields when set to null', () => { ... });

  // ✅ Domain guard — this is YOUR rule, not framework behavior
  it('should reject self as parent', () => { ... });
  it('should reject parent that already has a parent', () => { ... });

  // ✅ State transition
  it('should soft delete', () => { ... });
  it('should restore', () => { ... });

  // ❌ DON'T: "should load from props" — no logic
  // ❌ DON'T: "should return copy from toProps()" — trivial
  // ❌ DON'T: "should preserve id on update" — no logic, just spread
  // ❌ DON'T: "should create with all optional fields" — tests defaults, not logic
});
```

### Command Test Pattern

Test ORCHESTRATION — the sequence of repo calls and branching:

```typescript
// ✅ Single file for all CRUD commands — shared mock setup
describe('Skill Commands', () => {
  let repo: jest.Mocked<ISkillRepository>;
  // ... shared setup

  describe('CreateSkillHandler', () => {
    it('should create skill', () => { ... });
    it('should reject duplicate name', () => { ... });
    it('should validate parent hierarchy', () => { ... });
    // ❌ DON'T: "should reject invalid dto" — DTO spec owns this
  });

  describe('UpdateSkillHandler', () => {
    it('should update skill', () => { ... });
    it('should allow same name on self', () => { ... });
    it('should handle parent reassignment', () => { ... });
  });

  describe('DeleteSkillHandler', () => {
    it('should soft delete', () => { ... });
    it('should reject when has children', () => { ... });
    // ❌ DON'T: "should reject already deleted" — only if this is
    //    an orchestration concern (e.g., findById returns non-deleted only)
  });

  describe('RestoreSkillHandler', () => {
    it('should restore', () => { ... });
    it('should reject if parent deleted', () => { ... });
  });
});
```

### Mapper Test Pattern

**Default: NO mapper tests for pure field mapping.** E2E catches mapping bugs.

Only write mapper tests when mapping involves LOGIC:

```typescript
// ✅ Test if mapper computes/transforms something
it('should convert decimal string to number', () => { ... });
it('should merge nested relation into flat DTO', () => { ... });

// ❌ DON'T test: field A maps to field A (pure copy)
```

### E2E Test Pattern

**E2E is the highest-value test for CRUD modules.** It verifies the full stack: validation → handler → repo → DB → response shape.

```typescript
describe('Skill CRUD', () => {
  // Happy path — covers create, list, get, update, delete in sequence
  it('should create a skill', () => { ... });
  it('should list skills with filters', () => { ... });
  it('should get skill by id', () => { ... });
  it('should update a skill', () => { ... });
  it('should delete a skill', () => { ... });

  // Business rules that need real DB
  it('should reject delete when skill has children', () => { ... });
  it('should enforce parent hierarchy depth', () => { ... });

  // Error cases
  it('should return 400 for invalid input', () => { ... });
  it('should return 401 without auth', () => { ... });
  it('should return 409 for duplicate name', () => { ... });
});
```

---

## Pre-Test Checklist

Before writing tests for a new module, answer these questions:

1. **What business rules does this module have?** → Test those in entity
2. **What custom transforms/refinements are in the DTOs?** → Test those in DTO
3. **What orchestration branches exist in commands?** → Test those in commands
4. **Does the mapper have any logic?** → If no, skip mapper tests
5. **Is this a CRUD module?** → Lean heavily on E2E

## Automated Testing with Subagents

### test-runner subagent

- **Runs:** Tests for AFFECTED code only (uses `nx affected`)
- **Triggers:** Automatically after significant code changes when `auto_validation: enabled`
- **Output:** Pass/fail status with specific error locations

### build-validator subagent

- **Runs:** TypeScript type-check and build for AFFECTED projects
- **Triggers:** Automatically after feature completion when `auto_validation: enabled`
- **Output:** Type errors and build issues with file:line references

### Enabling Auto-Validation

Add frontmatter to `.context/vision.md`:

```yaml
---
auto_validation: enabled
---
```

### Post-Edit Hook

A post-edit hook in `.claude/settings.json` runs type-check after file edits:

```json
{
  "hooks": {
    "PostToolUse": [{ "matcher": "Edit|Write", ... }]
  }
}
```

## When Adding Tests

1. Place `.spec.ts` next to source file
2. Use descriptive test names
3. Mock external dependencies (API calls, databases)
4. Add `data-testid` attributes for E2E selectors
5. **Apply the Single-Owner Rule** — check the table above before writing
6. Run via test-runner subagent (don't run tests directly)

## Test Patterns

See `patterns-architecture.md` for detailed code patterns:

- AAA (Arrange-Act-Assert) structure
- API endpoint testing pattern
- Component testing pattern
- E2E testing pattern (Playwright)
- Test data factories
- Mock service pattern
