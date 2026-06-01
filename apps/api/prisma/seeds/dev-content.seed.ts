/**
 * DEV-ONLY content seed — populates the landing + /about + /projects + /experience
 * surfaces with realistic, voice-matched content so the site renders end-to-end for
 * development and responsive review. The production seed (seed.ts) only creates the
 * admin user, a basic Profile, and 6 empty skill umbrellas; everything richer lives here.
 *
 * NOT wired into seed.ts main() — run manually against a dev database:
 *   pnpm tsx --tsconfig apps/api/tsconfig.json apps/api/prisma/seeds/dev-content.seed.ts
 *
 * Fully idempotent: media upserts by publicId; skills upsert by (slug, parent); projects,
 * experiences, and about-content are delete-by-key then recreated. Re-running converges.
 *
 * Media uses picsum.photos URLs written straight to Media rows (no Cloudinary) — fine for
 * local layout work; swap to real uploads via the Console /media flow before production.
 *
 * Content authored deliberately with VARIANCE (gallery counts 0→6, highlight counts 1→4,
 * link counts 1→4, chip counts 2→15, ongoing + ended dates) so responsive layouts get
 * stressed across many shapes rather than one uniform template.
 */
import { config } from 'dotenv';
import { resolve } from 'node:path';
config({ path: resolve(__dirname, '../../../../.env') });

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { v7 as uuidv7 } from 'uuid';

const NOW = new Date('2026-01-15T00:00:00.000Z');

// --- Helpers -----------------------------------------------------------------

/** Translatable scalar: EN authored, VI left empty (falls back to EN on landing). */
const t = (en: string) => ({ en, vi: '' });
/** Translatable string array (responsibilities / highlights). */
const tArr = (en: string[]) => ({ en, vi: [] as string[] });

type LinkTypeUpper = 'GITHUB' | 'DEMO' | 'DOCS' | 'ARTICLE' | 'OTHER';
/** Map authored DTO-style link types onto the landing's lowercase vocabulary. */
const LINK_TYPE: Record<LinkTypeUpper, 'repo' | 'demo' | 'doc' | 'post' | 'case-study'> = {
  GITHUB: 'repo',
  DEMO: 'demo',
  DOCS: 'doc',
  ARTICLE: 'post',
  OTHER: 'doc',
};

// --- Profile bioLong (The Story §6) -----------------------------------------

const BIO_LONG_EN = [
  'I started where a lot of us do — gluing screens to endpoints and calling it a feature. *What changed me was a permissions bug that took down a loan desk for half a day.* The fix was three lines; finding it took six hours because nothing in the system could tell me what a role was actually allowed to do.',
  'Since then I build the boring scaffolding first. A design system before the first screen, a test before the bug report, a workflow before the task piles up. It is less glamorous than a demo, but it is the part that is still standing a year later.',
  'These days I work from Ho Chi Minh City with a Singapore product team — document engines, loan systems, the permission frameworks underneath them. *I like the seams of a product: the editor that has to round-trip cleanly, the export nobody notices until it breaks.* That is the work I reach for.',
].join('\n\n');

// --- Skills (16 members under 6 existing umbrellas) --------------------------

interface MemberSkill {
  slug: string;
  name: string;
  parentSlug: string;
  category: 'TECHNICAL' | 'TOOLS' | 'ADDITIONAL';
  tier: 'DAILY' | 'FREQUENT' | 'SHIPPED';
  displayOrder: number;
  yearsOfExperience: number;
  proficiencyNote: string;
}

const SKILLS: readonly MemberSkill[] = [
  {
    slug: 'typescript',
    name: 'TypeScript',
    parentSlug: 'languages',
    category: 'TECHNICAL',
    tier: 'DAILY',
    displayOrder: 1,
    yearsOfExperience: 5,
    proficiencyNote: 'Daily driver',
  },
  {
    slug: 'angular',
    name: 'Angular',
    parentSlug: 'frontend',
    category: 'TECHNICAL',
    tier: 'DAILY',
    displayOrder: 1,
    yearsOfExperience: 4,
    proficiencyNote: 'Reach-for-first; v15 → v21',
  },
  {
    slug: 'angular-material',
    name: 'Angular Material',
    parentSlug: 'frontend',
    category: 'TECHNICAL',
    tier: 'FREQUENT',
    displayOrder: 2,
    yearsOfExperience: 4,
    proficiencyNote: 'Default theming layer',
  },
  {
    slug: 'rxjs',
    name: 'RxJS',
    parentSlug: 'frontend',
    category: 'TECHNICAL',
    tier: 'FREQUENT',
    displayOrder: 3,
    yearsOfExperience: 4,
    proficiencyNote: 'When I need streams',
  },
  {
    slug: 'signals',
    name: 'Signals',
    parentSlug: 'frontend',
    category: 'TECHNICAL',
    tier: 'FREQUENT',
    displayOrder: 4,
    yearsOfExperience: 1,
    proficiencyNote: "When I don't",
  },
  {
    slug: 'ssr',
    name: 'SSR',
    parentSlug: 'frontend',
    category: 'TECHNICAL',
    tier: 'FREQUENT',
    displayOrder: 5,
    yearsOfExperience: 1,
    proficiencyNote: 'Angular Universal / hydration',
  },
  {
    slug: 'tailwind',
    name: 'Tailwind',
    parentSlug: 'frontend',
    category: 'TECHNICAL',
    tier: 'FREQUENT',
    displayOrder: 6,
    yearsOfExperience: 2,
    proficiencyNote: 'Utility-first; landing site',
  },
  {
    slug: 'scss',
    name: 'SCSS',
    parentSlug: 'frontend',
    category: 'TECHNICAL',
    tier: 'DAILY',
    displayOrder: 7,
    yearsOfExperience: 5,
    proficiencyNote: 'Tokens, mixins',
  },
  {
    slug: 'tiptap',
    name: 'TipTap',
    parentSlug: 'library-work',
    category: 'TECHNICAL',
    tier: 'FREQUENT',
    displayOrder: 1,
    yearsOfExperience: 2,
    proficiencyNote: 'Custom extensions; Document Engine',
  },
  {
    slug: 'nestjs',
    name: 'NestJS',
    parentSlug: 'backend',
    category: 'TECHNICAL',
    tier: 'FREQUENT',
    displayOrder: 1,
    yearsOfExperience: 2,
    proficiencyNote: 'DDD layout',
  },
  {
    slug: 'prisma',
    name: 'Prisma',
    parentSlug: 'backend',
    category: 'TECHNICAL',
    tier: 'FREQUENT',
    displayOrder: 2,
    yearsOfExperience: 2,
    proficiencyNote: 'Schema-first migrations',
  },
  {
    slug: 'postgres',
    name: 'Postgres',
    parentSlug: 'backend',
    category: 'TECHNICAL',
    tier: 'FREQUENT',
    displayOrder: 3,
    yearsOfExperience: 2,
    proficiencyNote: 'Default DB',
  },
  {
    slug: 'nx',
    name: 'Nx',
    parentSlug: 'tooling',
    category: 'TOOLS',
    tier: 'FREQUENT',
    displayOrder: 1,
    yearsOfExperience: 2,
    proficiencyNote: 'Monorepo orchestration',
  },
  {
    slug: 'jest',
    name: 'Jest',
    parentSlug: 'tooling',
    category: 'TOOLS',
    tier: 'FREQUENT',
    displayOrder: 2,
    yearsOfExperience: 4,
    proficiencyNote: 'Unit + integration',
  },
  {
    slug: 'playwright',
    name: 'Playwright',
    parentSlug: 'tooling',
    category: 'TOOLS',
    tier: 'FREQUENT',
    displayOrder: 3,
    yearsOfExperience: 2,
    proficiencyNote: 'E2E',
  },
  {
    slug: 'claude-code',
    name: 'Claude Code',
    parentSlug: 'workflow-and-ai',
    category: 'TOOLS',
    tier: 'FREQUENT',
    displayOrder: 1,
    yearsOfExperience: 1,
    proficiencyNote: 'Plugin author (TDP)',
  },
];

