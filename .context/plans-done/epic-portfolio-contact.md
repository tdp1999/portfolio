# Epic: Contact module — `/contact` hub + home retreat + BE hardening

> Parent: [Initiative: Portfolio](./initiative-portfolio.md)
> Status: completed (closed 2026-05-21). All launch-critical FE + BE + privacy work shipped. C19 (`/now` page) extracted to standalone task 328 — not part of this epic. C28c (orphan-const sweep) dropped by user; pattern guidance retained for new code.
> Depends on: `epic-contact-message` (BE backbone, done), `epic-portfolio-e5-implementation` (landing platform).
> Feeds: launch readiness — contact is the conversion endpoint for both hiring and freelance audiences.

## Purpose

Replace the inline `mailto:`-only `#get-in-touch` section on home with a real, audited contact pipeline:

1. **Home section retreats** to a 1-col router that deep-links into `/contact?purpose=<chip>` — keeps the section, drops the visual right column, frees home from form weight.
2. **New `/contact` page** is the dedicated hub: hero (heading + soft SLA) → form (5 purpose chips + name/email/message + consent + Turnstile + honeypot) → channels card (email/GH/LinkedIn/Telegram + Zalo on VN locale) → relocated interactive globe.
3. **BE hardens** the existing `contact-message` module: adds `PRESS` to the purpose enum, bumps retention 12 → 18 months to match privacy policy, makes the daily purge cron timezone-explicit (ICT), wires Cloudflare Turnstile server-side verification.
4. **Privacy policy reflects the new `purpose` field** (§3.3) — already declares everything else.

The form is the load-bearing piece: privacy policy already promised it, the BE pipeline is 80% done from `epic-contact-message`, the only real product question is layout/voice on the FE.

## Non-goals

- **Conditional "Company / Budget / Timeline" fields for freelance** — keeps form clean. Defer until a freelance-heavy week proves the need.
- **CV placement on home** — explicitly dropped 2026-05-19. Home doesn't need a CV link on §07; bio card grid + hero already carry that affordance.
- **Booking link (Cal.com / Calendly)** — user explicitly deferred. Page reserves no slot; revisit later.
- **Status badge ("Available / Slow / Away")** — explicitly rejected in favor of a soft "usually within a few days" copy line. No console-controlled state.

## Decisions locked this session (2026-05-19)

These came out of the research+drill at the top of the session; ground truth for any future edit.

### Audience & UX

- **Audience scope**: all four — recruiter, freelance client, dev/community, press. The 5-chip purpose selector is the routing primitive (no per-audience form variants).
- **Purpose chips** (FE-facing labels):
  - `hire` → "Hire me" / "Tuyển dụng"
  - `freelance` → "Freelance"
  - `collab` → "Collab" / "Hợp tác"
  - `press` → "Press / podcast" / "Báo chí"
  - `hi` → "Just say hi" / "Chào hỏi"
- **Default chip**: `hi` when no `?purpose=` query param is present.
- **SLA copy**: "Usually within a few days" / "thường phản hồi trong vài ngày". No hard 48h commitment. No badge.
- **Form placement**: dedicated `/contact` hub, **not** inline on home, **not** modal.

### Home `#get-in-touch` retreat

- **Globe moves to `/contact`**. Home loses its visual right column.
- **Section stays**, becomes 1-col, router-first.
- **Winning variant: G** (picked 2026-05-19) — centered, 3-purpose CTAs + email fallback row. Other DDL variants (A–F) deleted in the C10 sweep (DDL sandbox graduates once a winner ships).
- **Buttons → links**: switched from `landing-button` (action) to `landing-link` (navigation). `?purpose=<chip>` preselects the matching chip on `/contact`.
- **No CV strip on §07** — explicit drop, see Non-goals.

### Channels list

User-picked, surfaced on `/contact`:

