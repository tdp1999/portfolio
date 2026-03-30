# Epic: Contact Message

## Summary

Build a complete ContactMessage module (BE + Console FE) for receiving, managing, and responding to visitor inquiries. Includes a new EmailTemplate module with port/adapter pattern designed for future extensibility (DB-backed templates + ProseMirror editor, in-app mail composer). MVP uses hardcoded templates; consumers are decoupled from template source via repository port.

The module handles the full lifecycle: public submission with spam protection, auto-reply acknowledgment, admin notification forwarding, inbox-style management in console, and automated retention/purge.

## Why

- **Professional signal:** Visitors (recruiters, hiring managers) expect a contact method on a portfolio
- **Centralized management:** All inquiries in one place instead of scattered across email
- **Auto-reply:** Immediate acknowledgment shows professionalism, sets response time expectations
- **Spam protection:** Prevent bot abuse without degrading UX (layered defense)
- **GDPR compliance:** Consent tracking, defined retention, right to erasure
- **Foundation for future email system:** EmailTemplate module establishes patterns for mail composer, template editor

## Target Users

- **Visitors/Recruiters:** Submit contact form on landing page (form UI is separate landing epic)
- **Admin (site owner):** Manage messages via console inbox, receive notification emails
- **System:** Auto-reply sender, retention purge cron job

## Scope

### In Scope

**Backend (API):**

- ContactMessage Prisma schema + migration
- ContactMessage domain entity (no audit FKs, public submission)
- ContactMessage repository (port/adapter)
- CQRS commands: SubmitContactMessage, MarkAsRead, MarkAsUnread, ArchiveMessage, SoftDeleteMessage, PurgeExpiredMessages
- CQRS queries: ListMessages, GetMessageById, GetUnreadCount
- Purpose enum: `GENERAL | JOB_OPPORTUNITY | FREELANCE | COLLABORATION | BUG_REPORT | OTHER`
- Status workflow: `UNREAD -> READ -> REPLIED -> ARCHIVED` (any state -> soft delete)
- Spam protection (BE layer): honeypot validation, per-endpoint rate limiting, disposable email blocking
- GDPR consent tracking (`consentGivenAt` timestamp)
- Retention: `expiresAt = createdAt + 12 months`, cron purge expired + hard-delete soft-deleted after 30 days
- Public endpoint (no auth) for submission + authenticated endpoints for admin management
- Presenter pattern for response shaping

**EmailTemplate Module (new):**

- `IEmailTemplateRepository` port interface
- `HardcodedEmailTemplateRepository` adapter (MVP — templates as TypeScript files)
- Template files: `contact-auto-reply` (en/vi), `admin-notification` (en)
- Variable interpolation: `{{name}}`, `{{message}}`, `{{purpose}}`, etc.
- Module registration with DI token

**Email Integration:**

- Auto-reply to visitor on submission (via existing Resend email service, locale-aware en/vi)
- Admin notification email forwarded to configurable address (`ADMIN_NOTIFICATION_EMAIL` env var)

**Frontend (Console):**

- Messages inbox page (list view with status indicators)
- Unread count badge in sidebar navigation
- Message detail view (full content + metadata)
- Actions: mark read/unread, archive, soft delete, restore
- Reply action (MVP: `mailto:` link pre-filled with `Re: [subject]` and recipient)
- Search by name, email, subject
- Filter by status, purpose, date range
- Bulk actions: mark read, archive, delete (select multiple)
- Empty states and loading skeletons

### Out of Scope

- Contact form UI on landing page (separate landing epic — API is ready for it)
- Cloudflare Turnstile CAPTCHA (landing epic dependency; API accepts optional `captchaToken` field for future)
- In-app reply/compose (future mail-composer module)
- Email template editor UI (future, ProseMirror-based)
- Template storage in DB / `PrismaEmailTemplateRepository` (future swap, zero consumer change)
- `ComposedEmail` / `EmailThread` models (future mail-composer module)
- Push notifications / WebSocket for real-time updates
- Attachment support on contact form
- Analytics (message volume, response time metrics)
- "Send mail as" Gmail integration

## High-Level Requirements

### 1. ContactMessage Data Model

