# Landing i18n — Static UI Copy

> How landing renders EN/VI. Read this before writing any user-visible string in
> `apps/landing/` or `libs/landing/`.
>
> Scope: **static UI copy** — strings that live in code. Authored content from the
> API is a different system; see §5.

---

## 1. The decision in one line

**Plain strings live in one dictionary. Copy carrying markup stays in `<landing-t>`.**

| Copy shape                                                                                  | Mechanism                     | Example                         |
| ------------------------------------------------------------------------------------------- | ----------------------------- | ------------------------------- |
| Plain text — label, lede, button, state, hint, error, aria-label, breadcrumb                | `LANDING_COPY` + pipe/service | `Send message` / `Gửi tin nhắn` |
| Carries markup — `<em>` accent, inline `<landing-link>`, `<time>`, a list, a whole document | `<landing-t>`                 | `Let's <em>talk</em>.`          |

A string dictionary cannot hold HTML without reintroducing a sanitizing problem,
and `<landing-t>` cannot reach an attribute. Neither replaces the other.

Rationale and alternatives considered: **ADR-028** in `decisions.md`.

---

## 2. Where things are

```
libs/landing/shared/ui/src/
├── services/copy/
│   ├── landing-copy.data.ts     ← THE dictionary. Every static string.
│   ├── landing-copy.types.ts    ← LandingCopyKey (closed union)
│   ├── landing-copy.util.ts     ← resolveCopy(key, locale) — pure
│   ├── landing-copy.service.ts  ← LandingCopyService.t(key, override?) → Signal
│   └── landing-copy.spec.ts
├── pipes/landing-copy.pipe.ts   ← `landingCopy` pipe
├── services/locale/             ← LandingLocaleService.locale() — the locale signal
└── components/t/                ← <landing-t>, the HTML-rich escape hatch
```

---

## 3. Reading copy

### In a template — the pipe

```html
<h2>{{ 'contact.form.srHeading' | landingCopy: locale() }}</h2>
```

Register `LandingCopyPipe` in the component's `imports`, and expose `locale` as
`protected` (Angular templates cannot reach `private` members).

**`locale()` is a required argument, and that is deliberate.** A pure pipe only
re-runs when one of its _inputs_ changes. If the pipe read the locale signal
internally, flipping the language toggle would not count as an input change and
the old text would stay on screen. Passing `locale()` makes the signal a real
input: pure, OnPush-safe, and no impure pipe firing on every change-detection
cycle.

It also makes the locale-override case fall out for free — see §4.

### In TypeScript — the service

For strings that must reach an attribute or an interface (`aria-label`, a
`BreadcrumbItem[]`, a `SegmentOption.label`), where neither projection nor a pipe
can go:

```ts
private readonly copy = inject(LandingCopyService);
protected readonly submitLabel = this.copy.t('contact.form.submit.idle');
```

`t()` returns a `Signal<string>` that already tracks the locale — no `computed`
wrapper, no subscription.

Inside a `computed` that is already tracking locale for other reasons, call the
pure function instead so you do not nest signals:

```ts
readonly breadcrumb = computed<readonly BreadcrumbItem[]>(() => {
  const locale = this.locale();
  return [
    { label: resolveCopy('common.breadcrumb.home', locale), href: '/' },
    { label: resolveCopy('common.breadcrumb.contact', locale) },
  ];
});
```

### Fallback chain

`requested locale → en → vi → the key itself`.

Returning the key (not an empty string) is intentional: a missing entry stays
visible in the UI instead of silently collapsing whatever laid out around it.

---

## 4. Locale overrides

**There is one locale signal, and everything follows it** —
`LandingLocaleService.locale()`. Two things are allowed to differ, for reasons
that are about the content, never about the mechanism.

**`/privacy` and `/terms` mirror the locale into `?lang=`.** They are the only
pages that need a distinct URL per language, because `hreflang` addresses URLs
and a signal has none. The URL is a *reflection*, not a second source of truth:
arriving with `?lang=vi` adopts Vietnamese site-wide, the header toggle moves
them like every other page, and an effect writes the locale back into the query
so canonical and hreflang describe the URL the visitor is on. `en` is the absence
of the parameter, matching `x-default`.

> This used to be an independence: the pages read `?lang=` and ignored the
> toggle. That left a language switcher visible on screen that did nothing, and
> made `?lang=` unreachable from the UI, since the `setLocale` written for it was
> never wired to a control. If you are tempted to decouple a page from the toggle
> again, the test is whether a visitor can still change the language *from that
> page*.

**A blog post reads in its own language.** `blog.detail` derives locale from
`post.language`, not the toggle, because a post is written in one language and
half-translating its chrome would be worse than leaving it. Components below it
take locale as an `input()`.

All three mechanisms accept an override:

```html
<landing-t [locale]="locale()">…</landing-t> {{ 'legal.terms.title' | landingCopy: locale() }}
```

```ts
this.copy.t('blog.share.x', this.postLocale); // pass the signal itself
```

Components that receive locale as an `input()` rather than from the service pass
that input signal the same way (`home.selected-work.ts` does this).

### First paint

The server picks the locale from the request — `landing_locale` cookie, then
`Accept-Language` — so SSR renders the visitor's language rather than English.
That is ADR-029 and `landing-ssr.md`; the thing to remember here is that a
**prerendered** route has no request and can only ship English, which is why
every localized page renders `Server`.

---

## 5. What is NOT in scope