// --- Projects (8: 3 featured + 5 more, all fully authored) -------------------

interface DevProject {
  slug: string;
  title: string;
  oneLiner: string;
  description: string;
  motivation: string;
  role: string;
  lifecycleStatus: 'LIVE' | 'SHIPPED' | 'ARCHIVED' | 'BETA' | 'ONGOING';
  featured: boolean;
  displayOrder: number;
  startDate: string;
  endDate: string | null;
  skillSlugs: string[];
  galleryCount: number;
  links: { label: string; url: string; type: LinkTypeUpper }[];
  highlights: { challenge: string; approach: string; outcome: string }[];
}

const PROJECTS: readonly DevProject[] = [
  {
    slug: 'permissions-console',
    title: 'Permissions Console',
    oneLiner: 'Role and permission admin for a multi-tenant fintech back office.',
    description:
      'An admin console for managing roles, permissions, and tenant scoping across a Singapore-market banking back office. Operators assign granular access without filing a ticket, and every change is scoped to a tenant so one bank’s staff never see another’s. The hard part was never the table of checkboxes — it was making permission inheritance legible to people who are not engineers.',
    motivation:
      'Access control was living in spreadsheets and one-off SQL, which is exactly the kind of unglamorous seam that quietly breaks a regulated product. I wanted the rules visible and editable in one place.',
    role: 'Lead frontend engineer. I built the permission model and the resolver UI from the rails up — design system and access primitives first, then the screens — and paired with backend on the scope contract.',
    lifecycleStatus: 'LIVE',
    featured: true,
    displayOrder: 1,
    startDate: '2024-03-01',
    endDate: null,
    skillSlugs: [
      'typescript',
      'angular',
      'angular-material',
      'rxjs',
      'signals',
      'nestjs',
      'prisma',
      'postgres',
      'nx',
      'jest',
      'playwright',
    ],
    galleryCount: 4,
    links: [
      {
        label: 'Read the architecture write-up',
        url: 'https://phuongtran.dev/writing/permissions-console',
        type: 'ARTICLE',
      },
      { label: 'Demo', url: 'https://demo.phuongtran.dev/permissions', type: 'DEMO' },
      { label: 'Docs', url: 'https://docs.phuongtran.dev/permissions', type: 'DOCS' },
    ],
    highlights: [
      {
        challenge:
          'Permission inheritance across tenants was invisible — operators could not tell why a user had a given access.',
        approach:
          'Built a resolver view that traces every effective permission back to the role and scope that granted it.',
        outcome:
          'Support tickets about “why can this user see X” dropped to near zero, and audits stopped needing an engineer in the room.',
      },
      {
        challenge: 'A wrong toggle could silently widen access for a whole tenant.',
        approach:
          'Added a diff-and-confirm step that shows the before/after access set in plain language before anything saves.',
        outcome:
          'No accidental access escalations since launch, and operators trust the screen enough to stop double-checking in SQL.',
      },
      {
        challenge: 'The matrix had to stay readable as tenants grew past a few hundred permissions.',
        approach: 'Virtualized the grid and grouped permissions by domain with signal-driven filtering.',
        outcome: 'The console stays responsive at the largest tenant’s scale with no perceptible lag.',
      },
    ],
  },
  {
    slug: 'loan-document-engine',
    title: 'Loan Document Engine',
    oneLiner:
      'A templating and generation engine for regulated loan documents — bilingual PDFs, every field traceable to an audit trail, built to survive a compliance review.',
    description:
      'A document engine that turns loan data into regulated, bilingual (English and the local script) PDFs from versioned templates. Every generated field carries a trail back to its source value and the template revision that produced it, so a document can be defended months later. It replaced a brittle copy-paste-into-Word ritual that no one wanted to own.',
    motivation:
      'Regulated documents are where a small rendering bug becomes a legal problem. I find that kind of high-stakes plumbing genuinely satisfying — *real consequences, real users*.',
    role: 'Frontend and template-pipeline engineer. I owned the template authoring UI and the bilingual layout system, and built the round-trip between editable templates and the generation service.',
    lifecycleStatus: 'SHIPPED',
    featured: true,
    displayOrder: 2,
    startDate: '2023-05-01',
    endDate: '2024-02-01',
    skillSlugs: ['typescript', 'angular', 'rxjs', 'scss', 'nestjs', 'prisma', 'postgres', 'jest'],
    galleryCount: 6,
    links: [
      { label: 'Docs', url: 'https://docs.phuongtran.dev/loan-docs', type: 'DOCS' },
      { label: 'Source', url: 'https://github.com/tdp1999/loan-document-engine', type: 'GITHUB' },
    ],
    highlights: [
      {
        challenge: 'Bilingual layouts broke unpredictably — long local-script strings overflowed fixed PDF frames.',
        approach:
          'Built a layout pass that measures both language runs and reflows frames before generation instead of after.',
        outcome: 'Documents render correctly in both languages on the first pass, no manual nudging.',
      },
      {
        challenge: 'Compliance needed to prove which template version produced a given signed document.',
        approach:
          'Pinned every generation to an immutable template revision and stamped that revision into the audit record.',
        outcome:
          'A document from a year ago can be regenerated byte-identical, which closed a long-standing audit gap.',
      },
      {
        challenge: 'Template authors were non-technical but needed real control over conditional clauses.',
        approach: 'Designed a clause-block editor with visible logic, so a clause’s conditions read like a sentence.',
        outcome:
          'The legal team now edits clauses themselves; engineering stopped being a bottleneck for wording changes.',
      },
      {
        challenge: 'Generation had to stay correct under a backlog of hundreds of documents at month-end.',
        approach: 'Made the pipeline deterministic and queue-driven with idempotent retries.',
        outcome: 'Month-end batches finish unattended with zero duplicate or partial documents.',
      },
    ],
  },
  {
    slug: 'block-editor',
    title: 'Block Editor',
    oneLiner: 'A custom TipTap block editor with bespoke nodes and clean HTML/JSON round-trip.',
    description:
      'A block-based rich text editor built on TipTap with custom nodes for the structured content our product needed — callouts, clause blocks, embeds — and a clean round-trip between HTML and JSON so content survives storage, rendering, and re-editing without drift. The goal was an editor that felt simple to writers while staying strict about its underlying schema.',
    motivation:
      'Most editors are either too loose (HTML soup) or too rigid. I wanted to build the rails — a strict node schema — *before* anyone wrote a screen on top of it.',
    role: 'Sole frontend engineer. I designed the node schema, wrote the custom TipTap extensions, and built the serialization layer that keeps HTML and JSON in lockstep.',
    lifecycleStatus: 'ONGOING',
    featured: true,
    displayOrder: 3,
    startDate: '2024-06-01',
    endDate: null,
    skillSlugs: ['typescript', 'angular', 'signals', 'tiptap', 'scss'],
    galleryCount: 3,
    links: [{ label: 'Demo', url: 'https://demo.phuongtran.dev/editor', type: 'DEMO' }],
    highlights: [
      {
        challenge: 'Custom nodes lost data on the HTML round-trip — attributes silently dropped on re-parse.',
        approach:
          'Wrote explicit parse and render rules per node and a property test that round-trips random documents.',
        outcome: 'Content now survives any number of save/edit cycles unchanged.',
      },
      {
        challenge: 'Pasting from external sources injected unsupported markup.',
        approach: 'Added a paste pipeline that maps incoming HTML onto the strict node schema and drops the rest.',
        outcome: 'Pasted content always lands as valid, on-schema blocks instead of breaking the document.',
      },
    ],
  },
  {
    slug: 'loan-ops-dashboard',
    title: 'SME Loan Operations Dashboard',
    oneLiner: 'The operations cockpit for an SME lending team — pipeline, exceptions, and aging in one screen.',
    description:
      'An operations dashboard for the team running SME loan applications day to day: pipeline status, stuck cases, document exceptions, and aging, all on one screen instead of five tabs and a spreadsheet. The interesting work was figuring out which numbers an ops lead actually acts on at 9am, and showing only those.',
    motivation:
      'I sat with the ops team for a week before writing a line. Their real bottleneck was finding the few cases that were stuck, not staring at totals.',
    role: 'Frontend engineer. I built the data layer and the dashboard views, and tuned the queries so a busy ops screen still loaded fast.',
    lifecycleStatus: 'ARCHIVED',
    featured: false,
    displayOrder: 4,
    startDate: '2022-04-01',
    endDate: '2023-03-01',
    skillSlugs: ['typescript', 'angular', 'rxjs', 'scss', 'postgres'],
    galleryCount: 2,
    links: [
      { label: 'Case study', url: 'https://phuongtran.dev/writing/loan-ops', type: 'ARTICLE' },
      { label: 'Source', url: 'https://github.com/tdp1999/loan-ops-dashboard', type: 'GITHUB' },
    ],
    highlights: [
      {
        challenge: 'Ops staff were missing cases that had quietly stalled between hand-offs.',
        approach:
          'Surfaced an aging-and-exceptions view that ranks cases by how long they have been stuck, not by stage.',
        outcome: 'The team started clearing the oldest stuck cases first, and average time-in-pipeline came down.',
      },
    ],
  },
  {
    slug: 'design-bank',
    title: 'Design Bank',
    oneLiner: 'A markdown-driven knowledge base of research-backed UX patterns.',
    description:
      'A markdown-driven design knowledge base — a “design bank” — where every UX decision is written down with the research or principle behind it, so choices are reviewable instead of vibes. It feeds my own work and doubles as a checklist when reviewing a component against established patterns. The point is to argue with a written rule, not a memory.',
    motivation:
      'I kept relearning the same design lessons. Writing them down once, with sources, turned taste into something I could *check against*.',
    role: 'Sole author and maintainer. I structure the bank, ingest patterns from articles, and keep entries cross-validated against industry sources.',
    lifecycleStatus: 'ONGOING',
    featured: false,
    displayOrder: 5,
    startDate: '2025-01-01',
    endDate: null,
    skillSlugs: ['claude-code', 'scss'],
    galleryCount: 1,
    links: [
      { label: 'Browse the bank', url: 'https://phuongtran.dev/design-bank', type: 'DOCS' },
      { label: 'Source', url: 'https://github.com/tdp1999/design-bank', type: 'GITHUB' },
      { label: 'How I ingest patterns', url: 'https://phuongtran.dev/writing/design-ingest', type: 'ARTICLE' },
    ],
    highlights: [
      {
        challenge: 'Design knowledge scattered across bookmarks and memory, impossible to apply consistently.',
        approach: 'Standardized each pattern as a markdown entry with principle, evidence, and a do/don’t checklist.',
        outcome: 'Component reviews now reference a written rule, so the same mistake stops recurring across projects.',
      },
      {
        challenge: 'Ingested patterns risked being one person’s opinion dressed as fact.',
        approach:
          'Required every entry to cross-validate against at least one independent industry source before it lands.',
        outcome: 'Entries hold up under scrutiny instead of being argued from preference.',
      },
      {
        challenge: 'A growing bank gets stale and contradicts itself.',
        approach: 'Kept entries timeless and atomic, with status tracked outside the reference docs.',
        outcome: 'The bank stays clean enough to actually read, even as it grows.',
      },
    ],
  },
  {
    slug: 'contract-compare',
    title: 'Contract Compare',
    oneLiner: 'Side-by-side diffing for legal contract revisions, clause by clause.',
    description:
      'A diff tool for legal contract revisions that compares documents clause by clause rather than line by line, so a reviewer sees what changed in meaning, not just where the text moved. Reordered clauses and reworded sentences are matched and surfaced as real edits. It came out of watching lawyers eyeball two PDFs side by side and miss things.',
    motivation:
      'Plain text diff is useless on contracts — moving a clause looks like deleting and re-adding it. I wanted a diff that understood structure.',
    role: 'Frontend engineer and tool designer. I built the clause-matching diff view and the side-by-side reader, with a backend service handling the document parsing.',
    lifecycleStatus: 'SHIPPED',
    featured: false,
    displayOrder: 6,
    startDate: '2024-01-01',
    endDate: '2024-09-01',
    skillSlugs: ['typescript', 'angular', 'signals', 'tailwind', 'nestjs', 'postgres', 'jest', 'playwright'],
    galleryCount: 0,
    links: [{ label: 'Demo', url: 'https://demo.phuongtran.dev/contract-compare', type: 'DEMO' }],
    highlights: [
      {
        challenge: 'Line-based diff flagged a moved clause as a delete plus an insert, burying the real changes.',
        approach: 'Matched clauses by content similarity first, then diffed within matched pairs.',
        outcome: 'Reviewers see a reordered clause as moved, and only genuine wording changes show as edits.',
      },
      {
        challenge: 'Reviewers lost their place jumping between two long documents.',
        approach: 'Built a synchronized side-by-side reader that keeps matched clauses aligned as you scroll.',
        outcome: 'Review time dropped because the eye no longer hunts for the corresponding clause.',
      },
    ],
  },
  {
    slug: 'tdp-plugins',
    title: 'TDP Plugins',
    oneLiner: 'A Claude Code plugin marketplace for task-driven development.',
    description:
      'A small marketplace of Claude Code plugins built around a task-driven workflow — context files, breakdown, migration safety, and design review skills that I use on my own projects. Each plugin encodes a process I kept repeating by hand, turned into something repeatable. It is the tooling layer under most of my other work.',
    motivation:
      'I kept rebuilding the same scaffolding — task tracking, migration safety, design checks. Packaging it as plugins meant building the rails once.',
    role: 'Sole author. I design each plugin’s workflow, write the skills, and dogfood them across my own repositories.',
    lifecycleStatus: 'ONGOING',
    featured: false,
    displayOrder: 7,
    startDate: '2025-06-01',
    endDate: null,
    skillSlugs: ['typescript', 'claude-code', 'nx', 'jest', 'prisma', 'playwright', 'nestjs', 'angular'],
    galleryCount: 0,
    links: [
      { label: 'Marketplace', url: 'https://github.com/tdp1999/tdp-plugins', type: 'GITHUB' },
      { label: 'Docs', url: 'https://docs.phuongtran.dev/plugins', type: 'DOCS' },
      { label: 'Why task-driven', url: 'https://phuongtran.dev/writing/task-driven', type: 'ARTICLE' },
      { label: 'Demo', url: 'https://demo.phuongtran.dev/plugins', type: 'DEMO' },
    ],
    highlights: [
      {
        challenge: 'My ad-hoc workflow scripts were copy-pasted between repos and drifted out of sync.',
        approach: 'Packaged each repeated workflow as a versioned plugin with a clear trigger and scope.',
        outcome: 'Updating a workflow once now propagates to every project that installs the plugin.',
      },
    ],
  },
  {
    slug: 'portfolio-monorepo',
    title: 'Portfolio Monorepo',
    oneLiner: 'This site — an Nx monorepo with a hand-rolled, device-bound design system.',
    description:
      'The Nx monorepo behind this portfolio: an Angular SSR landing site, a NestJS API, and shared libraries, sitting on a design system I built from the tokens up rather than pulling off a shelf. The responsive layer is device-bound — four locked breakpoints with SCSS mixins and an SSR-safe breakpoint observer — because I wanted to actually understand every layout decision. Building the rails before the train, applied to my own house.',
    motivation:
      'A portfolio is the one project where I owe no compromises. It was the right place to *hand-roll the design system* I always wish I had time for at work.',
    role: 'Everything. Architecture, design system, SSR landing, API, and the responsive foundation — solo, end to end.',
    lifecycleStatus: 'ONGOING',
    featured: false,
    displayOrder: 8,
    startDate: '2026-01-01',
    endDate: null,
    skillSlugs: [
      'typescript',
      'angular',
      'angular-material',
      'rxjs',
      'signals',
      'ssr',
      'tailwind',
      'scss',
      'nestjs',
      'prisma',
      'postgres',
      'nx',
      'jest',
      'playwright',
      'claude-code',
    ],
    galleryCount: 4,
    links: [
      { label: 'Source', url: 'https://github.com/tdp1999/portfolio', type: 'GITHUB' },
      {
        label: 'Read the architecture write-up',
        url: 'https://phuongtran.dev/writing/portfolio-architecture',
        type: 'ARTICLE',
      },
    ],
    highlights: [
      {
        challenge: 'Off-the-shelf breakpoints did not match how I wanted layouts to behave on real devices.',
        approach:
          'Locked four device-bound breakpoints with SCSS mixins and an SSR-safe observer, lint-guarded against raw media queries.',
        outcome: 'Every layout swap is a deliberate, named decision instead of an arbitrary pixel guess.',
      },
      {
        challenge: 'SSR and a custom design system fight over font loading and hydration.',
        approach:
          'Wired an HTTP transfer cache, a FOUT preload recipe, and hydration-safe active states from the start.',
        outcome: 'The landing page hydrates cleanly with no flash or layout shift on first paint.',
      },
      {
        challenge: 'A solo monorepo can rot without the discipline a team enforces.',
        approach:
          'Held myself to TDD, module boundaries, and a documented design bank as if reviewing someone else’s code.',
        outcome: 'The codebase stays legible enough that I can return after weeks away and ship without relearning it.',
      },
      {
        challenge: 'Reusing UI consistently across landing and console without one bleeding into the other.',
        approach:
          'Split components by domain with strict selector prefixes and shared primitives only where reuse is real.',
        outcome: 'Landing and console share what should be shared and nothing that should not.',
      },
    ],
  },
];

