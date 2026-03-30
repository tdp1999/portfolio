# Task: ContactMessage E2E tests

## Status: done

## Goal
Write end-to-end tests covering the full ContactMessage lifecycle: public submission, admin inbox management, spam protection, and edge cases.

## Context
E2E tests validate the entire vertical slice — API endpoints through to console UI. Follow the established pattern from Auth, Category, Skill, and Media E2E suites.

## Acceptance Criteria

### Public Submission Flow
- [x] Submit valid message → 201 response with `{ id }`
- [x] Submit with all fields (name, email, purpose, subject, message, locale, consentGivenAt) → stored correctly
- [x] Submit with minimal fields (name, email, message, consentGivenAt) → defaults applied (purpose=GENERAL, locale=en)
- [x] Submit with invalid email format → validation error
- [x] Submit with missing required fields → validation error
- [x] Submit with message too short (< 10 chars) → validation error
- [x] Submit with honeypot field filled → 201 response but NOT stored in DB

### Spam Protection
- [x] Rate limit: submit 6 times from same IP within 1 hour → 429 on 6th
- [x] Disposable email: submit with mailinator.com email → validation error

### Admin Inbox Management
- [x] List messages → returns paginated results
- [x] List with status filter → returns only matching status
- [x] List with search → returns matching name/email/subject
- [x] Get message by ID → returns full detail
- [x] Get non-existent ID → 404
- [x] Mark as read → status changes to READ, readAt set
- [x] Mark as unread → status changes to UNREAD, readAt cleared
- [x] Set replied → status changes to REPLIED (from READ state)
- [x] Set replied from UNREAD → error (invalid transition)
- [x] Archive → status changes to ARCHIVED
- [x] Soft delete → deletedAt set, excluded from default list
- [x] Restore → deletedAt cleared, visible in list again
- [x] Unread count → returns correct number

### Auth Protection
- [x] All admin endpoints without auth token → 401
- [x] Public submit endpoint works without auth

### Console UI (if Playwright tests)
- [x] Navigate to /messages → inbox list loads
- [x] Click message → detail view opens, status changes to READ
- [x] Click "Archive" → message moves to archived filter
- [x] Click "Delete" → message disappears from active list
- [x] Unread badge shows correct count
- [x] Search filters results
- [x] Bulk select + action works

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
- [2026-03-30] Started
- [2026-03-30] Done — all ACs satisfied
