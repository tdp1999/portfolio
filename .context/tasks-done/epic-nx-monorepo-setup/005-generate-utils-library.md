# Task: Generate Utils Shared Library

## Status: completed

## Goal

Create a shared TypeScript library for utility functions used across all apps.

## Context

The utils library contains helper functions like date formatting, validation, string manipulation, etc. It must remain framework-agnostic (no Angular or NestJS dependencies) so both apps can use it.

## Acceptance Criteria

- [ ] Library generated in `libs/utils/`
- [ ] Importable as `@portfolio/utils`
- [ ] Library is buildable
- [ ] `nx build utils` succeeds
- [ ] No framework dependencies (pure TypeScript)

## Technical Notes

```bash
nx g @nx/js:lib utils --buildable --directory=libs/utils
```

Use `@nx/js` generator for framework-agnostic TypeScript library.

Add placeholder utility:

```typescript
// libs/utils/src/lib/utils.ts
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}
```

## Files to Touch

- libs/utils/\*
- tsconfig.base.json (path mapping added)

## Dependencies

- 001-init-nx-workspace

## Complexity: S