// --- Experiences (3) ---------------------------------------------------------

interface DevExperience {
  slug: string;
  companyName: string;
  companyUrl: string | null;
  companyLogoKey: string;
  position: string;
  teamRole: string;
  domain: string;
  employmentType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'FREELANCE' | 'INTERNSHIP' | 'SELF_EMPLOYED';
  locationType: 'REMOTE' | 'HYBRID' | 'ONSITE';
  locationCountry: string;
  locationCity: string;
  teamSizeMin: number;
  teamSizeMax: number;
  startDate: string;
  endDate: string | null;
  displayOrder: number;
  skillSlugs: string[];
  description: string;
  responsibilities: string[];
  highlights: string[];
}

const EXPERIENCES: readonly DevExperience[] = [
  {
    slug: 'redoc',
    companyName: 'Redoc',
    companyUrl: 'https://redoc.com',
    companyLogoKey: 'logo-redoc',
    position: 'Senior Frontend Engineer',
    teamRole: 'Lead frontend on Document Engine + permission framework',
    domain: 'Banking & Finance',
    employmentType: 'FULL_TIME',
    locationType: 'HYBRID',
    locationCountry: 'Vietnam',
    locationCity: 'Ho Chi Minh City',
    teamSizeMin: 8,
    teamSizeMax: 12,
    startDate: '2022-03-01',
    endDate: null,
    displayOrder: 1,
    skillSlugs: ['angular', 'typescript', 'rxjs', 'nestjs', 'prisma', 'tiptap', 'scss', 'jest', 'angular-material'],
    description:
      'I lead the frontend for a Singapore-market banking product — loan management, SME lending, and a finance ERP that the same teams live in all day. My main surface is the Document Engine: a Tiptap-based editor where credit officers draft, version, and route loan agreements, plus the permission framework that decides who can see or sign which clause. The work is mostly *unglamorous*: a clause that renders identically in the editor and the printed PDF, a role check that holds up under audit, a save that never loses a half-typed paragraph on a flaky office connection. Banking doesn’t reward clever — it rewards things that behave the same way every single time. I spend my days building the rails so the people approving real loans never have to think about the train.',
    responsibilities: [
      'Own the Tiptap-based Document Engine end to end — schema, custom nodes for loan clauses and signature blocks, collaborative editing, and pixel-faithful PDF export that has to match the on-screen draft for audit.',
      'Design and maintain the permission framework: a field- and clause-level access model wired through Angular route guards and structural directives, with the contracts shared against the NestJS authorization layer so the frontend never trusts a stale grant.',
      'Set the frontend conventions for the squad — RxJS data-flow patterns, signal-based state for the editor, a shared Angular Material theme, and the SCSS token layer everyone builds against.',
      'Review most frontend PRs and pair with the two engineers on the permission work; keep the Jest suite meaningful rather than just green by testing the access edges that actually break in production.',
      'Sit with credit officers and the Singapore compliance folks to turn regulatory wording into editor behavior — what’s editable, what locks after sign-off, what leaves a trail.',
    ],
    highlights: [
      'Rebuilt the document save path to be resilient on poor branch connections; lost-draft reports for the loan team dropped to effectively zero over the following quarter.',
      'Took the clause-level permission framework from a pile of scattered *if* checks to one declarative model, which made a later audit a configuration review instead of a code archaeology dig.',
      'Cut the Document Engine’s first-meaningful-render time roughly in half by trimming the editor bundle and deferring node extensions that most officers never touch.',
    ],
  },
  {
    slug: 'skyfox',
    companyName: 'Skyfox',
    companyUrl: 'https://skyfox.example.com',
    companyLogoKey: 'logo-skyfox',
    position: 'Frontend Engineer',
    teamRole: 'FE on customer-facing booking flows',
    domain: 'Travel & Hospitality',
    employmentType: 'FULL_TIME',
    locationType: 'ONSITE',
    locationCountry: 'Vietnam',
    locationCity: 'Ho Chi Minh City',
    teamSizeMin: 4,
    teamSizeMax: 6,
    startDate: '2021-06-01',
    endDate: '2022-02-28',
    displayOrder: 2,
    skillSlugs: ['angular', 'typescript', 'rxjs', 'scss'],
    description:
      'Skyfox sold travel — flights and hotels bundled into one checkout — and I worked on the booking flow people actually paid through. A booking flow is *deceptively* hard: dates, availability, prices, and currencies all shift while the customer is mid-decision, and the screen has to stay honest without flickering or losing what they’d already filled in. I spent most of my time on the RxJS streams behind search and the multi-step checkout, keeping state consistent across steps people freely jump back and forth between.',
    responsibilities: [
      'Built and maintained the multi-step booking and checkout flow in Angular, managing search, selection, and payment state as composed RxJS streams that survived back-navigation and re-quotes.',
      'Handled the messy real-world cases — price changes between search and checkout, sold-out inventory, and partial form recovery — so customers rarely hit a dead end.',
      'Wrote the responsive SCSS for the booking screens against the design team’s specs, with a focus on the mobile checkout where most conversions happened.',
    ],
    highlights: [
      'Reworked the search-to-checkout state handoff so a re-quote no longer wiped the traveler’s entered details, which noticeably cut drop-off at the payment step.',
      'Tamed a class of race conditions in the availability stream that had been causing intermittent *price flicker* during checkout.',
    ],
  },
  {
    slug: 'bachkhoa-web-lab',
    companyName: 'BachKhoa Web Lab',
    companyUrl: null,
    companyLogoKey: 'logo-bachkhoa',
    position: 'Frontend Intern',
    teamRole: 'Intern on student-services portal',
    domain: 'Education',
    employmentType: 'INTERNSHIP',
    locationType: 'ONSITE',
    locationCountry: 'Vietnam',
    locationCity: 'Ho Chi Minh City',
    teamSizeMin: 2,
    teamSizeMax: 3,
    startDate: '2021-01-15',
    endDate: '2021-05-30',
    displayOrder: 3,
    skillSlugs: ['typescript', 'angular'],
    description:
      'My first real codebase: a student-services portal at the university lab where students checked schedules, grades, and requests. Small team, plenty of room to break things and learn why they broke. This is where Angular and TypeScript stopped being tutorials and started being tools.',
    responsibilities: [
      'Built form-heavy pages for student requests and profile updates in Angular, with the validation that a campus portal quietly needs.',
      'Fixed bugs across the portal and learned to read an unfamiliar codebase before changing it.',
    ],
    highlights: [
      'Shipped the request-status page that let students stop emailing staff to ask *where’s my form* — it became one of the more-used screens.',
      'Left the internship comfortable enough in Angular and TypeScript to start contributing on day one at my next role.',
    ],
  },
];

