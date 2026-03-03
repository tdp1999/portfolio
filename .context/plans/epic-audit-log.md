# Epic: Audit Log for User Mutations

## Summary

Track all user-facing mutations (create, update, delete, role change, login, password reset) in an append-only audit log. Provides accountability, debugging, and security forensics.

## Why

Industry standard for multi-user systems. Enables admin to see who did what and when. Critical for security incident investigation.

## Scope Notes

- Append-only log table (userId, action, metadata, timestamp, performedBy)
- Queryable via admin API with filters (user, action type, date range)
- Consider event-sourcing-lite approach (domain events → audit sink)

## Status
placeholder

## Created
2026-03-03
