# Task: Create Shared Value Objects

## Status: pending

## Goal

Create reusable value objects for IDs, timestamps, and slugs.

## Context

Building blocks for all domain entities. Encapsulate validation and generation logic.

## Acceptance Criteria

- [ ] `IdentifierValue` with UUID v7 generation
- [ ] `TemporalValue` with `now` and ISO handling
- [ ] `SlugValue` with URL-safe generation from text
- [ ] All are immutable
- [ ] Unit tests for each
- [ ] Slug handles unicode, special chars

## Technical Notes

```typescript
// UUID v7 for time-ordered IDs
export class IdentifierValue {
  static v7(): string {
    return uuidv7();
  }
  static from(id: string): string {
    /* validate */
  }
}

// Slug generation
export class SlugValue {
  static from(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
```

Install: `uuid` package with v7 support or `uuidv7`.

## Files to Touch

- libs/types/src/value-objects/identifier.value.ts
- libs/types/src/value-objects/temporal.value.ts
- libs/types/src/value-objects/slug.value.ts
- libs/types/src/value-objects/index.ts
- libs/types/src/index.ts
- Unit test files

## Dependencies

None (can parallel with 043)

## Complexity: S

## Progress Log
