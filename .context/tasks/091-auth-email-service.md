# Task: Auth - Email Service (Resend)

## Status: done

## Goal

Create a shared email service abstraction with Resend adapter, reusable across auth and landing contact form.

## Context

Password reset requires email delivery. Using Resend (free tier: 3,000 emails/month). The service is abstracted behind a port so it can be swapped or mocked in tests.

## Acceptance Criteria

- [x] `resend` npm package installed
- [x] `IEmailService` port defined in application layer with `sendEmail(to, subject, body)` method
- [x] `ResendEmailService` adapter implemented in infrastructure layer
- [x] `EmailModule` created as a shared NestJS module (global, exportable)
- [x] `EMAIL_SERVICE` injection token created
- [x] Unit tests with mocked Resend client
- [x] Works with env var `RESEND_API_KEY` and `EMAIL_FROM` (sender address)

## Technical Notes

Port interface:
```typescript
interface IEmailService {
  sendEmail(options: { to: string; subject: string; html: string }): Promise<void>;
}
```

Place in `apps/api/src/modules/email/` as a standalone module. Both AuthModule and future ContactModule will import it.

For tests, mock the Resend client. In dev environment, consider logging emails instead of sending (configurable via env).

## Files to Touch

- apps/api/src/modules/email/email.module.ts
- apps/api/src/modules/email/application/email.port.ts
- apps/api/src/modules/email/application/email.token.ts
- apps/api/src/modules/email/infrastructure/resend-email.service.ts
- apps/api/src/modules/email/infrastructure/resend-email.service.spec.ts
- apps/api/src/app/app.module.ts

## Dependencies

- None (standalone module)

## Complexity: M

## Progress Log
- [2026-02-25] Started
- [2026-02-25] Completed — all 100 API tests passing
