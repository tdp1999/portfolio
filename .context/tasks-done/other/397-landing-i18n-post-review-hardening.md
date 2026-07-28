# Task 397 — Landing i18n Post-Review Hardening

<!-- Đánh số lại 391 → 397 vào 2026-07-28: số 391 đã thuộc về
     tasks-done/epic-design-skill/391-design-skill-distill-universal.md. Nguyên nhân
     là lệnh dò số kế tiếp trong /ctx dùng `ls tasks-done/` phẳng, trong khi thư mục
     đó lồng theo epic nên không thấy task đã archive. Đã sửa ở plugin ctx 2.2.0.
     Commit 35feacd6 vẫn nhắc "388+391" — đó là số cũ, không sửa lại được lịch sử. -->

## Status: done

**Completed:** 2026-07-28

**Epic:** none (follow-up to task 388)
**Type:** hardening + bug fix

## Origin

Task 388 closed with 476 dictionary keys, four guardrail specs, and a clean build.
Reading the finished system back produced a seven-point review, which found one
user-visible bug, two performance mistakes made by the migration itself, three
structural gaps, and a lint suite that had never been run against the change.

## Scope

Six items, in the order they were fixed, plus lint.

### 1. SSR rendered English for every visitor

`LandingLocaleService.readInitial()` returned `'en'` on the server, despite the
service writing a `landing_locale` cookie whose own comment called it "future
first-paint language matching". A returning Vietnamese visitor got an English
first paint that flipped after hydration; a crawler saw only English.

- Server branch now reads `Cookie` then `Accept-Language` (q-weighted) via the
  Angular `REQUEST` token, mirroring the browser's `localStorage` →
  `navigator.languages` order.
- `Vary: Cookie, Accept-Language` on the SSR catch-all in `server.ts`.
- `/uses`, `/colophon`, `/document-engine` moved `Prerender` → `Server`: a
  prerendered route has no request and can only ship English. `/ddl` stays
  prerendered (English by nature).
- Parsers extracted to `landing-locale.util.ts` with 11 tests covering
  q-weights, `q=0`, cookie-name prefixes, and whitespace.

→ **ADR-029**, `.context/landing-ssr.md` §6.

### 2. The language toggle did nothing on `/privacy` and `/terms`

Reported by the user. Root cause: those pages read `?lang=` from the router while
the header toggle wrote `LandingLocaleService`. Two disconnected sources. Worse,
`useLegalPage.setLocale` — the function written to change it — had never been
called in any commit, so `?lang=` was unreachable from the UI while the header
still rendered a visibly dead toggle over it.

The behaviour predated 388 (commit `055a4782`, task 325), but 388 documented it as
intentional in ADR-028 point 5 and `landing-i18n.md` §4. That documentation was
the part this task owned.

Fixed with the user's chosen option: the site locale is the single source, the URL
is a reflection of it. `?lang=vi` on arrival adopts Vietnamese site-wide, the
toggle moves the page, and an effect writes the locale back into the query with
`replaceUrl` so canonical/hreflang stay accurate. Two effects, one per direction,
with the URL→state one reading `locale()` untracked so they cannot trade writes.

### 3. Two performance mistakes from the migration

- `contact.ts` × 4: `this.copy.t(key)()` inside a `computed` allocates a computed
  per recomputation and discards it — against the rule `landing-i18n.md` §3
  already stated. Now `resolveCopy(key, this.locale())`.
- `blog.share-row.ts` × 2: labels were methods called from the template, so they
  ran `resolveCopy` on every change-detection pass. The clipboard state is now
  read through `viewChild(CopyToClipboardDirective)` and both labels are
  computeds. A sweep confirmed no other template-invoked `resolveCopy` remains.

### 4. Interpolation was unchecked at the call site

21 sites filled slots with `.replace('{n}', String(x))`. A misspelled or missing
slot shipped a literal brace.

- `resolveCopy(key, locale, values)`, with `CopyValues<K>` derived from the entry
  via a template-literal type. Wrong name, missing name, and values against a
  slotless key are compile errors.
- `{{customer_name}}` in the `/document-engine` prose is product syntax, not a
  slot — excluded in the type and in the runtime.
- Fifth guardrail: a key with slots may not be read without them, and may not
  appear in a `.html` file at all. Probed red before green.
- Found and fixed while probing: the `@ts-expect-error` type assertions are not
  enforced by ts-jest (transpile only) but *are* by `tsc -p tsconfig.spec.json`,
  which also surfaced a latent type error in `landing-copy.spec.ts`.

### 5. The document head was half-frozen at `index.html`

No page except `/` set `twitter:*`, so every share card on X showed the English
site default. `og:url` pointed at the homepage regardless of what was shared,
`og:locale` did not exist, and `/projects/:slug` never set `og:title`.

`LandingMetaService.apply(LandingPageMeta)` now derives eleven tags from one
declaration, owns `canonical` (legal pages kept only their `hreflang`
alternates), and clears page-specific tags such as `noindex` and `article:*` on
the next apply. Twelve pages migrated; `Title`/`Meta` are no longer injected
outside the service. `DEFAULT_TITLE`/`DEFAULT_DESCRIPTION` deleted — module-load
English constants that ADR-029 made wrong, and that had been serving English
metadata to Vietnamese visitors on the home page.

→ **ADR-030**.

### 6. Dictionary size — decision, not refactor

Kept as one eager object with both locales; per-locale splitting costs a round
trip before first paint and per-route splitting costs the synchronous resolver
that keeps SSR trivial. A size test fails at 700 keys / 64 KB (current: 476 /
~42 KB) and its message names the answer for when it fires: split per **route**,
both locales together.

