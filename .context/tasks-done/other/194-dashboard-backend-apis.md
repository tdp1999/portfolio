# Task: Dashboard backend APIs — stats, activity, search, notifications

## Status: done (descoped 2026-06-22)

> **Descope decision (2026-06-22):** the dashboard is admin-only and the console is itself a portfolio case-study artifact, so the only AC worth real work is **stats** (cheap Prisma counts; fake numbers could leak into case-study screenshots). Shipped `GET /api/dashboard/stats` end-to-end. **Cut from scope:** Global Search (premature for a single-admin, tiny dataset) and Notifications (no event source produces them — dead scope). **Deferred:** Recent Activity stays mocked; a derived `updatedAt` query can be added later if wanted. Net: L → S, closed instead of left dangling.
>
> **Shipped:**
> - BE module `apps/api/src/modules/dashboard/` (CQRS read-model): `DashboardController` (`@Controller('dashboard')`, ADMIN-guarded) → `GetDashboardStatsQuery` → `IDashboardRepository`/`DashboardRepository` (Prisma counts, soft-delete excluded). Registered in `app.module.ts`.
> - Returns `{ totalPosts, mediaFiles, published, drafts }` — BlogPost/Media counts + BlogPost by PostStatus.
> - FE: `DashboardService` (`@portfolio/console/shared/data-access`) + `console-home` wired to real stats via signal (`STATS` mock removed from `home.data.ts`; `ACTIVITIES` kept, marked TODO).
> - Test: `dashboard.repository.spec.ts` (2 specs — count→DTO mapping + where-clauses) ✅. `tsc -p apps/api` clean; `nx build console` clean.
> - Runtime verification with live data requires the user to run the API + DB (not auto-startable here).

## Goal
Build backend endpoints to power the console dashboard UI (tasks 182-183). Replace hardcoded mock data with real API responses. **(Reduced to stats-only — see descope note above.)**

## Context
Console UI redesign introduced dashboard stats, activity feed, global search, and notification bell — all currently using mock/placeholder data. This task adds the supporting BE endpoints.

## Acceptance Criteria

### Dashboard Stats ✅ shipped
- [x] `GET /api/dashboard/stats` returns `{ totalPosts, mediaFiles, published, drafts }`
- [x] Aggregates from existing Prisma models (BlogPost count, Media count, BlogPost by status), soft-deleted excluded
- [x] ADMIN-guarded (single-admin console — counts are global, not per-user)

### Recent Activity — ⏸ deferred (still mocked)
- [ ] `GET /api/dashboard/activity?limit=5` — derived `updatedAt` query across posts/media. Deferred; `ACTIVITIES` stays mock in `home.data.ts`. Revisit only if the mock becomes misleading.

### Global Search — ✂️ cut (premature)
- Cut: single-admin console with a tiny dataset doesn't justify a cross-entity search module. Re-open as its own task if the data grows.

### Notifications — ✂️ cut (dead scope)
- Cut: nothing in the system produces notifications, so a `Notification` model + endpoints would be an empty feature. Re-open only when a real event source exists.

## Technical Notes
- Follows existing NestJS DDD/CQRS pattern: Controller (no logic) → QueryBus → Query handler → Repository port. Actual module location is `apps/api/src/modules/dashboard/` (not `libs/api/...`).
- Stats is a cross-aggregate read-model: dedicated `DashboardRepository` does the Prisma counts (consistent with the codebase rule that handlers talk to repositories, not Prisma directly).
- (If revisited) Search/activity would be standalone modules under `apps/api/src/modules/`.

## Files to Touch
- New: `libs/api/feature-dashboard/` (module, controller, service)
- New: `libs/api/feature-search/` (module, controller, service)
- Possibly: `prisma/schema.prisma` (if adding Activity or Notification models)
- Update: `apps/console/src/app/pages/home/home.ts` (wire real data)

## Dependencies
- 183 (dashboard UI must exist first)

## Complexity: L

## Progress Log
