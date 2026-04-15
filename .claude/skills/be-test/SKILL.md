---
name: be-test
description: >
  Backend test writer for NestJS/DDD modules. Analyzes source code to identify REAL logic
  (business rules, transforms, branching, orchestration) vs non-logic (field assignment, getters,
  framework behavior), then writes focused tests that only cover what matters. Activates when
  writing or reviewing backend .spec.ts files in apps/api/src/modules/. Also activates when
  a task's acceptance criteria involve writing BE tests, or when /ctx:task discovers this skill
  via fallback. Use this skill whenever creating, updating, or auditing backend test files --
  even if the user just says "write tests for profile entity" without mentioning the skill name.
---

# BE Test Writer - Focused Backend Tests for DDD Modules

Write backend tests that cover real logic and nothing else. The core problem this skill solves:
tests that check field assignment, spread operators, or framework behavior waste development time,
tokens, and create noise. Every test must justify its existence.

## Activation

- When creating or updating `*.spec.ts` files inside `apps/api/src/modules/`
- When a task AC involves writing BE unit or integration tests
- On explicit `/be-test` invocation
- When invoked by `/ctx:task` via specialized skill reference or fallback discovery

## Input

`$ARGUMENTS` - One of:
- **File path**: `apps/api/src/modules/profile/domain/entities/profile.entity.ts`
- **Module name**: `profile` (skill scans the module for testable files)
- **Empty**: asks user which file or module to test

When a module name is given, scan for files that need tests based on layer priority:
1. `domain/entities/*.ts` and `domain/value-objects/*.ts` (highest value)
2. `application/dto/*.ts` or `application/*.dto.ts`
3. `application/commands/*.ts`
4. `application/queries/*.ts`
5. `infrastructure/mapper/*.ts` (only if mapping has logic)

Skip: controllers (thin adapters), repository implementations (CRUD wrappers), index files.

## Core Workflow: Analyze -> Plan -> Write -> Validate

**MANDATORY OUTPUT GATES.** Steps 1, 2, and 4 each require a structured output block in your reply to the user. These are not mental exercises — they are deliverables. Skipping any of them (including when the user says "go ahead", "bắt đầu", "start", or similar) is a skill violation. A generic "start" message does NOT authorize skipping Step 2's approval gate.

### Step 1: Analyze the Source

**REQUIRED OUTPUT:** You MUST produce the analysis table below in your reply before moving to Step 2. Do not proceed silently.

Read the source file and classify every method/property into one of two buckets:

**LOGIC (test this):**
- Business rules and guards (`if availability === X && openTo.length > 0`)
- Computed/derived properties (`get isOpenToWork`)
- State transitions with conditions
- Custom transforms (strip HTML, generate slug, format)
- Factory defaults that represent business decisions (`availability ?? 'EMPLOYED'`)
- Nullable field clearing pattern (`!== undefined` checks -- a conscious design choice)
- Orchestration flow with branching (find -> check duplicate -> validate -> save)
- Error conditions that represent business rules

**NO-LOGIC (skip this):**
- Getters that return `this.props.x` -- just property access
- `load()` / `fromProps()` that does `new Entity(props)` -- no transformation
- `toProps()` / `toResponse()` that copies fields -- no computation
- Spread operator preserving unchanged fields -- trust JavaScript
- Field assignment in constructors -- trust the language
- Framework behavior: Zod validates max length, Prisma maps types, NestJS DI resolves
- Same rule already tested at another layer (Single Owner Rule)

Present the analysis as a brief table:

```
## Analysis: profile.entity.ts (Entity layer)

| Method/Property    | Classification | Reason                                    |
|--------------------|---------------|-------------------------------------------|
| create() defaults  | LOGIC         | Business defaults: availability='EMPLOYED' |
| create() UUID+audit| LOGIC         | Factory generates ID and timestamps        |
| load()             | NO-LOGIC      | Pure reconstitution, no transformation     |
| update() nullable  | LOGIC         | !== undefined pattern for nullable fields  |
| update() spread    | NO-LOGIC      | JS spread preserving unchanged fields      |
| updateAvatar()     | NO-LOGIC      | Single field override, no branching        |
| isOpenToWork       | LOGIC         | Multi-condition business rule              |
| toProps()          | NO-LOGIC      | Shallow copy, no computation               |
```

### Step 2: Plan Test Cases

**REQUIRED OUTPUT + STOP:** You MUST produce BOTH lists below in your reply AND wait for explicit user approval ("ok", "approve", "yes", "go") of the plan itself before writing any spec file. A prior generic message like "bắt đầu" or "start the task" does NOT count as plan approval — the user hasn't seen the plan yet at that point. After you post the plan, stop and wait.

Apply the **Single Owner Rule**: each behavior has exactly ONE test that owns it.

Read `references/layer-rules.md` to determine what belongs at the current layer vs another layer.

Present TWO lists and **wait for user approval before writing**:

**WILL test (with owner justification):**
```
1. create() - UUID v7 format + audit timestamps + defaults (3-in-1 test)
   Owner: Entity -- factory logic belongs here
2. update() - nullable field clearing (phone, timezone -> null)
   Owner: Entity -- !== undefined is entity-level design
3. isOpenToWork - 5 branches (OPEN_TO_WORK, EMPLOYED+openTo, EMPLOYED+empty, FREELANCING, NOT_AVAILABLE)
   Owner: Entity -- computed business property
4. Immutability - mutation returns new instance
   Owner: Entity -- architectural invariant (test once, not per-method)
```