### 7. Lint

Never run against 388. Findings:

- 5 errors in `ddl-mega-menu.html` (`interactive-supports-focus` on Escape
  containers) → `tabindex="-1"`.
- **3 module-boundary errors introduced by 388**: `shared/data-access` importing
  the dictionary and locale service from `shared/ui`. Fixed by placement, not by
  changing the rule — `landing-meta.*` and the contact-error mapper moved to
  `shared/ui/src/services/`, where `LandingLocaleService` already lived.
  `shared/data-access` is for things that talk to the API.
- 2 pre-existing console errors (`no-unused-expressions`,
  `SectionTabsLayout` → `SectionTabs` across 8 files).
- 14 warnings: `member-ordering`, `naming-convention`, `file-purity`, and four
  unused imports left behind by 388.

Workspace lint is now **0 errors across 43 projects**. Twenty warnings remain,
all `file-purity` / `member-ordering` in three console feature libs
(`feature-project`, `feature-skill`, `feature-ddl`) that this change does not
touch — landing is clean on both counts.

An earlier pass reported "0 warnings" as well. That was wrong: the run read from
the Nx cache, which prints `All files pass linting` per project without replaying
warnings. Warning counts are only trustworthy behind `--skip-nx-cache`.

## Pre-commit review — five real bugs, all in this changeset

A review pass before committing found five WARNINGs. Every one was verified
against the code rather than taken on report, and all five were genuine.

1. **Malformed cookie 500s the render.** `decodeURIComponent('%')` throws
   `URIError`, and `localeFromCookieHeader` ran it on a client-controlled header
   inside a field initializer with no `try`. One bad cookie would 500 every page
   for that visitor until they cleared it. The decode is gone entirely — the only
   values ever written are `en` and `vi`, so there was nothing to decode. Spec
   added.
2. **`applyDefaults()` on `NavigationStart` blanked the head on a TOC click.**
   Every in-page anchor is `[routerLink]="[]"` with a `[fragment]`, which is a
   real navigation, but no component is created — so nothing re-applied the head.
   Item 5 widened the blast radius of a pre-existing two-tag reset to eleven tags
   plus the canonical. Now skipped when the path is unchanged.
3. **Lost update in the legal locale↔URL sync.** The state→URL effect guarded on
   `route.snapshot`, which does not update until a navigation activates, so a
   fast double toggle could skip the second write and let the first land in the
   language the user had just left. Guards on the last value the effect itself
   wrote instead.
4. **`hreflang` alternates leaked off the legal pages**, since nothing removed
   them on destroy. Every later page advertised alternates pointing at
   `/privacy`. Cleared via `DestroyRef`.
5. **`ResultsCount` lost pluralization on five `/ddl` call sites** that pass only
   `unit`. CLAUDE.md makes `/ddl` the canonical spec surface for landing, so it
   is the one place the broken form must not ship. `unitPlural` added.

Worth naming: **two of the five were introduced by this task**, not inherited —
the head reset and the DDL plural regression. The review was the only thing that
caught them; tests, lint, tsc and the build were all green.

## Acceptance criteria

- [x] SSR renders the visitor's locale on first paint, with `Vary` set
- [x] The header toggle changes the language on `/privacy` and `/terms`
- [x] `?lang=vi` deep links still work and still server-render Vietnamese
- [x] canonical + hreflang remain correct after the change
- [x] No nested-computed or template-invoked `resolveCopy` call sites remain
- [x] Slot fills are typed; a bare read of a slot key fails a spec
- [x] Every page sets a complete, locale-correct head including `twitter:*`
- [x] Dictionary size has an enforced ceiling and a recorded split axis
- [x] `nx run-many -t lint --all --skip-nx-cache` passes with zero errors
- [x] Pre-commit review findings resolved (5 warnings, all verified as real bugs)
- [x] `nx build landing` and `nx build console` pass
- [x] Docs updated: ADR-029, ADR-030, ADR-028 amendment, `landing-i18n.md`,
      `landing-ssr.md`

## Verification

- 264 unit tests green across `ui` (231), `landing` (19), `feature-blog` (3),
  `landing-feature-*` (11).
- `npx tsc -p libs/landing/shared/ui/tsconfig.spec.json --noEmit` clean — this is
  what enforces the type-level assertions jest cannot see.
- `nx run-many -t lint --all --skip-nx-cache`: 43/43 pass, 0 errors, 20 pre-existing
  console warnings.
- `nx build landing --skip-nx-cache` and `nx build console`: pass.

**Browser pass: done by the user, 2026-07-28.** The legal-page toggle and the
locale behaviour were validated by hand against a running dev server. This was the
check task 388 skipped, and it is the one that found the bug in the first place.

**One fix came out of writing this up:** `AboutPage.presetLocale` seeded only
`localStorage`, which the *browser* reads. After ADR-029 the *server* reads the
cookie, so the VI test would have server-rendered English and flipped on
hydration — every assertion in it racing hydration instead of reading a settled
page. It now seeds both, via `addCookies` (an `addInitScript` runs after the
server has already answered). `BASE_URL` moved to `fixtures/base-url.ts` because
`addCookies` needs an absolute origin and no public API exposes the configured
`baseURL` off a `Page`.

**Still not executed:** the landing e2e suite itself, which needs a dev server
this workspace does not start on its own. Playwright's default `Accept-Language`
is `en-US`, so the locale change does not shift any existing expectation; the
`presetLocale` fix above is the one place the suite actually depended on the old
behaviour.
