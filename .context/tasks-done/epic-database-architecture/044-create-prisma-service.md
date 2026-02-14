# Task: Create PrismaService for NestJS

## Status: done

## Goal

Create NestJS service extending PrismaClient with lifecycle hooks.

## Context

Central database access point. Required by all repositories.

## Acceptance Criteria

- [ ] `PrismaService` extends `PrismaClient`
- [ ] Implements `OnModuleInit` (connect on startup)
- [ ] Implements `OnModuleDestroy` (disconnect on shutdown)
- [ ] `PrismaModule` is global module
- [ ] Unit tests verify lifecycle hooks
- [ ] Health check query works

## Technical Notes

```typescript
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }
}

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

## Files to Touch

- apps/api/src/infrastructure/prisma/prisma.service.ts
- apps/api/src/infrastructure/prisma/prisma.module.ts
- apps/api/src/infrastructure/prisma/prisma.service.spec.ts
- apps/api/src/app.module.ts (import PrismaModule)

## Dependencies

- 043-setup-prisma-supabase

## Complexity: S

## Progress Log