// --- /about content ----------------------------------------------------------

const PRINCIPLES: readonly { order: number; claim: string; expansion: string }[] = [
  {
    order: 1,
    claim: 'Build the rails before the train.',
    expansion:
      "I'd rather spend the first week on the parts nobody demos. A design system before the screens, a migration path before the schema change, a workflow before the tasks pile up. The work that looks like progress is usually riding on top of work that already happened quietly. If the rails are laid right, the train almost drives itself; if they aren't, every feature after becomes a negotiation with the floor it stands on.",
  },
  {
    order: 2,
    claim: 'Make the safe path the fast path.',
    expansion:
      "People don't skip the careful way because they're careless. They skip it because it's slower, and a deadline is real while a future bug is hypothetical. So I stopped writing rules and started moving the friction. If the validated form helper is the easiest one to reach, if the typed API client is less typing than the raw fetch, if the rollback is one command — then the right thing happens by default and I don't have to police anyone. Guardrails you have to remember aren't guardrails.",
  },
  {
    order: 3,
    claim: 'A system should be able to explain itself.',
    expansion:
      "The bug that turned me was three lines, and it took down a loan desk for half a day — not because it was hard to fix, but because nothing in the system could tell me what a role was *allowed* to do. The state was true and silent. Now I treat explainability as a feature: a permission check that can name why it said no, a log that reads like a sentence, an error that points at its own cause. If a teammate at 2am can't read the system and understand what it believes about the world, I haven't finished.",
  },
  {
    order: 4,
    claim: 'Own the seams, not just the surfaces.',
    expansion:
      "I'm drawn to the unglamorous joints of a product — the editor that has to round-trip content without quietly losing a field, the export nobody thinks about until the one morning it breaks, the boundary where the frontend's assumptions meet the backend's. That's where products actually fail. The center of a feature gets attention and tests; the seams get a shrug and a 'should be fine.' I'd rather spend my care there, because that's where the half-day outages live.",
  },
  {
    order: 5,
    claim: 'Leave it explainable, then leave.',
    expansion:
      "The point of building something isn't to be the only one who can touch it. Mentoring, to me, is mostly removing the parts of a system that only live in my head — naming things plainly, writing the test that documents the edge case, leaving a comment that says *why* and not *what*. The real measure is whether the next person can change it without asking me, and whether I can hand it off without a knot in my stomach.",
  },
];

