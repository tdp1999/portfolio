# Task: Experience E2E tests

## Status: pending

## Goal
Write comprehensive Playwright E2E tests covering the full Experience lifecycle — console CRUD, public API, landing page display, skills relation, and soft delete/restore.

## Context
Experience E2E tests validate the full vertical slice: admin creates/edits/deletes via console, data appears on landing page, public API returns correct filtered response. Tests should cover translatable fields, skills relation, company logo, and chronological sorting.

## Acceptance Criteria

### Console CRUD Tests
- [ ] Create experience: fill all required fields (companyName, position en/vi, startDate, employmentType) → save → appears in list
- [ ] Create experience with optional fields: description, achievements (en + vi), teamRole, skills, company logo, location, client context
- [ ] Edit experience: change position → save → list reflects changes
- [ ] Edit experience: slug does NOT change after editing companyName or position
- [ ] Soft delete: delete experience → removed from list (or shown with deleted indicator)
- [ ] Restore: restore soft-deleted experience → reappears in list
- [ ] "Current position" toggle: check → endDate disabled and cleared; uncheck → endDate enabled

### Skills Relation Tests
- [ ] Create experience with skills selected → skills shown in detail/edit view
- [ ] Update experience: add/remove skills → changes persisted
- [ ] Skills display as chips in list or detail view

### Public API Tests
- [ ] `GET /experiences` returns non-deleted experiences sorted by startDate DESC
- [ ] Response excludes private fields: no clientName, clientIndustry, locationPostalCode, locationAddress1, locationAddress2, no audit fields (EXP-002)
- [ ] Response includes skills array and companyLogoUrl
- [ ] `GET /experiences/:slug` returns single experience with public fields

### Landing Page Tests
- [ ] Experience page loads and displays timeline entries
- [ ] Each entry shows: companyName, position, date range, badges, achievements, skills
- [ ] Current positions show "Present" indicator
- [ ] Home page shows 2-3 most recent experiences with link to full page
- [ ] Empty state when no experiences (graceful, no errors)

### Multi-Language Tests
- [ ] Translatable fields display in correct locale (en/vi)
- [ ] Locale switch updates position, description, achievements text

### Edge Cases
- [ ] Create two experiences at same company → different slugs (collision handling)
- [ ] Reorder experiences → order reflected in public API and landing page
- [ ] Delete all experiences → landing page shows empty state gracefully

**Specialized Skill:** aqa-expert — read skill for Playwright POM pattern, console/network monitoring, soft assertions, flakiness prevention guidelines.

## Technical Notes
- Follow existing E2E patterns (check `apps/console-e2e/` and `apps/landing-e2e/` for structure)
- Use POM (Page Object Model) pattern for console experience page and landing experience page
- Login as admin before console tests (use dev credentials from memory)
- Seed data: create experiences via API before landing page tests (or rely on console create tests running first)
- Check console and network for errors during page loads
- Use soft assertions where appropriate (don't fail entire test on minor assertion)

## Files to Touch
- New: Console E2E page objects for experience list and dialog
- New: Console E2E spec files for experience CRUD
- New: Landing E2E page objects for experience page
- New: Landing E2E spec files for experience display
- New: API E2E spec files for public experience endpoints (if API test structure exists)

## Dependencies
- 221 (API endpoints)
- 222 (Console page)
- 223 (Landing page)

## Complexity: L

## Progress Log