```prisma
enum ContactPurpose {
  GENERAL
  JOB_OPPORTUNITY
  FREELANCE
  COLLABORATION
  BUG_REPORT
  OTHER
}

enum ContactMessageStatus {
  UNREAD
  READ
  REPLIED
  ARCHIVED
}

model ContactMessage {
  id           String               @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name         String               @db.VarChar(200)
  email        String               @db.VarChar(320)
  purpose      ContactPurpose       @default(GENERAL)
  subject      String?              @db.VarChar(500)
  message      String               @db.Text
  status       ContactMessageStatus @default(UNREAD)
  isSpam       Boolean              @default(false)
  ipAddress    String?              @db.VarChar(64)
  userAgent    String?              @db.VarChar(512)
  locale       String               @default("en") @db.VarChar(5)
  consentGivenAt DateTime
  createdAt    DateTime             @default(now())
  readAt       DateTime?
  repliedAt    DateTime?
  archivedAt   DateTime?
  expiresAt    DateTime
  deletedAt    DateTime?

  @@index([status, deletedAt])
  @@index([createdAt])
  @@index([expiresAt])
  @@index([email])
}
```

**Design notes:**

- No `createdById` / `updatedById` — messages come from anonymous public visitors
- No `deletedById` — only admin can delete, single-user system
- `expiresAt` computed at creation: `createdAt + 12 months`
- `ipAddress` stored hashed (SHA-256) for GDPR compliance — used for rate limiting check, not stored raw
- `email` max 320 chars (RFC 5321 max email length)
- Indexes on status+deletedAt (inbox queries), createdAt (ordering), expiresAt (purge cron), email (rate limit check)

### 2. Status Workflow

```
Submit (public) ─── UNREAD
                       │
                  [admin opens]
                       │
                      READ
                       │
              [admin clicks reply]
                       │
                     REPLIED
                       │
              [admin archives]
                       │
                    ARCHIVED

Any state ──── [admin deletes] ──── deletedAt set (soft delete)
                                         │
                                  [30 days later]
                                         │
                                    hard deleted
```

- `readAt` set when status transitions to READ
- `repliedAt` set when status transitions to REPLIED
- `archivedAt` set when status transitions to ARCHIVED
- Transitions are one-way except: admin can mark READ -> UNREAD (toggle)
- Soft-deleted messages can be restored (clear `deletedAt`)
- Archived messages still visible in "Archived" filter, not in default inbox

### 3. EmailTemplate Module

**Port interface:**

```typescript
export type TemplateData = Record<string, string>;

export type EmailTemplate = {
  subject: string;
  bodyHtml: string;
  bodyText: string;
};

export type IEmailTemplateRepository = {
  getTemplate(key: string, locale: string, data: TemplateData): Promise<EmailTemplate>;
  hasTemplate(key: string, locale: string): Promise<boolean>;
};
```

**MVP implementation:** `HardcodedEmailTemplateRepository` — templates as TypeScript functions returning interpolated HTML/text.

**Template files structure:**

```
modules/email-template/infrastructure/templates/
├── contact-auto-reply.template.ts    // en + vi variants
└── admin-notification.template.ts    // en only
```

**Future swap path (zero consumer change):**

```
MVP:    EMAIL_TEMPLATE_REPOSITORY → HardcodedEmailTemplateRepository (code files)
Future: EMAIL_TEMPLATE_REPOSITORY → PrismaEmailTemplateRepository (DB + editor)
```

Consumers inject `EMAIL_TEMPLATE_REPOSITORY` token, call `getTemplate()`. Don't know or care about the source.

### 4. Spam Protection (Backend Layers)

