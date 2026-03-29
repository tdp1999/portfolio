# Task: ContactMessage E2E tests

## Status: pending

## Goal
Write end-to-end tests covering the full ContactMessage lifecycle: public submission, admin inbox management, spam protection, and edge cases.

## Context
E2E tests validate the entire vertical slice — API endpoints through to console UI. Follow the established pattern from Auth, Category, Skill, and Media E2E suites.

## Acceptance Criteria

### Public Submission Flow
- [ ] Submit valid message → 201 response with `{ id }`
- [ ] Submit with all fields (name, email, purpose, subject, message, locale, consentGivenAt) → stored correctly
- [ ] Submit with minimal fields (name, email, message, consentGivenAt) → defaults applied (purpose=GENERAL, locale=en)
- [ ] Submit with invalid email format → validation error
- [ ] Submit with missing required fields → validation error
- [ ] Submit with message too short (< 10 chars) → validation error
- [ ] Submit with honeypot field filled → 201 response but NOT stored in DB

### Spam Protection
- [ ] Rate limit: submit 6 times from same IP within 1 hour → 429 on 6th
- [ ] Disposable email: submit with mailinator.com email → validation error

### Admin Inbox Management
- [ ] List messages → returns paginated results
- [ ] List with status filter → returns only matching status
- [ ] List with search → returns matching name/email/subject
- [ ] Get message by ID → returns full detail
- [ ] Get non-existent ID → 404
- [ ] Mark as read → status changes to READ, readAt set
- [ ] Mark as unread → status changes to UNREAD, readAt cleared
- [ ] Set replied → status changes to REPLIED (from READ state)
- [ ] Set replied from UNREAD → error (invalid transition)
- [ ] Archive → status changes to ARCHIVED
- [ ] Soft delete → deletedAt set, excluded from default list
- [ ] Restore → deletedAt cleared, visible in list again
- [ ] Unread count → returns correct number

### Auth Protection
- [ ] All admin endpoints without auth token → 401
- [ ] Public submit endpoint works without auth

### Console UI (if Playwright tests)
- [ ] Navigate to /messages → inbox list loads
- [ ] Click message → detail view opens, status changes to READ
- [ ] Click "Archive" → message moves to archived filter
- [ ] Click "Delete" → message disappears from active list
- [ ] Unread badge shows correct count
- [ ] Search filters results
- [ ] Bulk select + action works

**Specialized Skill:** aqa-expert — read SKILL.md for E2E test patterns (POM, console monitoring, flakiness prevention).

## Technical Notes
- API E2E: use supertest or HTTP client against running API
- Console E2E: use Playwright with Page Object Model pattern
- Seed test data: create messages via API before testing admin flows
- Rate limit tests: may need to reset throttler state between tests or use separate test config
- Honeypot test: verify message count in DB doesn't increase after honeypot submission
- Follow existing E2E patterns from `apps/console-e2e/` and `apps/api-e2e/`

## Files to Touch
- New: API E2E tests in `apps/api-e2e/src/contact-message/`
- New: Console E2E tests in `apps/console-e2e/src/messages/`
- New: Page Object Model for messages page

## Dependencies
- 202 (API fully wired)
- 203 (Console UI built)

## Complexity: L

## Progress Log
