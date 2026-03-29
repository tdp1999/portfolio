# Task: EmailTemplate module — port, hardcoded adapter, templates

## Status: done

## Goal
Create the EmailTemplate module with port/adapter pattern. MVP uses hardcoded templates in code; future swaps to DB-backed templates with zero consumer change.

## Context
ContactMessage epic requires auto-reply (en/vi) and admin notification emails. Instead of hardcoding templates in command handlers, we create a reusable EmailTemplate module. The port interface is designed so a future `PrismaEmailTemplateRepository` (DB + ProseMirror editor) can replace the hardcoded adapter without changing any consumer code.

## Acceptance Criteria

### Port Interface
- [x] `IEmailTemplateRepository` port defined with `getTemplate(key, locale, data)` and `hasTemplate(key, locale)` methods
- [x] `TemplateData` type: `Record<string, string>` for variable interpolation
- [x] `EmailTemplate` return type: `{ subject: string; bodyHtml: string; bodyText: string }`
- [x] `EMAIL_TEMPLATE_REPOSITORY` DI token exported

### Hardcoded Adapter
- [x] `HardcodedEmailTemplateRepository` implements `IEmailTemplateRepository`
- [x] Looks up templates by key + locale from in-memory registry
- [x] Falls back to `en` locale if requested locale not found
- [x] Throws `NotFoundError` if template key doesn't exist at all
- [x] Variable interpolation: replaces `{{varName}}` placeholders in subject, bodyHtml, bodyText

### Templates
- [x] `contact-auto-reply` template (en): thanks visitor, confirms receipt, sets 2-3 business day expectation
- [x] `contact-auto-reply` template (vi): Vietnamese translation of above
- [x] `admin-notification` template (en): shows sender info, purpose, subject, full message, console link
- [x] All templates use simple, professional HTML (no heavy styling — plain text fallback included)
- [x] Variables: `name`, `email`, `purpose`, `subject`, `message`, `locale`, `consoleUrl`, `messageId`

### Module Wiring
- [x] `EmailTemplateModule` registered as global module
- [x] `EMAIL_TEMPLATE_REPOSITORY` provided and exported
- [x] Unit tests for `HardcodedEmailTemplateRepository`: template lookup, locale fallback, variable interpolation, missing key error

## Technical Notes
- Follow port/adapter pattern from existing `EmailModule` (Resend)
- Templates are TypeScript functions returning `{ subject, bodyHtml, bodyText }` given `TemplateData`
- Keep HTML simple — Resend handles rendering. Avoid complex CSS (email clients are limited)
- `bodyText` is plain-text fallback (strip HTML, keep content readable)
- Future: `PrismaEmailTemplateRepository` reads from `EmailTemplate` DB table, same interface

### File Structure
```
modules/email-template/
├── application/
│   ├── ports/
│   │   └── email-template.repository.port.ts
│   └── email-template.token.ts
├── infrastructure/
│   ├── repositories/
│   │   ├── hardcoded-email-template.repository.ts
│   │   └── hardcoded-email-template.repository.spec.ts
│   └── templates/
│       ├── contact-auto-reply.template.ts
│       └── admin-notification.template.ts
├── email-template.module.ts
└── index.ts
```

## Files to Touch
- New: `apps/api/src/modules/email-template/` (entire module)

## Dependencies
- None (standalone module, uses no other modules)

## Complexity: M

## Progress Log
- [2026-03-29] Started
- [2026-03-29] Done — all ACs satisfied. Port, hardcoded adapter, templates (en/vi), module wiring, 9 unit tests passing, type check clean.
