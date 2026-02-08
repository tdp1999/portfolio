# Task: User Module - Prisma Schema

## Status: pending

## Goal

Define User model in Prisma schema and run migration.

## Context

User is required for audit fields (createdById, updatedById) on all other entities. Minimal implementation first.

## Acceptance Criteria

- [ ] User model in schema.prisma with all 10 fields
- [ ] Migration created and applied
- [ ] Prisma types generated

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
