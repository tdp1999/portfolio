# Epic: Session Management (List / Revoke Active Sessions)

## Summary

Allow users to view their active sessions (device, browser, location, last active) and revoke individual sessions. Admin can view/revoke any user's sessions.

## Why

Security hygiene — users should be able to detect unauthorized access and terminate suspicious sessions. Standard feature in modern auth systems.

## Scope Notes

- Session table (userId, refreshTokenHash, deviceInfo, ipAddress, createdAt, lastUsedAt)
- `GET /auth/sessions` — list own sessions
- `DELETE /auth/sessions/:id` — revoke specific session
- Admin: view/revoke any user's sessions
- Consider Redis for session store if scaling beyond single instance

## Status
placeholder

## Created
2026-03-03
