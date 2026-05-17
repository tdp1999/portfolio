## Overview

The Console is the admin app that authors every section of this landing site. Same Nx monorepo, same Postgres database, same NestJS API — built so the public site reads from a real CMS instead of hard-coded copy in Angular templates.

If you scroll the homepage and see a bio, a stack list, a project tile, a uses entry — every one of those strings lives in a database row that I authored through the Console. There is no Strapi, no Sanity, no Notion-as-CMS. The thing serving the data is the same thing I wrote the schema for, and the editor I use to update it sits at `/console` in the same repository.

That is the brag and the lesson at the same time. The brag: the architecture is coherent end-to-end and I am the first real user of the backend, which catches a lot of issues a year before any visitor would. The lesson: building a CMS is more work than building a single landing page, and I had to stay honest about which parts deserve depth and which parts deserve "just enough to ship."

![Console — Projects list (admin index, hover state)](/assets/projects/console-mvp/fig-01-projects-list.png "Projects list — the admin index for the same data the landing /projects page reads")

## The Problem

The original landing site had its bio, its stack list, and its project copy committed as TypeScript constants in Angular components. Every typo, every "actually, I want to phrase that differently," every new project — was a code change, a commit, a build, a deploy. For a site whose entire value proposition is "the writing is specific and proud" (Procida Rule 4), that latency was the wrong default.

I looked at three honest options before deciding.

**Markdown in repo.** Cheapest. Files in `apps/landing/content/`, parsed at build time. Good for `/uses` and `/colophon` where the data is shallow. Wrong for projects, profile, and a future blog where the relationships matter — projects have skills, skills have icons, posts have categories. Three weeks in I would have been writing my own join layer over flat files.

**Hosted CMS** (Strapi / Sanity / Payload). Fine for someone else. For me, an external CMS means another service to host, another login to maintain, another vendor's data model to bend, another locale of "where does the truth live." And it splits the architectural story I am trying to tell — the site is no longer end-to-end mine.

**Build it.** More work upfront. But it lets me show the depth I claim. The whole portfolio is "I write the design system before the screen, and I write the test before the bug." The CMS is the most honest demo of that working method I can offer.

I chose to build. Procida 3 framing: before, the landing copy was committed alongside Angular component code; what changed is the same copy now lives in a Postgres row authored through `/console`; the outcome is that I can edit a project's tagline in 12 seconds without redeploying, and I have a working backend I can point to in interviews.

## Approach

The architecture is intentionally textbook NestJS DDD on the backend and intentionally signal-first standalone Angular on the frontend.

**Backend** is NestJS 11 with Prisma + Postgres. Each module follows the same shape: `domain/` for entities and value objects, `application/` for commands, queries, and DTOs (zod v4 schemas), `infrastructure/` for the Prisma repository, `presentation/` for the controller. Controllers do no business logic — every rule, every "if-this-then-NotFoundError," every transform, lives in a command or query handler. Errors throw `DomainError`s out of handlers, the global filter maps them to a consistent JSON envelope, and the Angular shell catches the code and shows either a toast or an inline field error via `ServerErrorDirective`. It is one of the few pieces I built first and have not touched since — which is the test for whether a pattern is right.

**Frontend** is Angular 21 with signals, standalone components, and Angular Material as the base UI kit. Console pages use Material components (data tables, dialogs, form fields) plus a small layer of custom `ui-*` shared primitives where Material's defaults did not fit. Forms use reactive forms with a typed root `FormGroup`; every form submission goes through the same `submit-flow` helper that owns "disable while pending, surface server errors, on-success navigate or toast." It is boring in the right way.

> The strongest argument for building the CMS yourself is the one that only shows up six months in: when the data model has to change, you change the schema, the DTO, the repository, the form, and the landing renderer in one commit — and you have nowhere to hide a sloppy decision.

