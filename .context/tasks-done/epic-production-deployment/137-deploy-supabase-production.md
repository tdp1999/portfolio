# Task: ~~Supabase~~ Railway Postgres Production Database

## Status: done

## Goal
~~Provision and configure a Supabase PostgreSQL database for production.~~
**Updated:** Production database is Railway-managed Postgres, provisioned as part of the Railway project. No external DB service needed.

## Context
Originally planned to use Supabase free-tier PostgreSQL. Decision changed to Railway Postgres (included in $5/mo hobby plan) for simpler architecture — single platform for API + DB, no cross-provider networking, no Supabase pause/keep-alive concerns.

## What Was Done
- Railway Postgres service added to `distinguished-dream` project
- `DATABASE_URL` configured as Railway service variable (internal networking via `postgres.railway.internal:5432`)
- Prisma migrations run automatically via Dockerfile CMD (`prisma migrate deploy`)
- No PgBouncer/pooling needed (direct connection within Railway's private network)
- No SSL configuration needed (internal network)

## Decision Record
| Original Plan | Actual | Reason |
|---|---|---|
| Supabase free tier | Railway Postgres (hobby plan) | Single platform, no pause issues, simpler networking |
| PgBouncer pooled URL (port 6543) | Direct connection (port 5432) | Internal Railway networking, no pooler needed |
| `directUrl` for migrations | Single `DATABASE_URL` | No pooler = no need for separate migration URL |
| Keep-alive cron needed | Not needed | Railway Postgres doesn't pause |

## Complexity: S

## Progress Log
- 2026-03-05: Marked done. Railway Postgres provisioned and connected. API deploys with migrations successfully.
