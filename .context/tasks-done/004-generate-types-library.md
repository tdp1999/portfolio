# Task: Generate Types Shared Library

## Status: completed

## Goal

Create a shared TypeScript library for types and interfaces used across all apps.

## Context

The types library contains TypeScript interfaces and types shared between Angular landing, NestJS API, and future dashboard. It must remain framework-agnostic (no Angular or NestJS dependencies).

## Acceptance Criteria

- [ ] Library generated in `libs/types/`
- [ ] Importable as `@portfolio/types`
- [ ] Library is buildable
- [ ] `nx build types` succeeds
- [ ] No framework dependencies (pure TypeScript)

## Technical Notes

```bash
nx g @nx/js:lib types --buildable --directory=libs/types
```

Use `@nx/js` generator for framework-agnostic TypeScript library.

Add placeholder interface:

```typescript
// libs/types/src/lib/types.ts
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## Files to Touch

- libs/types/\*
- tsconfig.base.json (path mapping added)

## Dependencies

- 001-init-nx-workspace

## Complexity: S