**Design.** Console has its own scale contract — `text-page-title`, `text-section-heading`, `text-stat-label` — separate from the landing scale. Borders only, no box-shadows on cards or tables. Chips are metadata, not buttons. The cookbook lives in `.context/design/console-cookbook.md` and is the document I read before touching any console HTML. Reading it before, instead of fixing things after, is the difference between a console that feels designed and a console that feels generated.

![Console — Project edit form (tabs, translatable fields, save-pending state)](/assets/projects/console-mvp/fig-02-project-edit.png "Project edit — typed reactive form, translatable EN/VI tabs, server-error wiring through the submit-flow helper")

**Testing.** Backend tests sit at the handler level — they hit a real Postgres via a test container, not a mocked Prisma. I got burned once on a mocked test that passed against a broken migration; I do not make that mistake twice. Frontend tests are scoped: unit tests on signals-heavy components, Playwright E2E on the critical flows (auth, project CRUD, profile edit). The flakier work — visual regression, full-suite responsive sweeps — is deferred until the design surface stops moving.

![Console — Skills page (umbrella → member grouping, drag-reorder)](/assets/projects/console-mvp/fig-03-skills-tree.png "Skills page — umbrella skills act as grouping anchors, member skills attach via parentSkillId, displayOrder editable inline")

## Outcome

The Console authors every section of the public landing. Concretely:

- **Profile** — single record with name, title, bio (short + long), tagline, stack intro, contact intro, footer line, timezone, working hours, social links, SEO. Edited live; the landing reads it on every SSR render. The reason `/api/profile` exists is so the bio can change without a deploy.
- **Projects** — 9 entries today, each with one-liner, description, motivation, role, lifecycle status, skill tags, image set, and a markdown body for the deep case studies (this page is one of them). Reorderable. Featured flag for the home grid.
- **Skills** — 6 umbrella categories (Frontend, Languages, Library work, Backend, Tooling, Workflow & AI) anchoring 20+ member skills. The landing groups by umbrella; the console authors the tree.
- **Blog** — schema in, editor pending the rich-text rewrite (R&D below).
- **Media** — Cloudinary-backed image library with a picker dialog the project/profile/blog editors all reuse.
- **Auth, users, invites, messages, settings** — the supporting plumbing.

The system has been live since project setup and the author has been the daily user for the entire build. That is the strongest argument I can make for the architecture: it is not theoretical. Every command handler I wrote has been called by a real form submission by a real human (me), and the bugs I have caught at the controller-to-handler boundary in the last sprint have all been ones a mocked test would have missed.

![Console — Home dashboard (system status, recent activity, content counts)](/assets/projects/console-mvp/fig-04-home-dashboard.png "Console home — the operator's view of what is in the database right now")

## What I'd Change

Three honest things.

**The rich-text editor is half-done.** TipTap concrete via a shared contract lib is in flight; the landing currently has no editor for the blog body, and the project body markdown is authored as raw markdown in a textarea. That is fine for me, the only author, but it is the wrong story to tell a future contributor. Epic E6 (RTE) is the answer; it is large and I underestimated it.

**The image pipeline is ad-hoc.** Cloudinary is the host, the media picker works, but there is no opinionated transform pipeline — no automatic blur-up placeholders, no responsive `srcset` derivation, no figure component on the landing side that knows about the media row. Today every image is a hard-coded URL that I cropped by eye. Fine for nine projects; wrong if this site grows to thirty.

**Console UX is functional, not delightful.** The forms work. The tables paginate. The save flow surfaces errors. But the polish — the keyboard shortcuts, the inline-edit affordances, the optimistic UI, the consistent empty states — is below where I would want it for a product I shipped to anyone else. Procida 9: I would rather admit that than dress it up. The next pass is queued behind the rich-text work and the landing performance gate.

If I rebuilt from scratch tomorrow, the only structural choice I would change is to introduce a tiny shared `command-flow` helper on day one instead of duplicating the "validate → dispatch → handle DomainError → return DTO" loop in every command handler for the first three modules before extracting it. Everything else — the DDD module shape, the zod-DTO contract, the design-system-first design pass — I would keep.
