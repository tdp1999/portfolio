# Task: Landing contact form with Resend, consent, and 18-month auto-delete

## Status: pending

## Goal
Replace (or augment) the existing `mailto:` CTAs in the landing Get-in-touch section with a real contact form that: validates input, requires explicit consent, blocks bots via Cloudflare Turnstile, persists submissions to a database, delivers email via Resend to `hello@thunderphong.com`, and automatically deletes submissions older than 18 months per the privacy policy.

## Context
- Today `libs/landing/feature-home/src/lib/get-in-touch/home-get-in-touch.component.html` only renders `mailto:` buttons → no server-side data path
- Privacy policy (task 325) §3.3 already declares the contact form: name + email + message + IP + timestamp, 18-month retention, explicit consent as legal basis
- Stack already has Resend wired into the API for auth flows (`apps/api/src/modules/email/infrastructure/resend-email.service.ts`) — reuse it
- The `mailto:` buttons should remain as a secondary option for users who prefer their own email client (privacy policy mentions both paths)
- Bot protection: use **Cloudflare Turnstile** (cookieless) not reCAPTCHA — aligns with privacy-friendly stack
- Decision needed at task-start time: which database stores submissions? Options: (a) new Railway Postgres for landing, (b) reuse the existing API Postgres (cleanest if API already has one), (c) Postgres on Neon free tier. Resolve in design phase.

## Acceptance Criteria

### UI (landing)
- [ ] `home-get-in-touch.component.html` adds a contact form alongside the existing `mailto:` CTAs (not removing them — both options remain)
- [ ] Fields: `name` (required, max 100), `email` (required, valid email per Zod `z.email()`), `message` (required, 10–5000 chars)
- [ ] Consent checkbox **un-pre-checked** with label: "I agree to the processing of my data to receive a reply, in line with the [Privacy Policy](/privacy)." (VN equivalent for VN locale)
- [ ] Submit button disabled until consent checkbox is checked and form is valid
- [ ] Cloudflare Turnstile widget renders before submit
- [ ] Loading, success, and error states using existing landing toast / inline-error patterns (`.context/patterns-error-handling.md`)
- [ ] Form uses Angular Reactive Forms with signals per `.context/angular-style-guide.md`
- [ ] Mobile responsive — usable on 360px width
- [ ] Submission resets the form on success and shows confirmation message

### Backend (apps/api)
- [ ] New module `apps/api/src/modules/contact/` following the project's DDD/CQRS structure (controller → command handler → repository)
- [ ] Controller endpoint `POST /landing/contact` (rate-limited per IP)
- [ ] Zod schema validation (Zod v4 syntax) — `z.email()`, length checks
- [ ] Turnstile token verified server-side against Cloudflare's `/siteverify` endpoint before any DB write
- [ ] Prisma model `ContactSubmission { id, name, email, message, ipHash, submittedAt }` — IP is **hashed** (sha256 with salt) before storage to align with the privacy policy's IP-handling stance
- [ ] Repository persists the row, command handler triggers `ResendEmailService.send(...)` to deliver formatted email to `hello@thunderphong.com` with reply-to set to the submitter's email
- [ ] No business logic in the controller — see CLAUDE.md guardrail "No errors in controllers"
- [ ] Cron job (NestJS `@nestjs/schedule`) runs daily at 03:00 ICT, deletes `ContactSubmission` rows where `submittedAt < now() - 18 months`. Logs count of deletions.
- [ ] Unit tests for command handler (happy path + Turnstile failure + Resend failure)
- [ ] Migration follows `prisma-migrate` skill — no destructive ops

### E2E
- [ ] Playwright test: fills form, mocks Turnstile, submits, asserts success message, verifies row in DB and Resend mock called

### Documentation
- [ ] Privacy policy needs no changes (already declares this flow)
- [ ] If a new env var is added (`TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `RESEND_CONTACT_FROM_EMAIL`), add to `.env.example` and document in `apps/api` README

## Technical Notes
- **Reply-to**: set Resend email's `replyTo` to the submitter's email so replies go directly to them, while the `from` stays a verified Resend sender domain.
- **Resend "from" domain**: must be a domain verified in Resend. If `thunderphong.com` is verified for transactional, use `noreply@thunderphong.com` or `contact@thunderphong.com`.
- **Honeypot fallback**: include a hidden `website` field (display: none) as a cheap second bot filter beyond Turnstile.
- **Rate limit**: 5 submissions per IP per hour — uses existing rate-limit middleware in apps/api if available, otherwise inline limiter on the controller.
- **18-month boundary** uses `submittedAt + INTERVAL '18 months'` in Postgres for exact behavior, not approximate `now() - 540 days`.
- **No Umami event tracking** on form submit — Umami is cookieless and we don't want to introduce PII risk by associating an analytics event with a form submitter. If conversion tracking is needed later, send an anonymous "contact_submitted" event with no payload.

## Files to Touch
- `libs/landing/feature-home/src/lib/get-in-touch/home-get-in-touch.component.{ts,html,scss}` (extend with form)
- `libs/landing/shared/data-access/src/lib/contact-form.service.ts` (new — HTTP client)
- `libs/landing/shared/data-access/src/lib/contact-form.types.ts` (new — types separate from service per memory rule)
- `apps/api/src/modules/contact/` (new module — controller, command, repository, cron, spec)
- `apps/api/prisma/schema.prisma` (new `ContactSubmission` model + migration)
- `apps/api/.env.example` (new vars)
- `apps/landing-e2e/src/` (new spec)

## Dependencies
- 325 (legal pages) — required so the consent checkbox's `/privacy` link resolves
- 326 (Umami) — soft, not blocking

## Complexity: L (BE + FE + DB + cron + Turnstile + tests)

## Progress Log
