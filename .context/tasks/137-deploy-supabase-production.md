# Task: Supabase Production Database Setup

## Status: pending

## Goal
Provision and configure a Supabase PostgreSQL database for production, document the setup process, and verify connectivity from Railway.

## Context
Phase 1 of epic-production-deployment. Supabase provides the production PostgreSQL database. Uses connection pooling via PgBouncer (port 6543) for efficient connections from Railway's containerized services.

## Acceptance Criteria
- [ ] Supabase project created for production
- [ ] Pooled connection string obtained (PgBouncer, port 6543)
- [ ] Direct connection string obtained (for migrations, port 5432)
- [ ] Connection string format documented in `.env.example`
- [ ] `prisma.config.ts` supports pooled URL for runtime and direct URL for migrations (`directUrl` in datasource)
- [ ] Prisma can connect to Supabase from local machine (`prisma migrate deploy` succeeds)
- [ ] Setup steps documented in `.context/runbook-production.md` (Supabase section)
- [ ] SSL mode configured (Supabase requires `sslmode=require`)

## Technical Notes
- Supabase free tier: 500MB storage, pauses after 1 week inactivity, daily backups
- PgBouncer pooled URL uses port 6543; direct URL uses port 5432
- Prisma needs `directUrl` for migrations (PgBouncer doesn't support DDL well)
- Connection string format: `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`
- Add `?pgbouncer=true&sslmode=require` to pooled URL
- Keep-alive is handled in a later task (140)

## Files to Touch
- `apps/api/prisma/prisma.config.ts` (add directUrl support if not present)
- `.env.example` (add Supabase URL format examples)
- `.context/runbook-production.md` (new — Supabase section)

## Dependencies
None — can be done in parallel with other Phase 1 tasks.

## Complexity: S

## Progress Log
