# Epic: Type Change Management Workflow

## Problem Statement

When type definitions in `libs/types` are changed, added, or deleted, developers must manually update corresponding mock factories in `libs/shared/testing`. This manual process is:

- Time-consuming and error-prone
- Breaks type safety if factories get out of sync
- Requires remembering to update tests, exports, and validation

## Solution Overview

Create an automated workflow using a custom Nx generator that:

1. Analyzes type definitions using TypeScript Compiler API
2. Automatically generates/updates/deletes mock factories
3. Validates changes across the entire monorepo
4. Ensures type safety with automated testing

## User Requirements

1. **Automatic mock synchronization** - Type changes automatically update corresponding factories
2. **Type-check validation** - Validate all consuming code after changes
3. **Direct editing workflow** - Edit types directly, then run a single command to sync

## High-Level Architecture

### Custom Nx Generator at `tools/generators/sync-types/`

**Flow:**

```
Developer edits types → Run `pnpm sync-types` → Generator analyzes types →
Updates/creates factories → Runs tests → Type-checks consumers → Reports status
```

**Components:**

1. **Type Analyzer** - Parse TypeScript AST, extract interfaces, detect changes
2. **Factory Generator** - Generate code matching existing factory patterns
3. **Test Generator** - Generate test files for factories
4. **Validator** - Run tests and type-checking across monorepo

## Developer Workflow

```bash
# 1. Edit types directly
# Add/modify/delete interfaces in libs/types/src/lib/types.ts

# 2. Run sync command
pnpm sync-types

# 3. Review generated changes
git diff libs/shared/testing/

# 4. Commit if satisfied
git commit -m "feat(types): add new field"
```

## Implementation Breakdown

### Phase 1: Core Generator Setup

**Goal:** Basic infrastructure and simple type analysis

- [ ] Create Nx generator file structure at `tools/generators/sync-types/`
- [ ] Implement basic type analyzer using TypeScript Compiler API
- [ ] Parse simple interfaces (string, number, boolean properties)
- [ ] Implement basic factory generator
- [ ] Test with existing `Project` type
- [ ] Verify generated code matches existing pattern

**Files to create:**

- `tools/generators/sync-types/index.ts`
- `tools/generators/sync-types/type-analyzer.ts`
- `tools/generators/sync-types/factory-generator.ts`
- `tools/generators/sync-types/schema.json`
- `tools/generators/sync-types/schema.d.ts`

### Phase 2: Complete Type Analysis

**Goal:** Handle all TypeScript features used in the project

- [ ] Handle inheritance (`extends BaseEntity`)
- [ ] Handle optional properties (`imageUrl?: string`)
- [ ] Handle array types (`string[]`, `Project[]`)
- [ ] Handle Date types
- [ ] Implement change detection with `.type-sync-cache.json`
- [ ] Test with all existing types (Project, Experience, BlogPost)

**Files to update:**

- `tools/generators/sync-types/type-analyzer.ts`

### Phase 3: Test Generation

**Goal:** Auto-generate test files matching existing patterns

- [ ] Generate test files matching existing pattern
- [ ] Test default values
- [ ] Test override functionality
- [ ] Test plural factory with unique IDs
- [ ] Ensure 100% coverage for generated factories
- [ ] Verify all existing tests still pass

**Files to create:**

- `tools/generators/sync-types/test-generator.ts`

### Phase 4: Validation & Polish

**Goal:** Production-ready with full validation

- [ ] Implement validation flow (run factory tests)
- [ ] Implement type-checking across all consuming projects
- [ ] Add CLI options: `--dry-run`, `--force`, `--skip-validation`, `--type=<name>`
- [ ] Error handling and user-friendly messages
- [ ] Handle edge cases: deletions, type renames, complex types
- [ ] Update `package.json` with `sync-types` script
- [ ] Register generator in `nx.json`

**Files to create:**

- `tools/generators/sync-types/validators.ts`

**Files to modify:**

- `package.json`
- `nx.json`
- `.gitignore` (optional)

### Phase 5: Documentation & Testing

**Goal:** Complete documentation and verified workflow

- [ ] Update CLAUDE.md with new workflow
- [ ] Add inline code comments to generated files
- [ ] Create troubleshooting guide
- [ ] Write tests for the generator itself
- [ ] Verify all test scenarios (add/modify/delete types)

