# Task: User Module - Prisma Schema

## Status: done

## Goal

Define User model in Prisma schema and run migration.

## Context

User is required for audit fields (createdById, updatedById) on all other entities. Minimal implementation first.

## Acceptance Criteria

- [x] User model in schema.prisma with all 10 fields
- [x] Migration created and applied
- [x] Prisma types generated

## Technical Notes

Fields:

- id (UUID v7, PK)
- email (unique)
- passwordHash
- name
- lastLoginAt (nullable)
- refreshToken (nullable)
- refreshTokenExpiresAt (nullable)
- passwordResetToken (nullable)
- passwordResetExpiresAt (nullable)
- createdAt, updatedAt

## Files to Touch

- apps/api/prisma/schema.prisma
- apps/api/prisma/migrations/

## Dependencies

- 048-verify-foundation

## Complexity: S

## Progress Log
- [2026-02-14] Started
- [2026-02-14] Added User model with 11 fields (id, email, passwordHash, name, lastLoginAt, refreshToken, refreshTokenExpiresAt, passwordResetToken, passwordResetExpiresAt, createdAt, updatedAt)
- [2026-02-14] Migration 20260214142456_add_user_model applied
- [2026-02-14] Prisma client generated. Done.
