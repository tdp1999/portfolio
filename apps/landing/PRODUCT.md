# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The site serves four audiences at once, and the owner has explicitly refused to demote any of them:

1. **Hiring managers and tech leads.** Technical evaluators assessing depth before an interview or a referral. They skim fast, then go deep on one project or article, and they are reading for judgment rather than a feature list.
2. **Recruiters and HR screeners.** Non-technical first-pass screening against a role. They need role fit, stack, availability, and the resume inside a minute.
3. **Freelance and consulting clients.** Someone with a problem and a budget, assessing whether to engage the owner for a project. They need scope, proof of delivery, and a low-friction way to start a conversation.
4. **Peer engineers.** Arriving from a blog post, GitHub, or a shared link. Reading for the craft; the site's job with them is reputation and reach, not conversion.

**Audience conflict is resolved per surface, not globally.** When the recruiter's one-minute skim fights the peer engineer's deep read, there is no site-wide winner. Each surface names its own primary reader and is designed for that reader. Home and `/contact` serve the skim; `/projects/:slug`, `/blog/:slug`, and `/about` serve the deep read. Any future surface must declare which audience it centers before it is designed.

## Product Purpose

A multi-page professional portfolio and personal-brand hub for Phuong Tran, a Frontend Engineer. It presents career history, side projects, long-form case studies, written essays, and a blog, and it gives every audience above a way to evaluate the owner's work and get in contact.

Success is not a single conversion. All four of these count, and different surfaces are responsible for different ones:

- a case study or article read to the end (depth of engagement);
- a locale-matched resume download;
- a contact-form submission;
- being memorable enough to be referred to or returned to later.

## Positioning

Three things a neighboring portfolio could not truthfully copy. Future work must protect all three:

1. **A shipped, published library.** `@phuong-tran-redoc/document-engine-core` and `@phuong-tran-redoc/document-engine-angular` are real npm packages consumed by this very site, with their own dedicated surface at `/document-engine`. Evidence that the owner ships products, not only employer work.
2. **A public, browsable design language.** The `/ddl` surface exposes the site's own typography scale, primitives, spacing rules, and layout patterns as documented, inspectable pages. The craft claim is verifiable rather than asserted, and `/ddl` is the canonical spec that landing UI changes are made against.
3. **Bilingual English/Vietnamese as a first-class property.** Both languages are served on every surface, with per-field and per-entry fallback, a locale that survives the first paint, and locale-addressed legal pages. This is a designed-in property, not a translation layer bolted on.

The `/about` page's published working principles and its candid failures-and-lessons record are real content and real evidence, but the owner does **not** claim them as the differentiator. Treat them as substance, not as the position.

## Operating Context

- **Public site:** `thunderphong.com`, server-rendered, reached from search, GitHub, LinkedIn, shared article links, and direct recruiter traffic.
- **Authoring:** almost all content is authored by the owner through a separate Console application and served to the landing site through an API. Production is the source of truth for content. Two deliberate exceptions are authored in the codebase and ship with a release: the fixed interface wording (the `LANDING_COPY` dictionary), and the `/uses` and `/colophon` pages.
- **Reading situations vary sharply:** a recruiter on a phone between calls, a tech lead on a laptop with the repo open in another tab, a peer engineer arriving mid-article from a social link. All are first-time, unauthenticated, single-session visits with no onboarding and no saved state.
- **Language is a site-wide preference**, not part of the address, except on the legal pages where the two versions are indexed separately by search engines.

## Capabilities and Constraints

**Surfaces shipping today:** `/` (home), `/about` (with the experience timeline, principles, and failures), `/projects` and `/projects/:slug` case studies, `/blog` and `/blog/:slug`, `/contact`, `/document-engine`, `/uses`, `/colophon`, `/version`, `/privacy`, `/terms`, `/ddl` and its sub-pages, and a 404.

**Confirmed capabilities:**

