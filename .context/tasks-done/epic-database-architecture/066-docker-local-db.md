# Task: Setup Docker PostgreSQL for Local Development

## Status: done

## Goal

Configure a local PostgreSQL database via Docker for development, replacing direct Supabase usage during dev.

## Context

Prisma schema and migrations exist but require a running PostgreSQL instance. Local Docker DB keeps dev isolated from production (Supabase).

## Acceptance Criteria

- [x] `docker-compose.yml` with PostgreSQL 16 service
- [x] `.env.example` updated with local DB URL
- [x] Convenience scripts in `package.json` (`db:up`, `db:down`, `db:reset`)
- [x] Local DB connects and migrations run successfully

## Technical Notes

- PostgreSQL 16 (match Supabase version)
- Port 5432, persistent volume for data
- User action required: install Docker Desktop, start container, create `.env`

## Files to Touch

- docker-compose.yml (new)
- .env.example
- package.json
- .gitignore (if needed)

## Dependencies

- 049-user-prisma-schema

## Complexity: S

## Progress Log
- [2026-02-16] Started
- [2026-02-16] Done — local DB running, migration applied
