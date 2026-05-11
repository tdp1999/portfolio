# Task: Profile.workingHours BE field + Console form + FE wiring

## Status: done

## Goal

Add `workingHours` to the `Profile` aggregate so the home §3 bio card HOURS row stops hardcoding `09:00–18:00 ICT` on the FE. The visitor-TZ converter (already shipped) needs the owner's authoritative hours from the API.

## Context

Surfaced during the §3 bio card improvements pass (decision locked 2026-05-11). The home §3 HOURS row now exposes a "rotate" trigger that converts owner's working hours to the visitor's timezone. Conversion logic + UI shipped in `home-bio-card-grid.component.ts`. Today the owner-hours pair is hardcoded as `{ start: '09:00', end: '18:00' }`; the trailing TZ short label is derived from `Profile.timezones[0]` (already on the schema).

This task closes the loop so the values are author-editable from Console without code changes — same content-authoring rule as the rest of E5 (§E5 epic: "All landing prose must come from API fields").

## Scope

- **Schema**: `Profile.workingHours` as a nullable JSON value with shape `{ start: 'HH:mm'; end: 'HH:mm' }`. The trailing TZ short label keeps deriving from `Profile.timezones[0]` (no duplicate field).
- **BE**: domain value object → repository mapper → DTO / presenter → command schema → command handler → query exposure on `getPublicProfile`.
- **Console**: add the field to the identity/availability section form (24h `<input type="time">` for start + end, validated with Zod, default `09:00 / 18:00`).
- **FE**: replace the `ownerHours` constant in `home-bio-card-grid.component.ts` with the value from `PublicProfileResponse.workingHours`, falling back to `{ start: '09:00', end: '18:00' }` when null.

## Acceptance Criteria

- [x] `prisma-migrate` skill runs: `Profile.workingHours` column added (JSONB, nullable), expand/migrate/contract pattern not required (additive).
- [x] Domain VO `WorkingHours.create({ start, end })` validates `HH:mm` (00:00 – 23:59), rejects `end <= start`, has `toJSON()`.
- [x] `getPublicProfile` returns `workingHours: { start, end } | null`.
- [x] Console form: time inputs land next to the timezone selector, persist via existing per-section save. Shipped via shared `<console-time-picker>` + `<console-timezone-picker>`. E2e deferred.
- [x] FE: `home-bio-card-grid.component.ts` reads `profile.workingHours`, removes the inline constant; SSR-safe (no flash if value is null).
- [x] When the visitor's resolved IANA timezone matches `Profile.timezones[0]`, the rotate trigger stays hidden (logic already in place — verify after wiring).

## Out of scope

- Multi-day working hours (Mon–Fri vs Sat schedule). V1 = single uniform window.
- DST handling beyond what `Intl.DateTimeFormat` already does at conversion time.
- A11y refinement of the time-input UI in Console (separate task if needed).

## Files (anticipated)

- `apps/api/prisma/schema.prisma` — new column
- `apps/api/src/modules/profile/domain/value-objects/working-hours.{ts,spec.ts}`
- `apps/api/src/modules/profile/domain/entities/profile.entity.ts` — add prop
- `apps/api/src/modules/profile/application/profile.dto.ts` + `profile.presenter.ts`
- `apps/api/src/modules/profile/application/commands/update-profile-*.command.ts` + schema
- `apps/api/src/modules/profile/infrastructure/repositories/profile.repository.ts` + mapper
- `libs/landing/shared/data-access/src/lib/profile.types.ts` — add field
- `libs/console/feature-profile/src/lib/sections/identity-section/...` — form controls
- `libs/landing/feature-home/src/lib/bio-card-grid/home-bio-card-grid.component.ts` — consume

## Dependencies

- Existing: 277 (Profile.timezone via API), 284 (bio card grid shipped)
- None blocking; can be parallelized with other E5 polish

## Complexity: M

## Notes

The FE-side conversion + type-out animation is already shipped; this task only swaps the data source from hardcoded → API-driven. Hardcoded fallback remains as a safety net for environments without the column populated.
