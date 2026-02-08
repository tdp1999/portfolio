# Task: Tag Module - Module Wiring + Verify

## Status: pending

## Goal

Wire all Tag components and verify complete module works end-to-end.

## Context

Final task for Tag module. This completes the first "real" content module.

## Acceptance Criteria

- [ ] `TagModule` created with all providers
- [ ] Repository registered with DI token
- [ ] All command/query handlers registered
- [ ] Controller registered
- [ ] Module imported in AppModule
- [ ] E2E test: Full CRUD cycle via API
- [ ] All Tag module tests pass
- [ ] Document the module pattern for future modules

## Technical Notes

```typescript
@Module({
  imports: [CqrsModule],
  controllers: [TagController],
  providers: [
    { provide: TAG_REPOSITORY, useClass: TagRepository },
    // Commands
    CreateTagHandler,
    UpdateTagHandler,
    DeleteTagHandler,
    // Queries
    GetTagByIdHandler,
    GetTagBySlugHandler,
    ListTagsHandler,
  ],
  exports: [TAG_REPOSITORY],
})
export class TagModule {}
```

E2E verification:

1. POST /api/tags → 201, returns id
2. GET /api/tags/:id → 200, returns tag
3. GET /api/tags/slug/:slug → 200, returns tag
4. PATCH /api/tags/:id → 200
5. DELETE /api/tags/:id → 204
6. GET /api/tags/:id → 404

## Files to Touch

- apps/api/src/modules/tag/tag.module.ts
- apps/api/src/modules/tag/index.ts
- apps/api/src/app.module.ts

## Dependencies

- 063-tag-controller

## Complexity: S

## Progress Log
