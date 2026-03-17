# Task: Category Module - REST Controller

## Status: done

## Goal

Create Category REST controller with public read and admin-only write endpoints.

## Context

Thin controller delegating to CQRS buses. Follows Tag controller pattern exactly.

## Acceptance Criteria

- [x] `GET /categories` — list with query params (public)
- [x] `GET /categories/slug/:slug` — get by slug (public)
- [x] `GET /categories/:id` — get by ID (public)
- [x] `POST /categories` — create (admin only, returns `{ id }`, 201)
- [x] `PATCH /categories/:id` — update (admin only, returns `{ success: true }`)
- [x] `DELETE /categories/:id` — soft delete (admin only, returns `{ success: true }`)
- [x] Auth guards: `JwtAccessGuard` + `RoleGuard` with `@Roles(['ADMIN'])` on write endpoints
- [x] No business logic in controller — all delegated to command/query buses

## Technical Notes

Exact same pattern as TagController. Only difference: route prefix is `categories`.

## Files to Touch

- apps/api/src/modules/category/presentation/category.controller.ts

## Dependencies

- 147-category-commands
- 148-category-queries

## Complexity: S

Copy of Tag controller with route/class name changes.

## Progress Log
- [2026-03-17] Done — all ACs satisfied