const FAILURES: readonly {
  order: number;
  year: number;
  context: string;
  decision: string;
  consequence: string;
  lesson: string;
}[] = [
  {
    order: 1,
    year: 2021,
    context:
      "Early on the banking product, I built a generic 'entity engine' meant to handle loans, SME accounts, and ledger items through one configurable abstraction.",
    decision:
      "I designed for every variation I imagined we'd eventually need — a config-driven model with hooks, overrides, and a schema that described other schemas. It felt like rails, so I trusted it.",
    consequence:
      "We had three real cases, not thirty. Every new requirement bent the abstraction in a direction it didn't anticipate, and people started writing workarounds *around* my engine instead of through it. I'd built a frame for a building that didn't exist yet, and it slowed down the building that did.",
    lesson:
      "Rails-before-train doesn't mean guessing the whole route. Scaffolding earns its keep by removing pain that's already present, not pain I've imagined. Now I let duplication sit until the third real case shows me the shape of the abstraction, and I extract from concrete examples instead of designing in the abstract.",
  },
  {
    order: 2,
    year: 2023,
    context:
      'We shipped a rich-text editor for loan-memo notes that serialized to a structured format and rendered back on review screens.',
    decision:
      'The editor library promised a clean round-trip, so I trusted it and skipped writing a test that fed real content back out and compared it. The demo content looked perfect, so I moved on.',
    consequence:
      "In production, certain nested lists and a particular table layout lost a field on save — silently. Nobody noticed until a credit officer's memo came back missing a clause weeks later. It was exactly the kind of seam I claim to care about, and I'd waved it through on a vendor's promise.",
    lesson:
      "A round-trip you didn't test is a round-trip you're hoping for. I now write the boring property test for anything that serializes and deserializes — generate content, push it through, assert it comes back whole — before I trust the happy-path demo. The library being good doesn't relieve me of owning the seam.",
  },
  {
    order: 3,
    year: 2024,
    context:
      'A release added a new role to the permissions model for an SME-lending feature, touching the same role logic that had burned us before.',
    decision:
      'I shipped it behind a normal deploy with no feature flag and no quick rollback for the permissions layer specifically — the change was small and well-reviewed, and reverting the whole release felt heavier than the risk warranted.',
    consequence:
      "An edge case let one role see a queue it shouldn't have. Nothing leaked externally, but fixing forward took longer than a rollback would have, and for an uncomfortable stretch I couldn't cleanly undo a permissions change on a banking product. The cost wasn't the bug; it was having no fast door out.",
    lesson:
      "I stopped treating 'small and reviewed' as a substitute for a rollback path. Anything touching permissions or money now ships behind a flag I can flip in seconds, independent of the rest of the release. The safe path and the fast path have to be the same path *especially* when I'm confident — that's exactly when I stop checking.",
  },
];