**Will NOT test (with reason):**
```
- load() reconstitution -> NO-LOGIC: just new Profile(props)
- update() preserves unchanged fields -> NO-LOGIC: tests JS spread
- updateAvatar()/updateOgImage() -> NO-LOGIC: single field override, no branching
- Getters -> NO-LOGIC: return this.props.x
- toProps() -> NO-LOGIC: shallow copy
- create() stores provided JSON fields -> NO-LOGIC: tests field assignment
```

**Expected test count:** ~10-12 (vs ~22 if testing everything)

### Step 3: Write Tests

After user approves the plan, write the `.spec.ts` file following these conventions:

**File conventions:**
- Co-located next to source: `profile.entity.spec.ts` beside `profile.entity.ts`
- AAA pattern: Arrange -> Act -> Assert (with comments only when blocks are complex)
- Descriptive test names: `it('should return true when EMPLOYED with non-empty openTo')`
- One clear assertion goal per test (related assertions in the same test are fine)

**Structure conventions:**
- Entity tests: group by behavior (`describe('create()')`, `describe('isOpenToWork')`)
- DTO tests: group by schema (`describe('CreateProfileSchema')`)
- Command tests: single file for all commands, shared mock setup
- Query tests: single file, focus on filter/sort/pagination logic

**Test data:**
- Define minimal valid fixtures at the top of describe block
- Only include fields relevant to the test -- don't copy 30-field objects when testing 1 field
- Use UUID constants for referential fields

**Import patterns (this project):**
```typescript
import { DomainError } from '@portfolio/shared/errors';
// DomainError has private constructor -- use:
await expect(...).rejects.toBeInstanceOf(DomainError);
// NOT: .rejects.toThrow(DomainError)

// Value object validation tests can use:
expect(() => ...).toThrow('expected message string');
```

### Step 4: Validate

**REQUIRED OUTPUT:** You MUST produce the Validation Report block below in your reply BEFORE claiming the tests are done or moving on to other AC items. This is not a mental checklist — it is a deliverable. If you skip it, you have not completed the skill's workflow.

Cross-check every test against the checklist in `references/validation-checklist.md`, then output this exact block:

```
## Validation Report

**Waste check** (what breaks if each test is deleted?):
- <test name> -> <what it catches, or FLAG FOR REMOVAL>
- ...

**Owner check** (any duplicate behavior covered at another layer?):
- <finding, or "none">

**Anti-pattern check** (any test in the NOT-to-test list?):
- <finding, or "none">

**Budget check:**
- Test count: <N>
- Module type + layer: <e.g., CRUD commands>
- Budget: <range from below>
- Status: <within / over / under — if over, list which to remove>

**Actions taken:**
- <tests removed and why, or "no changes needed">
```

Budget reference:
- CRUD module entity: 5-10 tests
- CRUD module DTO: 6-10 tests
- CRUD module commands (all): 8-12 tests
- CRUD module queries (all): 3-5 tests
- Complex module: multiply by 1.5-2x

If any test fails validation, remove it and note why in Actions taken.

## Handling Existing Test Files

When a `.spec.ts` already exists, ask the user:
- **Rewrite**: Analyze source fresh, write from scratch following this workflow
- **Audit**: Read existing tests, flag waste/duplicates, suggest removals, keep good tests

For audit mode, present findings as:
```
## Audit: profile.entity.spec.ts

KEEP (6 tests):
- create() defaults -- tests YOUR business defaults [line 76-91]
- isOpenToWork x5 -- tests YOUR business logic [line 209-238]

REMOVE (8 tests):
- load() reconstitution [line 113-128] -- NO-LOGIC: just returns what you put in
- create() field assignment [line 60-72] -- NO-LOGIC: tests that userId = userId
- update() preserves unchanged [line 131-140] -- NO-LOGIC: tests JS spread
...

ADD (2 tests):
- update() nullable clearing -- LOGIC not currently tested
- Immutability -- architectural invariant, test once

Net: 22 tests -> 12 tests (-10 waste)
```

## Layer-Specific Quick Reference

For detailed rules per layer, see `references/layer-rules.md`.

| Layer | Test file pattern | What to test | Skip |
|---|---|---|---|
| Entity/VO | `entity.spec.ts` | Business rules, guards, computed props, factory defaults | load(), toProps(), getters, field assignment |
| DTO | `dto.spec.ts` | Schema shape, custom transforms, required vs optional | Zod built-in validation, type coercion |
| Command | `commands.spec.ts` | Orchestration branches, error paths, repo call sequence | Validation (DTO owns), domain rules (Entity owns) |
| Query | `queries.spec.ts` | Filter/sort composition, pagination edges, not-found | Simple findById pass-through |
| Mapper | `mapper.spec.ts` | Computed fields, type conversion, nested merging | Field-to-field copy (E2E catches this) |
| Controller | **NO TESTS** | -- | Everything (thin adapter, E2E covers) |
