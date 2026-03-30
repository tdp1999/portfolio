# Task: ContactMessage REST controller + purge cron job + module wiring

## Status: done

## Goal
Create the HTTP transport layer, cron job for retention purge, and wire everything together in the NestJS module.

## Context
The controller is unique: it has both a public endpoint (submit, no auth) and authenticated admin endpoints. The purge cron runs daily. Module wiring connects all pieces including EmailTemplate dependency.

## Acceptance Criteria

### Controller
- [x] `POST /contact-messages` — **public** (no auth guard), dispatches `SubmitContactMessageCommand`
  - Extracts IP from request (`req.ip` or `x-forwarded-for`), user agent from `req.headers['user-agent']`
  - Applies `@Throttle({ default: { limit: 5, ttl: 3600000 } })` for per-IP rate limiting
  - Returns `201 { id }` on success (including honeypot — always 201)
- [x] `GET /contact-messages` — admin, dispatches `ListMessagesQuery`
- [x] `GET /contact-messages/unread-count` — admin, dispatches `GetUnreadCountQuery`
- [x] `GET /contact-messages/:id` — admin, dispatches `GetMessageByIdQuery`
- [x] `PATCH /contact-messages/:id/read` — admin, dispatches `MarkAsReadCommand`
- [x] `PATCH /contact-messages/:id/unread` — admin, dispatches `MarkAsUnreadCommand`
- [x] `PATCH /contact-messages/:id/replied` — admin, dispatches `SetRepliedCommand`
- [x] `PATCH /contact-messages/:id/archive` — admin, dispatches `ArchiveMessageCommand`
- [x] `PATCH /contact-messages/:id/restore` — admin, dispatches `RestoreMessageCommand`
- [x] `DELETE /contact-messages/:id` — admin, dispatches `SoftDeleteMessageCommand`
- [x] All admin endpoints use `@UseGuards(JwtAccessGuard, RoleGuard)` + `@Roles(['ADMIN'])`
- [x] Controller is thin — no validation, no error throwing, only dispatches to CQRS bus
- [x] `/unread-count` route registered BEFORE `/:id` to avoid route collision

### Cron Job
- [x] `MessagePurgeJob` injectable service
- [x] `@Cron('0 3 * * *')` — daily at 3 AM (same pattern as MediaCleanupJob)
- [x] Dispatches `PurgeExpiredMessagesCommand`
- [x] Logs results: "Purged X expired, Y soft-deleted messages"
- [x] Uses `Logger` (NestJS built-in)

### Module Wiring
- [x] `ContactMessageModule` imports: `CqrsModule`, `AuthModule` (forwardRef), `UserModule` (forwardRef), `EmailTemplateModule`
- [x] Provides: `CONTACT_MESSAGE_REPOSITORY` → `ContactMessageRepository`, all command handlers, all query handlers, `MessagePurgeJob`
- [x] Exports: `CONTACT_MESSAGE_REPOSITORY` (for potential future use)
- [x] Controller registered
- [x] Module imported in `AppModule`

### Environment Variables
- [x] `ADMIN_NOTIFICATION_EMAIL` added to `.env.example` with description
- [x] `CONSOLE_URL` added to `.env.example` (for notification email link)

### Integration Verification
- [x] App starts without errors
- [x] `npx tsc --noEmit` passes
- [x] Manual test: POST to `/contact-messages` with valid payload → 201 response
- [x] Manual test: GET `/contact-messages` with auth token → list response

## Technical Notes
- IP extraction: prefer `x-forwarded-for` header (behind proxy/Cloudflare), fallback to `req.ip`
- Route ordering matters: NestJS matches routes top-to-bottom. Define `/unread-count` before `/:id`
- Public endpoint: do NOT use `@UseGuards(ThrottlerGuard)` — use `@Throttle` decorator directly (ThrottlerGuard is global but skipIf in non-production)
- Cron job uses CommandBus, not direct repo access (keeps purge logic in command handler)

## Files to Touch
- New: `apps/api/src/modules/contact-message/presentation/contact-message.controller.ts`
- New: `apps/api/src/modules/contact-message/application/jobs/message-purge.job.ts`
- New: `apps/api/src/modules/contact-message/contact-message.module.ts`
- New: `apps/api/src/modules/contact-message/index.ts`
- Update: `apps/api/src/app/app.module.ts` (import ContactMessageModule)
- Update: `.env.example` (add ADMIN_NOTIFICATION_EMAIL, CONSOLE_URL)

## Dependencies
- 195 (EmailTemplate module)
- 200 (Commands)
- 201 (Queries)

## Complexity: M

## Progress Log
- [2026-03-30] Started
- [2026-03-30] Done — all ACs satisfied