// --- Media plan --------------------------------------------------------------

interface MediaSpec {
  key: string;
  width: number;
  height: number;
  folder: string;
  altText: string;
}

function buildMediaSpecs(): MediaSpec[] {
  const specs: MediaSpec[] = [
    { key: 'avatar', width: 400, height: 400, folder: 'avatars', altText: 'Phuong Tran portrait' },
    { key: 'og', width: 1200, height: 630, folder: 'general', altText: 'Phuong Tran — portfolio open-graph image' },
    { key: 'logo-redoc', width: 200, height: 200, folder: 'logos', altText: 'Redoc company logo' },
    { key: 'logo-skyfox', width: 200, height: 200, folder: 'logos', altText: 'Skyfox company logo' },
    { key: 'logo-bachkhoa', width: 200, height: 200, folder: 'logos', altText: 'BachKhoa Web Lab company logo' },
  ];
  for (const p of PROJECTS) {
    specs.push({
      key: `thumb-${p.slug}`,
      width: 1200,
      height: 800,
      folder: 'projects',
      altText: `${p.title} thumbnail`,
    });
    for (let i = 1; i <= p.galleryCount; i++) {
      specs.push({
        key: `gallery-${p.slug}-${i}`,
        width: 1200,
        height: 800,
        folder: 'projects',
        altText: `${p.title} gallery image ${i}`,
      });
    }
  }
  return specs;
}

