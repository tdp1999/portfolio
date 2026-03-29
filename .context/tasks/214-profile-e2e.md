# Task: Profile E2E tests

## Status: pending

## Goal
Write end-to-end tests covering the full Profile lifecycle: admin upsert, public access, field filtering, JSON-LD generation, and landing page dynamic data display.

## Context
Profile E2E validates the complete vertical slice — from admin console form save through public API to landing page rendering. Special focus on: single-record invariant, public/private field separation, translatable JSON, and JSON-LD correctness.

## Acceptance Criteria

### API E2E — Admin Operations
- [ ] PUT `/admin/profile` with full valid payload → 200, returns `{ id }`
- [ ] PUT `/admin/profile` again (update) → 200, same id returned (PRF-002: upsert)
- [ ] PUT with missing required translatable field (both en + vi) → validation error
- [ ] PUT with invalid socialLinks (bad URL) → validation error
- [ ] PUT with invalid certifications (year out of range) → validation error
- [ ] PUT with non-existent avatarId → MEDIA_NOT_FOUND error
- [ ] GET `/admin/profile` → returns full Profile including private fields (phone, address)
- [ ] PATCH `/admin/profile/avatar` with valid Media ID → avatar updated
- [ ] PATCH `/admin/profile/avatar` with null → avatar cleared

### API E2E — Public Access (PRF-003)
- [ ] GET `/profile` without auth → returns 200 with public fields
- [ ] GET `/profile` response does NOT contain phone
- [ ] GET `/profile` response does NOT contain locationPostalCode, locationAddress1, locationAddress2
- [ ] GET `/profile` response DOES contain locationCity, locationCountry
- [ ] GET `/profile` when Profile not yet created → 404
- [ ] GET `/profile/json-ld?locale=en` → valid Schema.org Person JSON-LD
- [ ] GET `/profile/json-ld?locale=vi` → JSON-LD with vi translatable fields
- [ ] JSON-LD contains: @type Person, name, jobTitle, description, sameAs (social URLs)

### API E2E — Auth Protection
- [ ] PUT `/admin/profile` without auth → 401
- [ ] GET `/admin/profile` without auth → 401
- [ ] GET `/profile` without auth → 200 (public, no auth needed)

### Console UI (Playwright)
- [ ] Navigate to `/profile` → settings form loads
- [ ] Form prefills with existing Profile data
- [ ] Fill identity section (name en/vi, title en/vi) → save → success toast
- [ ] Add social link (GitHub + URL) → save → verify in public API response
- [ ] Add certification → save → verify in response
- [ ] Upload avatar → avatar preview shown → save → avatarUrl in public API response
- [ ] Change availability + openTo → save → reflected in public response

### Landing Page (Playwright)
- [ ] Landing page hero shows fullName (not hardcoded "Phuong")
- [ ] Hero shows title from Profile
- [ ] Avatar image renders (not placeholder icon)
- [ ] Social link icons appear and link correctly
- [ ] Resume download button links to correct URL
- [ ] Switch locale → translatable fields update (en↔vi)
- [ ] JSON-LD in `<head>` contains correct Profile data

**Specialized Skill:** aqa-expert — read SKILL.md for E2E patterns (POM, SSR testing, console monitoring, flakiness prevention).

## Technical Notes
- Seed Profile via API before console/landing tests
- JSON-LD validation: parse the `<script type="application/ld+json">` content and assert fields
- SSR test: use Playwright to check `page.content()` for JSON-LD in `<head>` (server-rendered, present before JS executes)
- Public field exclusion: assert specific keys are absent from response (not just undefined)
- Translatable fallback (PRF-004): create Profile with only en locale → verify vi request falls back to en content

## Files to Touch
- New: API E2E tests in `apps/api-e2e/src/profile/`
- New: Console E2E tests in `apps/console-e2e/src/profile/`
- New: Landing E2E tests in `apps/landing-e2e/src/profile/` (or existing landing e2e)
- New: Page Object Models for profile settings page + landing hero

## Dependencies
- 211 (API fully wired)
- 212 (Console UI built)
- 213 (Landing integration complete)

## Complexity: L

## Progress Log
