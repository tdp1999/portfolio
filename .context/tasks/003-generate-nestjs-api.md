# Task: Generate NestJS API Application

## Status: completed

## Goal

Generate the NestJS REST API application that will serve data to the landing page and future dashboard.

## Context

The API app provides the backend for the portfolio. Initially it will serve mock data, later connecting to a real database. Following patterns.md, it uses layered architecture (controllers, services, repositories).

## Acceptance Criteria

- [ ] NestJS app generated in `apps/api/`
- [ ] `nx serve api` starts NestJS server on port 3000 (or configured port)
- [ ] `nx build api` produces production build
- [ ] Health check endpoint works (GET /)
- [ ] App structure follows layered architecture pattern

## Technical Notes

```bash
nx add @nx/nest
nx g @nx/nest:app api
```

Default NestJS structure will be generated. The layered architecture (controllers/services/repositories folders) can be set up in a later task when adding actual features.

## Files to Touch

- apps/api/\*
- nx.json (updated with api project)
- package.json (NestJS dependencies added)

## Dependencies

- 001-init-nx-workspace

## Complexity: S