// --- Main --------------------------------------------------------------------

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env['DATABASE_URL'] });
  const prisma = new PrismaClient({ adapter });
  const email = process.env['ADMIN_EMAIL'];
  if (!email) throw new Error('Missing ADMIN_EMAIL');

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.log('Admin user not found — run `pnpm seed` first.');
      return;
    }
    const userId = user.id;
    const audit = { createdById: userId, updatedById: userId };

    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) {
      console.log('Profile not found — run `pnpm seed` first.');
      return;
    }

    // 1. MEDIA (picsum URLs straight into Media rows; idempotent upsert by publicId).
    const mediaIds = new Map<string, string>();
    for (const spec of buildMediaSpecs()) {
      const publicId = `dev-content/${spec.key}`;
      const url = `https://picsum.photos/seed/${spec.key}/${spec.width}/${spec.height}`;
      const data = {
        originalFilename: `${spec.key}.jpg`,
        mimeType: 'image/jpeg',
        url,
        format: 'jpg',
        bytes: 120000,
        width: spec.width,
        height: spec.height,
        altText: spec.altText,
        folder: spec.folder,
        updatedById: userId,
      };
      const media = await prisma.media.upsert({
        where: { publicId },
        update: data,
        create: { id: uuidv7(), publicId, createdAt: NOW, ...data, createdById: userId },
      });
      mediaIds.set(spec.key, media.id);
    }
    console.log(`Media upserted: ${mediaIds.size} rows.`);

    // 2. SKILLS (16 members under the 6 seeded umbrellas; idempotent by slug+parent).
    const umbrellas = await prisma.skill.findMany({ where: { parentSkillId: null, deletedAt: null } });
    const umbrellaBySlug = new Map(umbrellas.map((u) => [u.slug, u.id]));
    const skillIdBySlug = new Map<string, string>();
    for (const s of SKILLS) {
      const parentSkillId = umbrellaBySlug.get(s.parentSlug);
      if (!parentSkillId) throw new Error(`Umbrella not found for slug "${s.parentSlug}" — run \`pnpm seed\` first.`);
      const data = {
        name: s.name,
        category: s.category,
        tier: s.tier,
        displayOrder: s.displayOrder,
        yearsOfExperience: s.yearsOfExperience,
        proficiencyNote: s.proficiencyNote,
        isFeatured: false,
        parentSkillId,
        updatedById: userId,
      };
      const existing = await prisma.skill.findFirst({ where: { slug: s.slug, parentSkillId, deletedAt: null } });
      const skill = existing
        ? await prisma.skill.update({ where: { id: existing.id }, data })
        : await prisma.skill.create({
            data: { id: uuidv7(), slug: s.slug, createdAt: NOW, ...data, createdById: userId },
          });
      skillIdBySlug.set(s.slug, skill.id);
    }
    console.log(`Skills upserted: ${skillIdBySlug.size} members.`);

    // 3. PROJECTS (delete-by-slug then recreate with nested skills/images/highlights).
    const projectSlugs = PROJECTS.map((p) => p.slug);
    await prisma.project.deleteMany({ where: { slug: { in: projectSlugs } } });
    for (const p of PROJECTS) {
      const skillIds = p.skillSlugs.map((slug) => {
        const id = skillIdBySlug.get(slug);
        if (!id) throw new Error(`Project "${p.slug}" references unknown skill "${slug}".`);
        return id;
      });
      const galleryIds: string[] = [];
      for (let i = 1; i <= p.galleryCount; i++) {
        const id = mediaIds.get(`gallery-${p.slug}-${i}`);
        if (id) galleryIds.push(id);
      }
      await prisma.project.create({
        data: {
          id: uuidv7(),
          slug: p.slug,
          title: p.title,
          oneLiner: t(p.oneLiner),
          description: t(p.description),
          motivation: t(p.motivation),
          role: t(p.role),
          startDate: new Date(p.startDate),
          endDate: p.endDate ? new Date(p.endDate) : null,
          status: 'PUBLISHED',
          lifecycleStatus: p.lifecycleStatus,
          featured: p.featured,
          displayOrder: p.displayOrder,
          links: p.links.map((l) => ({ label: l.label, url: l.url, type: LINK_TYPE[l.type] })),
          thumbnailId: mediaIds.get(`thumb-${p.slug}`) ?? null,
          createdAt: NOW,
          ...audit,
          skills: { create: skillIds.map((skillId) => ({ skillId })) },
          images: { create: galleryIds.map((mediaId, i) => ({ id: uuidv7(), mediaId, displayOrder: i })) },
          highlights: {
            create: p.highlights.map((h, i) => ({
              id: uuidv7(),
              challenge: t(h.challenge),
              approach: t(h.approach),
              outcome: t(h.outcome),
              displayOrder: i,
            })),
          },
        },
      });
      console.log(`Project created: ${p.title} (${skillIds.length} skills, ${galleryIds.length} gallery).`);
    }

    // 4. EXPERIENCES (delete-by-slug then recreate with nested skills).
    const experienceSlugs = EXPERIENCES.map((e) => e.slug);
    await prisma.experience.deleteMany({ where: { slug: { in: experienceSlugs } } });
    for (const e of EXPERIENCES) {
      const skillIds = e.skillSlugs.map((slug) => {
        const id = skillIdBySlug.get(slug);
        if (!id) throw new Error(`Experience "${e.slug}" references unknown skill "${slug}".`);
        return id;
      });
      await prisma.experience.create({
        data: {
          id: uuidv7(),
          slug: e.slug,
          companyName: e.companyName,
          companyUrl: e.companyUrl,
          companyLogoId: mediaIds.get(e.companyLogoKey) ?? null,
          position: t(e.position),
          teamRole: t(e.teamRole),
          description: t(e.description),
          responsibilities: tArr(e.responsibilities),
          highlights: tArr(e.highlights),
          links: [],
          employmentType: e.employmentType,
          locationType: e.locationType,
          locationCountry: e.locationCountry,
          locationCity: e.locationCity,
          domain: e.domain,
          teamSizeMin: e.teamSizeMin,
          teamSizeMax: e.teamSizeMax,
          startDate: new Date(e.startDate),
          endDate: e.endDate ? new Date(e.endDate) : null,
          displayOrder: e.displayOrder,
          createdAt: NOW,
          ...audit,
          skills: { create: skillIds.map((skillId) => ({ skillId })) },
        },
      });
      console.log(`Experience created: ${e.companyName} (${skillIds.length} skills).`);
    }

    // 5. /about content (fully owned by this seed: wipe then recreate).
    await prisma.aboutPrinciple.deleteMany({});
    for (const p of PRINCIPLES) {
      await prisma.aboutPrinciple.create({
        data: {
          id: uuidv7(),
          order: p.order,
          claim: t(p.claim),
          expansion: t(p.expansion),
          isPublished: true,
          createdAt: NOW,
        },
      });
    }
    await prisma.aboutFailure.deleteMany({});
    for (const f of FAILURES) {
      await prisma.aboutFailure.create({
        data: {
          id: uuidv7(),
          order: f.order,
          year: f.year,
          context: t(f.context),
          decision: t(f.decision),
          consequence: t(f.consequence),
          lesson: t(f.lesson),
          isPublished: true,
          createdAt: NOW,
        },
      });
    }
    console.log(`About content created: ${PRINCIPLES.length} principles, ${FAILURES.length} failures.`);

    // 6. PROFILE top-up (bioLong + work/contact/social/SEO/about-narrative + media).
    await prisma.profile.update({
      where: { id: profile.id },
      data: {
        bioLong: t(BIO_LONG_EN),
        availability: 'OPEN_TO_WORK',
        openTo: ['FULL_TIME', 'FREELANCE'],
        preferredContactPlatform: 'LINKEDIN',
        preferredContactValue: 'https://www.linkedin.com/in/phuongtran/',
        socialLinks: [
          { platform: 'GITHUB', url: 'https://github.com/tdp1999', handle: 'tdp1999' },
          { platform: 'LINKEDIN', url: 'https://www.linkedin.com/in/phuongtran/', handle: 'phuongtran' },
          { platform: 'TWITTER', url: 'https://x.com/thunderphong', handle: 'thunderphong' },
        ],
        metaTitle: 'Phuong Tran — Senior Frontend Engineer',
        metaDescription:
          'Senior frontend engineer in HCMC, four years on a Singapore-based product team. Document engines, design systems, dev workflows.',
        aboutHeading: t('How I work, and what it cost me to learn it.'),
        aboutLede: t(
          "Five years of frontend, four in Singapore-market banking. The principles below aren't slogans — each one has a bug, an outage, or a bad bet behind it."
        ),
        ctaHeading: t('Building something that has to behave?'),
        ctaLede: t(
          "I'm open to full-time and freelance work. If you've got a product with real users and unglamorous seams, that's the work I reach for."
        ),
        avatarId: mediaIds.get('avatar') ?? null,
        ogImageId: mediaIds.get('og') ?? null,
        contentUpdatedAt: NOW,
        updatedById: userId,
      },
    });
    console.log('Profile topped up (bio, work, contact, social, SEO, about-narrative, media).');

    console.log('\nDev content seed complete.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