| Channel | Visibility | Source |
|---|---|---|
| Email (copy button) | Both locales | `Profile.email` |
| GitHub | Both locales | `Profile.socialLinks[platform=GITHUB]` |
| LinkedIn | Both locales | `Profile.socialLinks[platform=LINKEDIN]` |
| Telegram | Both locales | `Profile.socialLinks[platform=TELEGRAM]` (may require enum extension) |
| Zalo | **VN locale only** | `Profile.socialLinks[platform=ZALO]` (may require enum extension) |

Cal.com, Twitter/X, Bluesky deliberately excluded. **All channels are profile-driven** — no hardcoded handles. If a platform isn't in `socialLinks`, the row hides.

### Anti-spam stack

Defense in depth — none of these alone is sufficient:

1. **Honeypot `website` field** — hidden via off-screen positioning, bots fill it, BE silent-accepts without persisting.
2. **Cloudflare Turnstile** — server-verified token via `/siteverify`. Dev-bypassed when `TURNSTILE_SECRET_KEY` is unset.
3. **Application-layer rate-limits** — 3 submissions per email per hour, 5 per IP per hour. Plus `@Throttle 5/h` controller decorator.
4. **Disposable-email filter** — `isDisposableEmail()` check before persistence.
5. **(Implicit)** Zod validation upfront.

### Data flow & retention

- **IP** is SHA-256 hashed before storage (rate-limit lookup uses same hash).
- **Retention**: 18 months exactly (`EIGHTEEN_MONTHS_MS`). Daily purge cron at 03:00 ICT (`Asia/Ho_Chi_Minh`).
- **Email pipeline**: auto-reply to submitter + admin notification to `ADMIN_NOTIFICATION_EMAIL`, both via Resend. Reply-to should be the submitter's email so reply is one-click (verify this is wired correctly in `EmailTemplate`).
- **Console messages page** (admin) already exists from `epic-contact-message`. The `PRESS` enum addition unlocks filtering by press inquiries.

## Architectural notes

### FE → BE purpose mapping

The FE uses lowercase chip ids; the BE Prisma enum uses uppercase semantic values. Mapping table in `libs/landing/shared/data-access/src/lib/contact-form.types.ts`:

```ts
hire      → JOB_OPPORTUNITY
freelance → FREELANCE
collab    → COLLABORATION
press     → PRESS              // requires Prisma migration (this epic)
hi        → GENERAL
```

The service performs this mapping (and the `consentGivenAt = new Date().toISOString()` synthesis) so callsites stay clean per the "no payload 1:1 re-mapping" rule.

### Wire contract

- **Endpoint**: `POST /api/contact-messages` (matches the existing controller — *not* `/api/landing/contact` as task 327 originally drafted).
- **Wire payload** (`ContactSubmitPayload`):
  ```
  { name, email, message, purpose: BackendContactPurpose, locale: 'en'|'vi',
    consentGivenAt: ISO8601 string, website, turnstileToken? }
  ```
- **FE-facing input** (`ContactFormInput`) is the cleaner shape the page passes to the service.

### Turnstile lifecycle (FE)

- Site key is currently a placeholder constant `TURNSTILE_SITE_KEY` in `contact.page.ts`. **Must be replaced with a real Cloudflare-issued key before launch.**
- Script loaded lazily via `afterNextRender` (SSR-safe, browser-only).
- Token captured into a signal; submit blocks if site key is real but no token present.
- Widget re-rendered on `dismissSuccess()` because the form re-mounts after success.
- Dev-bypass: while site key starts with `placeholder`, FE skips widget; BE skips verification when `TURNSTILE_SECRET_KEY` is unset (logs a warning).

### Privacy policy commitment

Already declared in §3.3 of `.context/legal/published/privacy-policy.{en,vi}.md`:
- Fields stored: name, email, message, IP (hashed), timestamp
- Retention: 18 months
- Legal basis: explicit consent

**Gap**: `purpose` field isn't declared yet. Adding `PRESS` to the enum and surfacing the chip on the form changes what gets stored — privacy policy needs the field listed.