- English/Vietnamese throughout, with a fallback chain per field and per entry, so one untranslated entry never forces a whole page back to English.
- Locale-matched resume download, driven by the Profile record.
- Contact form as the only public write operation: no authentication, protected by a honeypot, a bot challenge, rate limits, and disposable-address rejection, with auto-reply to the visitor in their own language.
- Dark, light, and system theme support.
- Command palette and keyboard shortcuts.
- Cookieless, self-hosted Umami analytics at `analytics.thunderphong.com`.
- A locked four-breakpoint responsive system (mobile, tablet, laptop, wide).

**Technical constraints future work must respect:**

- Angular SSR: content must survive hydration, and locale must be correct on the first frame before any script runs.
- Content is API-driven and may be absent. Every content-backed surface needs a defined behavior when the Profile, a copy block, or a collection is empty.
- New user-visible plain strings belong in the `LANDING_COPY` dictionary in both languages. There is no English-only string and no untranslated interface label.
- The landing app has its own typography and token scale, separate from the Console's.

**Explicitly undecided or not built,** listed so future work does not assume otherwise: testimonials and social proof, a print stylesheet for the resume or experience, an `llms.txt` for AI crawlers, a skills timeline visualization, and PWA offline capability. All were early aspirations in `.context/vision.md`; none of them ship today.

## Brand Commitments

- **Name:** "Phuong Tran" in English contexts, "Phương Trần" in Vietnamese ones. The name follows the locale.
- **Role wording is locked.** The owner is a **Frontend Engineer**, not a full-stack engineer. Backend capability is real but is positioned as a supporting skill. Always "engineer", never "developer" or "dev".
- **Existing identity assets:** a favicon set and `.ico`, an OG image, and an email signature, all in `apps/landing/public/brand/`.
- **Voice:** no em dashes or en dashes in landing copy. This is a stated preference and is enforced by a test, not a stylistic accident. When a sentence seems to need one, rebuild the sentence.
- The site currently states its subject matter as building complex, production-grade web platforms for banking and fintech with Angular and TypeScript.

## Evidence on Hand

Real, verifiable material already in the product:

- Two published npm packages, consumed by this site, with a dedicated surface.
- Real employment history with company logos, achievements, and per-role skills.
- Real project case studies with structured Challenge / Approach / Outcome highlights, galleries, and external links to repos and demos.
- Real blog posts, each with a required cover image.
- Authored working principles and a candid failures-and-lessons record on `/about`.
- A `/colophon` and a `/uses` page documenting the tools and decisions behind the site.
- The `/ddl` design-language pages.

**Absences future work must not fabricate:** there are no testimonials, no named clients, no press coverage, no user counts, no benchmarks, and no awards. Do not invent social proof, metrics, or third-party endorsement for any surface.

## Product Principles

1. **Every surface declares its reader.** No page tries to serve all four audiences equally. Name the primary reader first, then design for that reader, and give the others a clear exit rather than a compromise.
2. **Claims must be inspectable.** The position rests on things a visitor can verify: an npm package they can install, a design language they can browse, two languages they can switch between. Prefer demonstrating over asserting.
3. **Both languages, always.** Bilingual is a property of the system, not a feature of some pages. A surface that only works in English is not finished.
4. **Depth is the point, speed is the entry.** The fast path exists so the deep path gets read. Never buy the skim by removing the substance underneath it.
5. **No fabricated proof.** With no testimonials, clients, or metrics available, credibility comes from the work itself. An empty state is honest; invented evidence is not.

## Accessibility & Inclusion

The owner has no formal conformance obligation and asked for the current industry standard applied moderately. Recorded accordingly:

- **WCAG 2.2 AA is the working bar**, applied pragmatically rather than as a certified claim. It is the current industry default and the right target here.
- No formal audit, VPAT, or public conformance statement is committed to.
- Existing practice that must not regress: keyboard navigation with a command palette, reduced-motion handling, and contrast checked against tokens across themes.
- Dark mode is the site's primary theme, where WCAG AA is known to be a weak signal for text legibility. Perceptual contrast checking is worth applying to the dark theme even though no standard requires it.
