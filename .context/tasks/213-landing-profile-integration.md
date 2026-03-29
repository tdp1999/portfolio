# Task: Landing page profile integration — replace hardcoded data

## Status: pending

## Goal
Replace all hardcoded personal data on the landing page with dynamic Profile data fetched from the public API, including SSR JSON-LD injection.

## Context
The landing page currently shows hardcoded name "Phuong", title "Full-stack developer", placeholder avatar, and hardcoded projects. This task replaces all personal info with dynamic Profile data. It establishes the SSR data-fetching pattern that future modules (Projects, Experience) will reuse.

## Acceptance Criteria

### Profile Data Service
- [ ] `ProfileService` in `libs/landing/shared/data-access/` (or existing data-access lib)
- [ ] `getPublicProfile(): Observable<PublicProfileResponse | null>` — calls `GET /profile`
- [ ] `getJsonLd(locale: string): Observable<JsonLdObject>` — calls `GET /profile/json-ld?locale=en|vi`
- [ ] Handles 404 gracefully (returns null — Profile not yet created)
- [ ] Inject `HttpClient`

### Hero Section
- [ ] Displays `fullName[currentLocale]` (replaces hardcoded "Phuong")
- [ ] Displays `title[currentLocale]` (replaces hardcoded "Full-stack developer")
- [ ] Displays `bioShort[currentLocale]` (replaces hardcoded bio snippet)
- [ ] Displays avatar image from `avatarUrl` (replaces placeholder icon)
- [ ] Avatar: shows `<img>` if `avatarUrl` available, falls back to placeholder icon if null
- [ ] Availability badge: if `isOpenToWork` true, shows badge with openTo labels

### About Section (if exists) or Hero Extension
- [ ] Displays `bioLong[currentLocale]` if available
- [ ] Displays `yearsOfExperience` (e.g. "5+ years of experience")
- [ ] Displays `locationCity`, `locationCountry` (e.g. "Ho Chi Minh City, Vietnam")

### Social Links
- [ ] Maps `socialLinks[]` to icon buttons
- [ ] Platform enum → Lucide icon name mapping: GITHUB→github, LINKEDIN→linkedin, TWITTER→twitter, BLUESKY→globe, STACKOVERFLOW→code, DEV_TO→code, HASHNODE→code, WEBSITE→globe, OTHER→external-link
- [ ] Each link opens in new tab
- [ ] Only shows platforms that have entries in socialLinks array

### Resume Download
- [ ] "Download Resume" button/link
- [ ] Links to `resumeUrls[currentLocale]`
- [ ] Hidden if no resume URL for current locale
- [ ] Uses download icon from design system

### JSON-LD SSR Injection
- [ ] Fetch JSON-LD during SSR (server-side, not client-side)
- [ ] Inject `<script type="application/ld+json">` into `<head>` via Angular `Meta` service or `DOCUMENT` injection
- [ ] JSON-LD locale matches page locale
- [ ] Validate generated JSON-LD structure is valid Schema.org Person

### Graceful Fallback (PRF-004 edge case)
- [ ] If Profile API returns null/404 → show placeholder content (not an error page)
- [ ] Hero still renders with fallback text ("Portfolio in progress" or similar)
- [ ] No console errors when Profile not yet created

### Multi-language
- [ ] All translatable fields respond correctly to locale switch (en/vi)
- [ ] Resume URL switches locale
- [ ] JSON-LD regenerated with new locale on language change (or only on SSR)

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
