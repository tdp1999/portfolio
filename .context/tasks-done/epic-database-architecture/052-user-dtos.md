# Task: User Module - Zod DTOs

## Status: done

## Goal

Create Zod validation schemas for User operations.

## Context

DTOs validate incoming requests and provide TypeScript types.

## Acceptance Criteria

- [ ] `CreateUserSchema` with validation rules
- [ ] `UpdateUserSchema` for profile updates
- [ ] `LoginSchema` for authentication
- [ ] TypeScript types inferred from schemas
- [ ] Unit tests for validation edge cases

## Technical Notes

```typescript
export const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(100),
});

export type CreateUserDto = z.infer<typeof CreateUserSchema>;
```

## Files to Touch

- apps/api/src/modules/user/application/user.dto.ts
- apps/api/src/modules/user/application/user.dto.spec.ts

## Dependencies

- 050-user-domain-entity

## Complexity: S

## Progress Log
