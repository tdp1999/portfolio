# Task: Landing page profile integration — replace hardcoded data

## Status: done

## Goal
Replace all hardcoded personal data on the landing page with dynamic Profile data fetched from the public API, including SSR JSON-LD injection.

## Context
The landing page currently shows hardcoded name "Phuong", title "Full-stack developer", placeholder avatar, and hardcoded projects. This task replaces all personal info with dynamic Profile data. It establishes the SSR data-fetching pattern that future modules (Projects, Experience) will reuse.

## Acceptance Criteria

### Profile Data Service
- [x] `ProfileService` in `libs/landing/shared/data-access/` (or existing data-access lib)
- [x] `getPublicProfile(): Observable<PublicProfileResponse | null>` — calls `GET /profile`
- [x] `getJsonLd(locale: string): Observable<JsonLdObject>` — calls `GET /profile/json-ld?locale=en|vi`
- [x] Handles 404 gracefully (returns null — Profile not yet created)
- [x] Inject `HttpClient`

### Hero Section
- [x] Displays `fullName[currentLocale]` (replaces hardcoded "Phuong")
- [x] Displays `title[currentLocale]` (replaces hardcoded "Full-stack developer")
- [x] Displays `bioShort[currentLocale]` (replaces hardcoded bio snippet)
- [x] Displays avatar image from `avatarUrl` (replaces placeholder icon)
- [x] Avatar: shows `<img>` if `avatarUrl` available, falls back to placeholder icon if null
- [x] Availability badge: if `isOpenToWork` true, shows badge with openTo labels

### About Section (if exists) or Hero Extension
- [x] Displays `bioLong[currentLocale]` if available
- [x] Displays `yearsOfExperience` (e.g. "5+ years of experience")
- [x] Displays `locationCity`, `locationCountry` (e.g. "Ho Chi Minh City, Vietnam")

### Social Links
- [x] Maps `socialLinks[]` to icon buttons
- [x] Platform enum → Lucide icon name mapping: GITHUB→github, LINKEDIN→linkedin, TWITTER→external-link (twitter icon not in icon set), BLUESKY→globe, STACKOVERFLOW→code, DEV_TO→code, HASHNODE→code, WEBSITE→globe, OTHER→external-link
- [x] Each link opens in new tab
- [x] Only shows platforms that have entries in socialLinks array

### Resume Download
- [x] "Download Resume" button/link
- [x] Links to `resumeUrls[currentLocale]`
- [x] Hidden if no resume URL for current locale
- [x] Uses download icon from design system

### JSON-LD SSR Injection
- [x] Fetch JSON-LD during SSR (server-side, not client-side)
- [x] Inject `<script type="application/ld+json">` into `<head>` via DOCUMENT injection
- [x] JSON-LD locale matches page locale
- [ ] Validate generated JSON-LD structure is valid Schema.org Person (done by API — backend concern)

### Graceful Fallback (PRF-004 edge case)
- [x] If Profile API returns null/404 → show placeholder content (not an error page)
- [x] Hero still renders with fallback text ("Portfolio in progress" or similar)
- [x] No console errors when Profile not yet created

### Multi-language
- [x] All translatable fields respond correctly to locale switch (en/vi)
- [x] Resume URL switches locale
- [ ] JSON-LD regenerated with new locale on language change (SSR only — language switch is a client UI concern)

## Technical Notes
- SSR data fetching: use Angular `APP_INITIALIZER` or route resolver to fetch Profile on server. Store in Signal or service state.
- `getLocalized()` utility (from task 206 shared lib, or implement inline): `field[locale] || field['en'] || ''`
- Social icon mapping: add missing icons to landing icon component if GITHUB/LINKEDIN not already there (check existing 32 icons)
- JSON-LD injection: in SSR context, use `@angular/platform-browser` `Meta`/`Title` services or inject into `DOCUMENT` head directly
- Keep the existing hardcoded projects section for now — Projects module will replace it later

## Files to Touch
- New or Update: `libs/landing/shared/data-access/src/lib/profile.service.ts`
- Update: `libs/landing/feature-home/src/lib/feature-home/feature-home.ts` (inject ProfileService, use Signal)
- Update: `libs/landing/feature-home/src/lib/feature-home/feature-home.html` (replace hardcoded values)
- Update: landing app config/server (SSR JSON-LD injection)
- Possibly: landing icon component (add missing social platform icons)

## Dependencies
- 211 (API public endpoint must exist)
- 206 (getLocalized utility if shared from there)

## Complexity: L

## Progress Log
- [2026-04-03] Started — implementing data layer, service, and component wiring
- [2026-04-03] Done — ProfileService created, FeatureHome wired, SSR JSON-LD injection, graceful fallback, multi-language signals all implemented. TWITTER icon mapped to external-link (twitter icon not in Lucide set).
