# Task: Tag Module - Zod DTOs

## Status: pending

## Goal

Create Zod validation schemas for Tag operations.

## Context

Simple DTOs - just name for create/update, query options for list.

## Acceptance Criteria

- [ ] `CreateTagSchema` - name required
- [ ] `UpdateTagSchema` - name required
- [ ] `TagQuerySchema` - pagination, sorting
- [ ] TypeScript types inferred
- [ ] Unit tests for validation

## Technical Notes

```typescript
export const CreateTagSchema = z.object({
  name: z.string().min(1).max(50).trim(),
});

export const UpdateTagSchema = z.object({
  name: z.string().min(1).max(50).trim(),
});

export const TagQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(['name', 'createdAt']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type CreateTagDto = z.infer<typeof CreateTagSchema>;
export type UpdateTagDto = z.infer<typeof UpdateTagSchema>;
export type TagQueryDto = z.infer<typeof TagQuerySchema>;
```

## Files to Touch

- apps/api/src/modules/tag/application/tag.dto.ts
- apps/api/src/modules/tag/application/tag.dto.spec.ts

## Dependencies

- 058-tag-domain-entity

## Complexity: S

## Progress Log
