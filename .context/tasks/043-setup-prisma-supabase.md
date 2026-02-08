# Task: Setup Prisma and Supabase Connection

## Status: pending

## Goal

Initialize Prisma in the NestJS API and establish connection to Supabase PostgreSQL.

## Context

Foundation for all database work. Must be completed before any entity can be created.

## Acceptance Criteria

- [ ] Prisma packages installed (`prisma`, `@prisma/client`)
- [ ] `schema.prisma` created with PostgreSQL datasource
- [ ] `DATABASE_URL` documented in `.env.example`
- [ ] Prisma CLI scripts added to package.json
- [ ] `prisma generate` runs successfully
- [ ] Connection test passes (can query database)

## Technical Notes

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Scripts to add:

- `prisma:generate`
- `prisma:migrate:dev`
- `prisma:migrate:deploy`
- `prisma:studio`

## Files to Touch

- package.json (scripts)
- apps/api/prisma/schema.prisma (new)
- .env.example
- .gitignore (ensure .env is ignored)

## Dependencies

None

## Complexity: S

## Progress Log