**Authored content from the API** — `Profile.aboutLede`, `project.oneLiner`,
experience entries, blog bodies. Those are `{ en, vi }` objects owned by the
author in Console, with **prod as the source of truth**. They resolve through
`translatable` (pipe) / `getLocalized` (function) and must never be copied into
the dictionary.

The distinction that matters: _can the author change this string without a
deploy?_ Yes → API content. No → dictionary.

A page often uses both — `about.cta.ts` reads the authored heading and falls back
to a dictionary default:

```ts
computed(
  () => getLocalized(this.profile()?.ctaHeading, this.locale()) || resolveCopy('about.cta.heading', this.locale())
);
```

---

## 6. Adding new copy

1. Add the entry to `landing-copy.data.ts` under a page-namespaced key
   (`<page>.<block>.<slot>`), with a comment naming where it renders.
2. Both `en` and `vi` are required — the type enforces it. A genuinely
   untranslatable value (a proper noun, a unit) repeats itself.
3. Read it via the pipe or the service. Never index `LANDING_COPY` directly —
   the resolver owns the fallback chain.

### Interpolation

A value may carry `{slot}`s. The call site fills them with a values object, never
with `.replace()`:

```ts
resolveCopy('a11y.slide.position', locale, { n: index() + 1, total: count() });
```

`CopyValues<K>` is derived from the entry, so a misspelled slot, a missing one,
and values passed to a slotless key are all compile errors. Numbers go in as
numbers. In a template the same argument is the pipe's third:

```html
{{ 'blog.readTime' | landingCopy: locale() : { n: minutes() } }}
```

Two rules the specs enforce:

- **A key with slots may not be read without them.** The `values` argument has to
  stay optional in the type, because a dynamic key (`config.titleKey`) widens to
  the whole union; the contract spec closes that hole by scanning call sites.
- **A key with slots may not appear in a `.html` file at all.** The values it
  needs already live in the component, so the component resolves it into a
  computed and the template reads that. An object literal inside a binding is
  worse to read than a named computed, every time.

`{{double braces}}` are **not** slots. `/document-engine` quotes its own template
syntax in prose, and both the type and the resolver skip that form.

### Rules the tests enforce

- No entry may be empty in both locales.
- No value may contain an **em-dash** (`—`) or an **en-dash** (`–`). Em-dash
  reads as an AI tell; en-dash is visually confusable with a hyphen in source and
  trips the editor's ambiguous-character warning. Spell ranges out: `10 to 5000
characters`.

### Vietnamese copy rules

Full compounds (no clipping), full sentences with a subject, Southern vocabulary
(`nha` not `nhé`), and metaphors re-checked rather than calqued — a phrase that
works in English can be dead in Vietnamese. `Frontend Engineer` stays in English
and capitalized; technical terms stay in English verbatim.

### Accessibility copy

Text only assistive technology reads — `aria-label`, `sr-only` headings, `aria-live`
regions — is copy like any other and lives in the dictionary. It is also the copy
most likely to drift, because nobody proofreads what nobody sees. Four rules:

- **Generic vs surface-specific.** A label a _component_ owns goes under `a11y.*`
  (`a11y.button.close`, `a11y.nav.breadcrumb`). A label tied to one page goes in
  that page's block as `<page>.a11y.*`, next to the visible copy it sits beside.
- **A UI term a Vietnamese speaker already says in English stays English.**
  `slide`, `carousel`, `panel`, `editor`, `menu`, `tab`. Translating these makes a
  screen reader _less_ intelligible, not more. `aria-roledescription` values stay
  hardcoded English for the same reason — they override the announced role.
- **A landmark label is not a heading.** It answers "what region am I in", so it
  stays a noun phrase: no sentence, no final punctuation. When a heading and a
  landmark cover the same block, they get two keys, because screen readers
  announce them in different contexts.
- **The announced label may differ from the visible one, deliberately.** A visible
  `Prev` is a space concession; the announced label spells out `Previous page`. An
  icon carries context the label does not. When the two diverge, say why in a
  comment — otherwise the next reader "fixes" the mismatch.

Two landmarks must never share a name. Duplicate names are how a screen-reader
user loses track of which region they landed in — that is why the floating TOC and
the inline TOC on blog detail carry different labels for the same links.

---

## 7. Anti-patterns

| Don't                                                   | Do                                                   |
| ------------------------------------------------------- | ---------------------------------------------------- |
| `locale() === 'vi' ? 'Gửi' : 'Send'` for a plain string | add a key, read it through the pipe/service          |
| Parallel `FOO_EN` / `FOO_VI` constants                  | one dictionary entry                                 |
| A `{ en, vi }` object hand-rolled next to the component | one dictionary entry                                 |
| HTML inside a dictionary value                          | `<landing-t>`                                        |
| `LANDING_COPY['some.key']` at a call site               | `resolveCopy` / `t()` / the pipe                     |
| A string shipped in English only                        | add the `vi` side; the type will not let you skip it |
| `resolveCopy(k, l).replace('{n}', …)`                   | `resolveCopy(k, l, { n })` — typed against the entry |
| `this.copy.t('k')()` inside a `computed`                | `resolveCopy('k', this.locale())` — `t()` builds a computed, so this allocates one per recomputation |
| A method in a template that calls `resolveCopy`         | a `computed`; a method in a binding re-runs on every change-detection pass |

`locale() === 'vi'` is still correct for **logic** — choosing a resume URL,
gating a VN-only channel, picking a month-name array. Copy is the thing that
moves; branching is not.