| Layer | Implementation | Behavior |
|-------|---------------|----------|
| **Honeypot** | Hidden `website` field in DTO; if filled, silently return 201 (don't alert bot) | Zero UX cost |
| **Rate limit (IP)** | `@Throttle({ default: { limit: 5, ttl: 3600000 } })` on submit endpoint | 5 submissions/hour per IP |
| **Rate limit (email)** | Custom guard: check DB for recent submissions from same email | 3 submissions/hour per email |
| **Disposable email** | Server-side check against known disposable domains list | Reject with validation error |
| **Min submission time** | Reject if `submittedAt - pageLoadedAt < 3 seconds` (optional field from frontend) | Catches fast bots |

**Important:** Honeypot returns success (201) even when caught — never reveal detection to bots.

### 5. Auto-Reply Email

**Trigger:** Successful (non-spam) submission of contact form.

**Content (en):**

```
Subject: Thank you for reaching out, {{name}}!

Hi {{name}},

Thank you for contacting me. I've received your message and will
respond within 2-3 business days.

For reference, here's a summary of your inquiry:
- Purpose: {{purpose}}
- Subject: {{subject}}

Best regards,
Phong
thunderphong.com
```

**Content (vi):** Vietnamese translation of above.

**Sent from:** `hello@thunderphong.com` (via Resend, already configured)
**Locale:** Match the `locale` field from submission

### 6. Admin Notification Email

**Trigger:** Every successful (non-spam) submission.

**Sent to:** `ADMIN_NOTIFICATION_EMAIL` env var (personal Gmail)

**Content:**

```
Subject: [Portfolio] New contact message from {{name}}

New message received:

From: {{name}} ({{email}})
Purpose: {{purpose}}
Subject: {{subject}}
Locale: {{locale}}

Message:
{{message}}

---
View in console: {{consoleUrl}}/messages/{{id}}
```

### 7. Console Inbox UI

**List view:**

- Default filter: non-deleted, non-archived (active inbox)
- Columns: status indicator (dot/bold), sender name, purpose badge, subject preview, date
- Sort: newest first (default), sortable by date
- Unread messages: bold text + colored dot indicator
- Pagination: standard page/limit
- Quick filters: All, Unread, Read, Replied, Archived, Spam, Deleted
- Search: across name, email, subject fields

**Detail view:**

- Full message content
- Metadata: sender name, email, purpose, locale, IP (hashed), user agent, timestamps
- Action buttons: Mark Read/Unread, Archive, Delete, Reply (mailto:), Restore (if deleted)
- Status badge showing current state

**Sidebar badge:**

- Unread count displayed next to "Messages" nav item
- Updates on navigation (poll on route change, not WebSocket)

**Bulk actions:**

- Checkbox selection on list items
- Toolbar: Mark as Read, Archive, Delete (appear when items selected)

### 8. Retention & Purge

**Cron job:** `PurgeExpiredMessagesJob`

- Schedule: Daily at 3 AM (`0 3 * * *`) — same pattern as MediaCleanupJob
- Actions:
  1. Hard-delete messages where `expiresAt < now()` (12-month retention)
  2. Hard-delete messages where `deletedAt < now() - 30 days` (soft-delete grace period)
- Logging: count of purged messages per run

### 9. Admin Reply (MVP)

- Click "Reply" button → opens `mailto:{{email}}?subject=Re: {{subject}}&body={{pre-filled greeting}}`
- On click, API call to set status = `REPLIED`, `repliedAt = now()`
- Future: replace with in-app compose via mail-composer module

### 10. Environment Variables

```
ADMIN_NOTIFICATION_EMAIL=personal@gmail.com   # Where to forward new message notifications
```

Uses existing:

```
RESEND_API_KEY=re_xxxxxxxxxxxx                # Already configured
EMAIL_FROM=hello@thunderphong.com             # Already configured
```

## Technical Considerations

### Architecture

Follows established module pattern (Tag/Category/Skill/Media):

```
modules/
├── email/                          # EXISTING — Resend send adapter
├── email-template/                 # NEW — template port/adapter
│   ├── application/
│   │   ├── ports/
│   │   │   └── email-template.repository.port.ts
│   │   └── email-template.token.ts
│   ├── domain/
│   │   └── entities/
│   │       └── email-template.entity.ts   # TemplateData type, render logic
│   └── infrastructure/
│       ├── repositories/
│       │   └── hardcoded-email-template.repository.ts
│       └── templates/
│           ├── contact-auto-reply.template.ts
│           └── admin-notification.template.ts
├── contact-message/                # NEW — this epic's main module
│   ├── application/
│   │   ├── commands/
│   │   │   ├── submit-contact-message.handler.ts
│   │   │   ├── mark-as-read.handler.ts
│   │   │   ├── mark-as-unread.handler.ts
│   │   │   ├── set-replied.handler.ts
│   │   │   ├── archive-message.handler.ts
│   │   │   ├── restore-message.handler.ts
│   │   │   ├── soft-delete-message.handler.ts
│   │   │   └── purge-expired-messages.handler.ts
│   │   ├── queries/
│   │   │   ├── list-messages.handler.ts
│   │   │   ├── get-message-by-id.handler.ts
│   │   │   └── get-unread-count.handler.ts
│   │   ├── jobs/
│   │   │   └── message-purge.job.ts         # @Cron daily
│   │   ├── ports/
│   │   │   └── contact-message.repository.port.ts
│   │   ├── contact-message.dto.ts
│   │   ├── contact-message.presenter.ts
│   │   └── contact-message.token.ts
│   ├── domain/
│   │   ├── entities/
│   │   │   └── contact-message.entity.ts
│   │   ├── contact-message.error.ts
│   │   └── contact-message.types.ts
│   ├── infrastructure/
│   │   ├── mapper/
│   │   │   └── contact-message.mapper.ts
│   │   ├── repositories/
│   │   │   └── contact-message.repository.ts
│   │   └── guards/
│   │       └── email-rate-limit.guard.ts    # Per-email rate limiting
│   ├── presentation/
│   │   └── contact-message.controller.ts
│   ├── contact-message.module.ts
│   └── index.ts
└── mail-composer/                  # FUTURE — NOT in this epic
```

### Dependencies

- **Existing:** `EmailModule` (Resend), `ThrottlerModule`, `ScheduleModule`, `AuthModule` (for admin endpoints)
- **New:** `EmailTemplateModule` (created in this epic)
- **NPM packages needed:** disposable email domain list (e.g., `disposable-email-domains` or inline list)
- **Env vars:** `ADMIN_NOTIFICATION_EMAIL` (new)

### Integration Points

- `EmailModule` — send auto-reply and admin notification
- `EmailTemplateModule` — render templates with variable interpolation
- `ThrottlerModule` — per-IP rate limiting on submit endpoint
- `ScheduleModule` — cron job for retention purge
- `AuthModule` — JWT guard on admin endpoints (list, read, archive, delete)
- Landing page (future) — will POST to public `/contact-messages` endpoint

### API Endpoints

```
POST   /contact-messages              # Public — submit message (honeypot + rate limit)
GET    /contact-messages              # Admin — list with filters/search/pagination
GET    /contact-messages/unread-count # Admin — unread badge count
GET    /contact-messages/:id          # Admin — message detail
PATCH  /contact-messages/:id/read     # Admin — mark as read
PATCH  /contact-messages/:id/unread   # Admin — mark as unread
PATCH  /contact-messages/:id/replied  # Admin — set replied status
PATCH  /contact-messages/:id/archive  # Admin — archive
PATCH  /contact-messages/:id/restore  # Admin — restore from soft delete
DELETE /contact-messages/:id          # Admin — soft delete
```

### Future Extensibility (designed now, built later)

**EmailTemplate DB migration (future):**

```prisma
model EmailTemplate {
  id        String   @id @db.Uuid
  key       String                    // 'contact-auto-reply'
  locale    String   @db.VarChar(5)   // 'en', 'vi'
  subject   String
  bodyHtml  String   @db.Text
  bodyText  String?  @db.Text
  variables Json                      // ['name', 'message', 'purpose']
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([key, locale])
}
```

**ComposedEmail (future mail-composer):**

```prisma
model ComposedEmail {
  id          String      @id @db.Uuid
  threadId    String?     @db.Uuid
  fromAddress String
  toAddress   String
  subject     String
  bodyHtml    String      @db.Text
  status      EmailStatus // DRAFT, QUEUED, SENT, FAILED
  sentAt      DateTime?
  relatedType String?     // 'ContactMessage', 'Project', etc.
  relatedId   String?     @db.Uuid
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
}
```

`ComposedEmail.relatedType + relatedId` provides polymorphic link back to ContactMessage (or any entity). When mail-composer is built, it queries replies linked to a ContactMessage to show full thread.

## Risks & Warnings

**Email deliverability**

- Auto-reply emails may land in spam initially
- Mitigation: Resend handles SPF/DKIM via Cloudflare DNS (already configured). Monitor delivery rates in Resend dashboard. Keep email content simple, avoid spam trigger words.

**Honeypot bypass by sophisticated bots**

- Advanced bots may detect and skip honeypot fields
- Mitigation: Honeypot is one layer. Rate limiting + disposable email blocking provide additional defense. Turnstile (future, landing epic) will add strongest layer.

**Rate limit evasion via IP rotation**

- Botnets can rotate IPs to bypass per-IP limits
- Mitigation: Per-email rate limiting as second layer. For a portfolio site, the risk/reward for attackers is very low. Turnstile (future) is the ultimate defense.

**Cron job failure**

- If purge job fails, expired messages accumulate
- Mitigation: Logging on each run. Messages aren't sensitive data — delayed purge is low risk. Can run manually if needed.

**Resend free tier limits**

- 3,000 emails/month on free tier
- Mitigation: A portfolio receives maybe 10-50 messages/month. Each message = 2 emails (auto-reply + notification) = 100 emails max. Well within free tier.

**GDPR compliance gaps**

- Must disclose retention policy in privacy policy page
- Must provide way to request deletion (can be manual for now)
- Mitigation: Note in landing epic to add privacy policy page. Manual deletion via console is sufficient for portfolio scale.

## Alternatives Considered

### Status model: Boolean flags vs Enum

- **Boolean flags** (`isRead`, `isArchived` — current schema design): Simple but can have conflicting states
- **Status enum** (chosen): Single source of truth, clearer workflow, better for filtering. `UNREAD | READ | REPLIED | ARCHIVED` plus separate `deletedAt` for soft delete
- **Why enum chosen:** Prevents invalid state combinations (e.g., read AND unread). Status transitions are explicit and auditable via timestamps.

### Template system: Inline strings vs Module

- **Inline strings** in command handler: Simplest, but couples template content to business logic
- **Separate module with port** (chosen): Small upfront cost, but enables future DB-backed templates + ProseMirror editor without changing any consumer code
- **Why module chosen:** The stated goal is seamless future extensibility. Port/adapter pattern costs minimal extra code now but saves significant refactoring later.

### Spam protection: CAPTCHA-first vs Layered

- **CAPTCHA-first:** Turnstile on form submission, simple backend
- **Layered backend defense** (chosen): Honeypot + rate limit + disposable email blocking. CAPTCHA deferred to landing epic
- **Why layered chosen:** Backend spam protection works regardless of frontend. Landing page doesn't exist yet. Multiple lightweight layers > single heavy layer.

## Success Criteria

### Backend

- [ ] Prisma schema applied, migration successful
- [ ] Domain entity with status transitions and validation
- [ ] All 8 commands with unit tests (submit, read, unread, replied, archive, restore, delete, purge)
- [ ] All 3 queries with unit tests (list, get-by-id, unread-count)
- [ ] Honeypot silently catches bot submissions (returns 201)
- [ ] Per-IP rate limiting on submit endpoint
- [ ] Per-email rate limiting (custom guard)
- [ ] Disposable email rejection
- [ ] Auto-reply sent on valid submission (en/vi)
- [ ] Admin notification sent to configured email
- [ ] Cron job purges expired + old soft-deleted messages
- [ ] Public submit endpoint (no auth), admin endpoints (JWT + ADMIN role)

### EmailTemplate Module

- [ ] Port interface defined with `getTemplate()` and `hasTemplate()`
- [ ] Hardcoded repository implements port
- [ ] Auto-reply template renders correctly in en and vi
- [ ] Admin notification template renders correctly
- [ ] Variable interpolation works for all template fields

### Frontend (Console)

- [ ] Inbox list page with status indicators and pagination
- [ ] Unread count badge in sidebar
- [ ] Message detail view with full content
- [ ] Mark read/unread toggle
- [ ] Archive and restore actions
- [ ] Soft delete and restore actions
- [ ] Reply via mailto: link with pre-filled fields
- [ ] Search across name, email, subject
- [ ] Filter by status and purpose
- [ ] Bulk actions (mark read, archive, delete)

### Integration

- [ ] E2E test: submit message → auto-reply sent → notification sent → appears in console inbox
- [ ] E2E test: admin marks read → status updates → unread count decreases
- [ ] E2E test: soft delete → restore → visible again
- [ ] E2E test: honeypot submission → 201 returned → not stored

## Estimated Complexity

**M (Medium)**

**Reasoning:**

- ContactMessage entity is standalone (no complex relations, no audit FKs)
- But scope includes: new EmailTemplate module, spam protection layers, cron job, auto-reply/notification emails, full console inbox UI
- Comparable to Media module in breadth (multiple integration points) but simpler domain logic
- Email template port/adapter adds small architectural overhead but is straightforward
- Console inbox UI is standard CRUD list/detail pattern with filtering

## Specialized Skills

- **prisma-migrate** — Prisma migration workflow with safety analysis → task 196
- **aqa-expert** — E2E test patterns (POM, Playwright, flakiness prevention) → task 204
- **ng-lib** — Angular library generator for Nx monorepo → task 203

## Status

completed

> Broken down into tasks 195-204 on 2026-03-29

## Created

2026-03-29

## Follow-Up Notes

### Landing Epic Dependencies

When building the landing page contact form, the following are needed:

- Contact form component with fields: name, email, purpose (dropdown), subject (text), message (textarea), GDPR consent checkbox
- Honeypot hidden field (`website`)
- Cloudflare Turnstile widget integration (free, invisible)
- Submit to `POST /contact-messages` with `captchaToken` field
- Form validation UX: inline on blur, specific error messages, a11y compliant
- Success/error states
- `pageLoadedAt` timestamp for min-time spam check
- Privacy policy page (GDPR disclosure)

### Future Epic: Mail Composer

When ready to build in-app email compose/reply:

1. Add `EmailTemplate` + `ComposedEmail` Prisma models (additive migration, no conflicts)
2. Implement `PrismaEmailTemplateRepository` → swap DI token (zero consumer change)
3. Build template editor UI (ProseMirror-based)
4. Build compose UI with draft/send/thread support
5. Replace mailto: links with in-app compose action
6. `ComposedEmail.relatedType/relatedId` links replies back to ContactMessage for thread view
