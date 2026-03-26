# Task: Dashboard backend APIs — stats, activity, search, notifications

## Status: pending

## Goal
Build backend endpoints to power the console dashboard UI (tasks 182-183). Replace hardcoded mock data with real API responses.

## Context
Console UI redesign introduced dashboard stats, activity feed, global search, and notification bell — all currently using mock/placeholder data. This task adds the supporting BE endpoints.

## Acceptance Criteria

### Dashboard Stats
- [ ] `GET /api/dashboard/stats` returns `{ totalPosts, mediaFiles, published, drafts }`
- [ ] Aggregates from existing Prisma models (Post count, Media count, Post by status)
- [ ] Scoped to current authenticated user (or all if admin)

### Recent Activity
- [ ] `GET /api/dashboard/activity?limit=5` returns recent actions
- [ ] Activity derived from existing tables (posts, media) sorted by `updatedAt`, or new `Activity` table
- [ ] Each item: `{ type, description, createdAt }`
- [ ] Decision needed: event log table vs derived query

### Global Search
- [ ] `GET /api/search?q=<term>` searches across posts, media, tags, categories, skills
- [ ] Returns grouped results: `{ posts: [...], media: [...], tags: [...] }`
- [ ] Basic LIKE/ILIKE search is sufficient for v1

### Notifications (optional — can be split out)
- [ ] `Notification` model in Prisma schema (userId, type, message, read, createdAt)
- [ ] `GET /api/notifications?unread=true`
- [ ] `PATCH /api/notifications/:id/read`
- [ ] Can defer to a separate task if scope is too large

## Technical Notes
- Follow existing NestJS patterns: Controller → Service → Repository
- Dashboard module: `libs/api/feature-dashboard/`
- Search can be a standalone module: `libs/api/feature-search/`
- Notifications may warrant its own module if implemented

## Files to Touch
- New: `libs/api/feature-dashboard/` (module, controller, service)
- New: `libs/api/feature-search/` (module, controller, service)
- Possibly: `prisma/schema.prisma` (if adding Activity or Notification models)
- Update: `apps/console/src/app/pages/home/home.ts` (wire real data)

## Dependencies
- 183 (dashboard UI must exist first)

## Complexity: L

## Progress Log