## Work breakdown

### Done in-session (2026-05-19)

| ID | Item | Notes |
|---|---|---|
| ✅ C1 | DDL: stage 4 variants on `/ddl/get-in-touch` | A/B/C/D side-by-side; CV strip retained |
| ✅ C2 | Build `/contact` page | hero + form + channels + globe; route wired; SSR `RenderMode.Server` |
| ✅ C3 | Wire `ContactFormService` | normalizes FE→BE shape, posts to `/api/contact-messages` |
| ✅ C4 | BE audit | gap list captured — module was 80% done from prior epic |
| ✅ C5 | BE: add `PRESS` enum + bump retention 12→18mo + ICT cron timezone | schema + entity + job |
| ✅ C6 | BE: Turnstile verification | `TurnstileVerifyService` + handler wiring + DTO + module providers + spec mock |
| ✅ C7 | `.env.example` documents `TURNSTILE_SECRET_KEY` | site key remains FE constant |
| ✅ C8 | Prisma migration applied | `20260519091159_add_press_purpose_and_18mo_retention` — local DB in sync |
| ✅ C13 | Privacy policy §3.3 `purpose` field | EN + VI updated; "Last updated" bumped to 2026-05-19 |
| ✅ C15 | Spec: Turnstile-fail path | one new test case in `submit-contact-message.command.spec.ts` (9/9 pass) |
| ✅ C24 | DDL center-aligned variants E/F/G | Mirror A/B/D; C skipped (pills center awkwardly); intro lede + Notes updated |
| ✅ C25 | Meta/title persistence fix (F6) | `LandingMetaService.start()` resets `<title>`+description on `NavigationStart`; wired in `App` constructor |
| ✅ C28 | FE error mapping for submit | `mapContactSubmitError(err, locale)` in `data-access`; surfaces `CONTACT_MESSAGE_DISPOSABLE_EMAIL` / `RATE_LIMITED` / `INVALID_INPUT` / `SPAM_DETECTED` as localized inline copy instead of generic "something went wrong" |
| ✅ C29 | Resend dev-send gate fix | `ResendEmailService` now sends whenever `RESEND_API_KEY` is real (not `re_dev_placeholder` / `xxxx` pattern), regardless of `NODE_ENV`. Dev can opt-in to real sending just by setting the key. 6/6 specs pass. |
| ✅ C30 | Captcha re-render after success (Turnstile fix #2) | `dismissSuccess()` now uses `afterNextRender(injector)` instead of `queueMicrotask` — old stale widgetId is dropped, new widget mounts into fresh slot after Angular re-renders the form. |
| ✅ C31 | Subject auto-derived (fix #3) | `deriveContactSubject(purpose, name, locale)` in `application/utils/purpose-labels.ts`; handler synthesizes `"[Hire me] John Doe"` style subject — no longer "(empty)". DTO also fixed: `PRESS` added to Zod enum (was silently rejected by validation). |
| ✅ C32 | Purpose humanized in emails (fix #4) | `humanizePurpose(purpose, locale)` maps `GENERAL → "Just saying hi"/"Chào hỏi"`, etc. Auto-reply uses submitter's locale; admin notification stays EN. |
| ✅ C33 | Entity spec retention catch-up | `contact-message.entity.spec.ts` updated from "12 months" → "18 months" (leftover from C5). 77/77 contact-message specs pass. |
| ✅ C10 | Apply variant G to home `#get-in-touch` | Centered 1-col router (eyebrow → heading → copy → 3 CTAs → mailto fallback). Globe gone. CTAs deep-link to `/contact?purpose=…`. Component now self-sources its data from `ProfileService` (parent template passes nothing). DDL `/ddl/get-in-touch` route + page deleted — sandbox graduated. |
| ✅ C17 | Archive task 327 | Moved to `.context/tasks-done/327-landing-contact-form.md`; status header bumped to `superseded (archived 2026-05-19)` with a pointer to this epic. |
| ✅ C12+C18 | Profile-driven `/contact` channels | `Profile.email` + `Profile.socialLinks` drive the channel list (no hardcoded handles). Locale-aware Zalo gating preserved. **Schema change**: `SocialPlatform` Prisma enum extended with `TELEGRAM` + `ZALO`; migration `20260519104905_add_telegram_zalo_social_platforms` applied locally. Display labels added in `enum-labels.ts` + console `SOCIAL_PLATFORM_OPTIONS` + shared `SOCIAL_PLATFORM` constant. Social-row icons fall back to `external-link` for both (no Lucide brand icon for Telegram/Zalo). |
| ✅ C27 | F7 — Email templates graduated | V1 picked for both auto-reply + admin notification 2026-05-19. New `email-shared.util.ts` holds tokens (`EMAIL_TOKENS`), `wordmark()`, `wrapEmail()` shell, and the solid-accent `ctaButton()` — both production templates render through the same scaffold (no duplicated chrome). Auto-reply ships EN + VI; admin notification stays EN-only by design. DDL page kept as historical reference with the V1 entries annotated `picked, shipped 2026-05-19`. 12/12 email-template specs pass after a copy-string update (`"New Contact Message"` → `"just wrote in"`). |
| ✅ C35 | Turnstile resilience — auto-reset + manual retry | `error-callback` / `expired-callback` now drive a `turnstileStatus` signal. When status flips to `error` or `expired` the form shows an inline message + "Refresh" button that calls `window.turnstile.reset()` (or a full re-render if the widget never mounted). Root causes documented in the handler comment: ~5 min token TTL, transient iframe network blip, ad-blocker/CSP interference, script load failure. |
| ✅ C21 / C22 | F2 — Landing form lib shipped + `/contact` rewired | **Variant B "sunken card"** picked from `/ddl/form-input` (DDL page kept as historical record; A/C variants annotated). New shared primitives — each in its own component folder with a dedicated SCSS file as the user requested: `landing-input` (existing replaced — same API, new theme + new attrs `inputId`/`autocomplete`/`inputmode`/`maxLength`/`ariaDescribedBy`/`hasError`), `landing-textarea` (new), `landing-checkbox` (new — native input overlays the visual box so it's interactable for AT + Playwright `.check()`), `landing-radio` + `landing-radio-group` (new — group is a `model<string\|null>`-powered `ControlValueAccessor` that radios `inject()` to publish their pick), `landing-form-field` (new — wraps label + projected control + meta row). **Hint/error contract** (locked): hint right-aligned, error left-aligned, **error wins** when both are set, meta row collapses when neither. `/contact` form rewired through the lib: every native `<input>` / `<textarea>` / `<label>` removed; per-field error computeds bridged via `toSignal(merge(form.events, ...child.events))` so each child blur ticks the signal — `FormGroup.events` alone only fires once for the group-level touched flip, missing every subsequent child blur (caught + fixed mid-implementation). DDL: `/ddl/form-lib` showcases the shipped suite with a live reactive `FormGroup` + JSON debug panel; index updated. **Test coverage**: 73 Jest specs across the 5 primitives (contract for hint/error priority + CVA + a11y attrs) + 23 Playwright E2E (`contact.spec.ts` extended with F1–F10 regression including blur-then-fix, new `form-lib.spec.ts` smoke including the multi-field-touched regression that surfaced the FormGroup.events bug). All green. |
| ✅ C26 | F2 cleanup — outdated "landing input" DDL section retired | Folded into the C21 graduation: `/ddl/form-input` carries a "picked, shipped 2026-05-21" annotation on Variant B and a pointer to `/ddl/form-lib` for the live suite. Per the no-delete DDL rule, the 3-variant comparison stays as historical record; no separate deletion needed. |
| ✅ C28b | F8 — Orphan-const audit complete (sweep deferred) | Inventory grouped into 4 buckets across `apps/landing` + `libs/landing` + `apps/api`. **Bucket 1 (env-derived)** — 5 hotspots: `auth-cookie.service.ts` (`IS_DEV`, `COOKIE_DOMAIN`), `auth.config.ts` (`jwtSecret` / `jwt*Expiry`), `turnstile-verify.service.ts` (`TURNSTILE_SECRET_KEY`), `FRONTEND_URL` (duped in 3 auth commands), `apiBase` / `PORT` (`main.server.ts`, `server.ts`). Direction: lift into typed config services / Angular `InjectionToken`. **Bucket 2 (external URLs)** — `SITEVERIFY_URL` in `turnstile-verify.service.ts`. Direction: per-module `*.constants.ts`. **Bucket 3 (cross-module duplicates)** — `THIRTY_DAYS_MS` (auth-cookie + purge-expired-messages), `INVITE_EXPIRY_MS` (invite-user + resend-invite), plus rate-limit consts in `submit-contact-message.command.ts`. Direction: shared `durations.constants.ts` + per-module config file. **Bucket 4 (file-local, leave alone)** — `media.constants.ts`, DDL mock data, `SIXTY_SECONDS`, `ITALIC_PATTERN`, `EMAIL_TOKENS`. **Total: ~18 actionable items across ~15 files.** Sweep itself NOT scheduled (per F8: "don't refactor existing code aggressively") — captured as the open task **C28c** below. New code in this epic already follows the new pattern (e.g. `contact-form.service.ts` keeps its const local; new shared util `email-shared.util.ts` co-locates `EMAIL_TOKENS` with its consumers). |
| ✅ C20 | F1 — Hero pattern synced across `/contact`, `/uses`, `/colophon` | New shared primitive `LandingPageHeroComponent` (`libs/landing/shared/ui/.../page-hero/`) — composition of `landing-section-header` + lede slot. Inputs: `eyebrowLabel`, `accentFirst`, `align` (left | center), `size` (lg | md | sm). Heading projected as default slot (wrap accent words in `<em>`); lede projected via `[hero-lede]` attribute selector — the `<p>` styling lands on `.lph__lede > p` so each page no longer redeclares italic-display rhythm. **Sync**: `/contact` uses `align="left"` with eyebrow `['00', 'Contact']` (editorial talk-to-me voice, now has italic-em on "talk"/"chuyện"); `/uses` uses `align="center"` with `['01', 'Uses']` (indexed library); `/colophon` uses `align="center"` with `['02', 'Colophon']`. Orphan SCSS removed (`.contact-page__hero-*`, `.uses-page__sub`, `.colophon-page__sub`). DDL showcase added at `/ddl/page-hero` with 4 variants (A–D × left/center × md/sm/lg) + index entry per the DDL-as-sandbox rule. Type-check clean across landing app + shared/ui lib. |
| ✅ C34 | `Profile.phoneZalo` proper modelling | New `phoneZalo String? @db.VarChar(20)` column on `Profile` (migration `20260521040612_add_profile_phone_zalo`, applied locally). Threaded end-to-end: `Contact` VO + `equals()`, `IProfileProps` + `ICreateProfilePayload`, `Profile` entity (factory, load, toProps), `ProfileMapper`, `ProfileRepository.updateContact`, `UpdateProfileContactSchema` (uses shared `PhoneSchema.nullable()`), `UpdateProfileContactHandler`, `ProfilePublicResponseDto` (public — needed for `/contact` surfacing), `ProfilePresenter.toPublicResponse`. Console: input added in `ContactSection` (PUBLIC bucket, alongside email — placeholder explains it's VN-locale only on `/contact`); `AdminContactAddressSection.save()` preserves the sibling `phoneZalo` from `initialData` so the parallel `updateContact` fan-out doesn't clobber it. Landing: `PublicProfileResponse` extended; `/contact` channel list now appends a Zalo row (VN locale, `href="https://zalo.me/<digits-only>"`, label "Zalo") when `profile.phoneZalo` is set. 119/119 BE profile specs pass; 17/17 console-feature-profile specs pass; landing + console + data-access tsc clean. Note: `SocialPlatform.ZALO` enum value from the earlier in-session migration stays as-is (Postgres enum removal is painful, and the value is unused by code paths). |
| ✅ C14 | E2E test for `/contact` submission | `apps/landing-e2e/src/contact.spec.ts` — 5 specs, all green over 3 consecutive runs. Covers chip preselect from `?purpose=hire`, default `'hi'` when no query, full valid submit → success state, payload shape (asserts `purpose: PRESS` in captured POST body), and the validation gate (empty submit keeps the user on the form + shows the inline name error). **Stubbing strategy**: `stubTurnstile()` installs a `window.turnstile` shim via `addInitScript` so the real Cloudflare widget never loads (also blocks `challenges.cloudflare.com/**` as a belt-and-suspenders measure). The BE submit endpoint is mocked at the Playwright route layer (`**/api/contact-messages`) instead of hitting the real handler — the Turnstile secret IS set in dev so a real token would be required end-to-end, and BE behavior is already covered by handler unit specs. **Hydration robustness**: SSR fills could race against Angular's hydration (a `.fill()` landing pre-hydration sometimes gets clobbered to empty). `fillAndConfirm()` re-asserts the input value after each fill and retries up to 3 times; `gotoContact()` waits for the form node + `networkidle`. Type-check passes; 5/5 pass in ~20s per run. |
| ✅ C23 | F4 — Globe caption + auto-rotate | `LandingGlobeComponent` extended with `autoRotate` input. Inside its rAF loop, when `autoRotate && !isDragging && !inIdleHold`, phi increments by `AUTO_ROTATE_STEP` (~30s per rotation, slow enough to read city labels). After a drag ends, auto-rotate pauses for `AUTO_ROTATE_RESUME_MS` (2s) so the user can land where they meant to. Wired on `/contact` with `[autoRotate]="true"`, plus a centered EN/VI caption under the globe ("Based in Ho Chi Minh City, working comfortably with teams across APAC and beyond. Drag to spin the globe." / "Mình ở TP.HCM, làm việc thoải mái với các đội ngũ trên khắp APAC và xa hơn. Kéo để xoay địa cầu."). Section labelled-by the caption so it stops being `aria-hidden` dead air. |
| ✅ C16 | Resend `replyTo` wired on admin notification | `SendEmailOptions.replyTo?` added; `ResendEmailService` forwards it to Resend's `replyTo` field when set; `submit-contact-message.command.ts` passes `replyTo: data.email` on the admin notification call so hitting "Reply" in the admin inbox lands a draft addressed to the submitter. Auto-reply stays without `replyTo` (recipient already is the submitter). 4 new specs lock the behavior — resend service spec asserts pass-through + omission, command spec asserts admin gets `replyTo` and auto-reply does not. 19/19 affected specs pass. |
| ✅ DDL get-in-touch | Restored 2026-05-19 | Earlier rule had said "delete DDL section once a variant graduates" — reversed. DDL pages stay as a historical record of how the section reached its current shape. The restored page (V1/V2/V3 globe sandbox from the prior commit) carries a new `Historical sandbox` lede noting the decision evolved past it. **Memory updated**: `feedback_ddl_replace_old_sections.md` deleted; new rule `feedback_ddl_keep_after_graduate.md` added in its place. |

### Closed out 2026-05-21

- **C19** — extracted to standalone task `328-landing-now-page` (post-launch, not contact-coupled).
- **C28c** — dropped per user. The F8 inventory in C28b stands as guidance for new code; no sweep scheduled.

## Review pass feedback — 2026-05-19

Captured from first review of the in-session work. Documented here for the next iteration; nothing resolved yet.

### F1 · Hero/heading pattern is out of sync across pages

- **Observation**: `/contact` hero doesn't match `/uses` and `/colophon` heros. Each child page is reinventing the layout.
- **Need**: extract the canonical "child page hero" pattern (eyebrow + heading + lede), document it in `.context/design/landing.md` or as a `landing-page-hero` shared component (or a component-bank doc), and sync `/uses`, `/colophon`, `/contact` to use the same primitive.
- **Risk**: shipping this before launch means touching three pages — moderate scope, but the consistency win is real.

### F2 · Form component library is missing (FE)

- **Observation**: `/contact` shipped with native `<input>`, `<textarea>`, `<input type="checkbox">`, native submit `<button>`. Violates the `feedback_ui_component_reuse` rule ("reuse → extend → create-shared"). Currently only a primitive `landing-input` exists; everything else is one-off.
- **Scope** (build as a shared form lib in `libs/landing/shared/ui/src/components/form/` or equivalent):
  - `landing-input` — review the existing one; ensure CVA correct, error state visual, hint slot
  - `landing-textarea` — new
  - `landing-checkbox` — new (consent UI lives on this)
  - `landing-form-field` — wrapper providing label / hint / error (single source of vertical spacing)
  - `landing-dropdown` / `landing-select` — new, prepare even though `/contact` doesn't use it yet
  - `landing-radio` + `landing-radio-group` — new, prepare
- **Hard requirements**:
  - 100% Angular Forms compatible (`ControlValueAccessor` for reactive + template-driven; ideally also signal-forms-friendly)
  - Each component gets a `/ddl/<name>` showcase page (per DDL-as-sandbox rule)
  - Each component gets a component-bank entry once design is locked
- **UI gate**: **user wants to confirm visual direction** for each new primitive before commit (especially input/textarea look, checkbox shape, dropdown open behavior). Note this in each individual task — propose mockups/variants first, ship after sign-off.
- **Cleanup**: delete the outdated "landing input" section from DDL once replacement lands (per DDL replace-old-sections rule).

### F3 · Reuse existing patterns I overlooked

- **"Send message" button**: shouldn't be a native `<button type="submit">` — there's already a solid+arrow button pattern in DDL (the `gt-cv-option (b)` section uses `landing-button variant="solid" arrow="right"`). Reuse that for the form submit action.
- **"Copy email" with inline-check feedback**: already a pattern in `/ddl/bio-improvements` (and possibly elsewhere). Find it, reuse the same micro-interaction (check icon + transient feedback) instead of the local Copy/Copied text toggle I wrote.

### F4 · Globe needs context + motion

- Add a short description / caption that explains what the globe represents (place, reach, "served from / talks to" — needs voice copy).
- Auto-rotate on idle if `landing-globe` supports it; if not, add a feature flag.

### F5 · DDL Get in Touch — add center-aligned variants

- Current A/B/C/D are all left-aligned. Add center-aligned counterparts (E = centered A, F = centered B, G = centered D, etc.) so user can compare alignment direction independently from CTA count.

### F8 · Orphan top-level consts pattern smell (2026-05-19)

- **Observation**: Many landing service/page files (and some API ones) lead with module-level `const FOO = …` declarations that are effectively orphan config — `SITEVERIFY_URL`, `TURNSTILE_SITE_KEY` in `contact.page.ts`, `RATE_LIMIT_WINDOW_MS` / `MAX_EMAILS_PER_HOUR` / `MAX_IP_SUBMISSIONS_PER_HOUR` in `submit-contact-message.command.ts`, the same pattern in several other files.
- **Why this hurts**: scattered config is invisible config. "Where is `SITEVERIFY_URL` defined?" should not require a grep. Env-derived values reaching into `process.env` via string keys from random module-level positions are especially hard to override per-environment.
- **Direction** (not a single sweep — a guideline):
  - Per-module URLs / endpoints / API constants → `<module>.config.ts` (or `<module>.constants.ts`) at the lib root, not buried inside a service file.
  - Env-derived values (`TURNSTILE_SITE_KEY`, `RESEND_API_KEY`, etc.) → Angular `InjectionToken` provided in `app.config.ts` (FE) or a typed config service (BE), not a `const` reaching into `process.env`.
  - Magic numbers that are file-local (e.g. timing constants used only inside one handler) — top-of-file `const` is OK if owned by that file.
  - Magic numbers that are cross-module (rate-limit windows, retention durations) → shared constants module.
  - **For new code**: ask "if someone wanted to change this in prod without redeploying, where would they look?" — that's where the const should live.
- **Audit & sweep**: this is C28b. Not urgent, low-priority background polish.

### F7 · Email templates look amateurish (post-launch test, 2026-05-19)

- **Observation**: Auto-reply + admin notification emails went out successfully after the dev-send gate was fixed, but the templates themselves are bare HTML tables + `font-family: sans-serif` with no branding. Looks like a stock transactional email circa 2008.
- **Scope** (build per-template):
  - **Auto-reply** (`contact-auto-reply.template.ts`) — sent to submitter, needs to feel like the brand (Newsreader display + Inter body fallback, accent color stripe, summary block as card not bullet list, signature line, privacy/unsubscribe legal line in footer). Both EN + VI.
  - **Admin notification** (`admin-notification.template.ts`) — sent to admin only, EN only by design. Functional but should still scan well: header row "New contact message — [purpose]", message body in card, "View in Console" CTA as button-styled link, sender metadata in compact card. No fluff.
- **Constraints**: email clients are CSS hell — inline styles only, table-based layout for Gmail/Outlook compat, web fonts via Google Fonts fallback (most clients strip them — design for system stack), dark mode opt-in via `@media (prefers-color-scheme: dark)`.
- **UI gate**: propose HTML mock (or rendered preview screenshot via Resend's preview API or [Litmus](https://www.litmus.com/) if available) before commit.

### F6 · Cross-cutting bug — meta/title persistence on navigation

- **Repro**: page A doesn't set meta/title → navigate to page B (which sets them) → navigate back to A → A still shows B's meta/title.
- **Root cause**: pages that update `Title`/`Meta` mutate global state, but pages that don't update them have no reset.
- **Fix direction**: either (a) every page declares its meta+title explicitly via route data + a centralized resolver, or (b) the app shell resets to a default on each `NavigationEnd` before page logic runs.
- **Scope**: not /contact-specific — affects the whole landing app. Flag for app-shell-level fix.

### Derived tasks from feedback

| ID | Item | Blocked by | Notes |
|---|---|---|---|
| ✅ C20 | F1 — Sync hero pattern across `/contact`, `/uses`, `/colophon` | done (shipped as `landing-page-hero` — see "Done in-session" table) |
| ✅ C27 | F7 — Redesign email templates (auto-reply + admin notification) | done (V1 picked + shipped, see C27 row above) |
| — C28c | F8 — Execute the orphan-const sweep | dropped 2026-05-21 per user. Inventory in C28b stands as guidance for new code only. |

## Open questions for the user

All earlier open questions resolved 2026-05-19. Outstanding UI sign-off gates are tracked inline in the work breakdown (C21 per-primitive, C27 DDL variants).

## References

- BE module: `apps/api/src/modules/contact-message/`
- FE page: `apps/landing/src/app/pages/contact/`
- FE service: `libs/landing/shared/data-access/src/lib/contact-form.{types,service}.ts`
- DDL: `apps/landing/src/app/pages/ddl/get-in-touch/`
- Privacy policy: `.context/legal/published/privacy-policy.{en,vi}.md` (§3.3)
- Original (superseded) task: `.context/tasks/327-landing-contact-form.md`
- Prior BE epic: `.context/plans-done/epic-contact-message.md`
