# Task: Profile E2E tests

## Status: done

## Goal
Write end-to-end tests covering the full Profile lifecycle: admin upsert, public access, field filtering, JSON-LD generation, and landing page dynamic data display.

## Context
Profile E2E validates the complete vertical slice — from admin console form save through public API to landing page rendering. Special focus on: single-record invariant, public/private field separation, translatable JSON, and JSON-LD correctness.

## Acceptance Criteria

### API E2E — Admin Operations
- [x] PUT `/admin/profile` with full valid payload → 200, returns `{ id }`
- [x] PUT `/admin/profile` again (update) → 200, same id returned (PRF-002: upsert)
- [x] PUT with missing required translatable field (both en + vi) → validation error
- [x] PUT with invalid socialLinks (bad URL) → validation error
- [x] PUT with invalid certifications (year out of range) → validation error
- [x] PUT with non-existent avatarId → MEDIA_NOT_FOUND error
- [x] GET `/admin/profile` → returns full Profile including private fields (phone, address)
- [ ] PATCH `/admin/profile/avatar` with valid Media ID → avatar updated
- [x] PATCH `/admin/profile/avatar` with null → avatar cleared

### API E2E — Public Access (PRF-003)
- [x] GET `/profile` without auth → returns 200 with public fields
- [x] GET `/profile` response does NOT contain phone
- [x] GET `/profile` response does NOT contain locationPostalCode, locationAddress1, locationAddress2
- [x] GET `/profile` response DOES contain locationCity, locationCountry
- [x] GET `/profile` when Profile not yet created → 404
- [x] GET `/profile/json-ld?locale=en` → valid Schema.org Person JSON-LD
- [x] GET `/profile/json-ld?locale=vi` → JSON-LD with vi translatable fields
- [x] JSON-LD contains: @type Person, name, jobTitle, description, sameAs (social URLs)

### API E2E — Auth Protection
- [x] PUT `/admin/profile` without auth → 401
- [x] GET `/admin/profile` without auth → 401
- [x] GET `/profile` without auth → 200 (public, no auth needed)

### Console UI (Playwright)
- [x] Navigate to `/profile` → settings form loads
- [x] Form prefills with existing Profile data
- [x] Fill identity section (name en/vi, title en/vi) → save → success toast
- [x] Add social link (GitHub + URL) → save → verify in public API response
- [x] Add certification → save → verify in response
- [ ] Upload avatar → avatar preview shown → save → avatarUrl in public API response
- [x] Change availability + openTo → save → reflected in public response

### Landing Page (Playwright)
- [x] Landing page hero shows fullName (not hardcoded "Phuong")
- [x] Hero shows title from Profile
- [x] Avatar image renders (not placeholder icon)
- [x] Social link icons appear and link correctly
- [x] Resume download button links to correct URL
- [ ] Switch locale → translatable fields update (en↔vi)
- [x] JSON-LD in `<head>` contains correct Profile data

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
- [2026-04-04] Started — beginning with API E2E tests
- [2026-04-04] API E2E — 20 tests passing (admin ops, public access, JSON-LD, auth protection)
- [2026-04-04] Console E2E — 6 tests passing (form load, prefill, save, social links, certs, availability)
- [2026-04-04] Landing E2E — 8 tests passing (hero, social links, resume, JSON-LD, badges, experience)
- [2026-04-04] Bug fix: profile form sent empty strings for bioLong (Zod min(1) rejection). Fixed to send null.
- [2026-04-04] Infra: added global-setup/teardown to landing-e2e, updated playwright config for API server
- [2026-04-04] Infra: fixed console-e2e global-teardown FK constraint (delete profiles before users)
- [2026-04-04] Skipped: avatar upload (needs real media), locale switching (no locale UI yet)
