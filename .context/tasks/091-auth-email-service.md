# Task: Auth - Email Service (Resend)

## Status: pending

## Goal

Create a shared email service abstraction with Resend adapter, reusable across auth and landing contact form.

## Context

Password reset requires email delivery. Using Resend (free tier: 3,000 emails/month). The service is abstracted behind a port so it can be swapped or mocked in tests.

## Acceptance Criteria

- [ ] `resend` npm package installed
- [ ] `IEmailService` port defined in application layer with `sendEmail(to, subject, body)` method
- [ ] `ResendEmailService` adapter implemented in infrastructure layer
- [ ] `EmailModule` created as a shared NestJS module (global, exportable)
- [ ] `EMAIL_SERVICE` injection token created
- [ ] Unit tests with mocked Resend client
- [ ] Works with env var `RESEND_API_KEY` and `EMAIL_FROM` (sender address)

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