## Technical Details

### Factory Generation Pattern

Generated factories must match existing pattern:

```typescript
export function createMock{Entity}(overrides?: Partial<{Entity}>): {Entity} {
  const now = new Date();
  return {
    // Default values based on property types
    id: '1',
    createdAt: now,
    updatedAt: now,
    // Entity-specific properties
    ...overrides,
  };
}

export function createMock{Entities}(
  count: number,
  overrides?: Partial<{Entity}>
): {Entity}[] {
  return Array.from({ length: count }, (_, i) =>
    createMock{Entity}({
      id: String(i + 1),
      ...overrides,
    })
  );
}
```

### Default Value Rules

| Type               | Default Value       | Example                        |
| ------------------ | ------------------- | ------------------------------ |
| `string`           | `'Mock {PropName}'` | `title: 'Mock Title'`          |
| `number`           | `0`                 | `views: 0`                     |
| `boolean`          | `false`             | `published: false`             |
| `Date`             | `now`               | `createdAt: now`               |
| `string[]`         | `['TypeScript']`    | `technologies: ['TypeScript']` |
| Union `'a' \| 'b'` | first value         | `status: 'draft'`              |

**Special properties:**

- `id` → `'1'` for single, `'1', '2', '3'...` for plural
- `createdAt`/`updatedAt` → `now`

### Edge Cases

1. **New type added** → Generate new factory + test + export
2. **Type deleted** → Delete factory + test + remove export
3. **Type modified** → Update factory with new properties
4. **Inheritance** → Resolve `extends`, include inherited properties
5. **Optional properties** → Provide sensible defaults
6. **Complex types** (generics, advanced unions) → Skip with warning

## Verification Scenarios

### Test 1: Add New Type

```typescript
// Add to libs/types/src/lib/types.ts
export interface Skill extends BaseEntity {
  name: string;
  level: number;
}
```

- Run `pnpm sync-types`
- Verify factory created at `libs/shared/testing/src/lib/factories/skill.factory.ts`
- Verify test created at `skill.factory.spec.ts`
- Verify export added to `index.ts`
- Run `nx test shared-testing` → pass

### Test 2: Modify Existing Type

```typescript
// Add to Project interface
priority?: number;
```

- Run `pnpm sync-types`
- Verify `project.factory.ts` includes `priority: 0`
- Run `nx test shared-testing` → pass

### Test 3: Delete Type

- Remove `BlogPost` from types.ts
- Run `pnpm sync-types`
- Verify `blog-post.factory.ts` and test deleted
- Verify export removed from index.ts

### Test 4: Breaking Change Detection

```typescript
// Change Project.title from string to number
title: number;
```

- Run `pnpm sync-types`
- Should fail type-check with clear error

## Commands

```bash
# Standard sync
pnpm sync-types

# Preview changes (no file writes)
pnpm sync-types --dry-run

# Force regeneration (ignore cache)
pnpm sync-types --force

# Skip validation (faster)
pnpm sync-types --skip-validation

# Sync specific type
pnpm sync-types --type=Project
```

## Success Criteria

- Adding/modifying/deleting a type takes < 2 minutes total
- Breaking changes caught immediately by validation
- Generated code exactly matches existing patterns
- Factory tests maintain 100% coverage
- Works for 95%+ of common TypeScript patterns
- Clear error messages when validation fails

## Risks & Mitigation

| Risk                               | Mitigation                                   |
| ---------------------------------- | -------------------------------------------- |
| Generator bugs create invalid code | Extensive testing, dry-run mode, code review |
| Complex types not handled          | Clear docs on manual factory creation        |
| Windows path issues                | Use `path.join()`, test on Windows           |
| Merge conflicts                    | Use Prettier for deterministic formatting    |

## Dependencies

- TypeScript Compiler API (already available)
- Nx workspace generators (already available)
- Existing type definitions in `libs/types`
- Existing factory pattern in `libs/shared/testing`

## Out of Scope

- Schema-based code generation (OpenAPI, JSON Schema)
- Rename detection (requires manual intervention)
- Runtime validation of types
- Migration scripts for existing code

## Notes

This epic can be broken down into tasks using the `/breakdown` skill when ready to implement.
