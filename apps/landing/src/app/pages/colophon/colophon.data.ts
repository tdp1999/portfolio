import type { Locale } from '@portfolio/shared/types';
import { resolveCopy } from '@portfolio/landing/shared/ui';
import type { ContentSectionData } from '@portfolio/landing/shared/ui';

// A function rather than a const: `title` and `reason` are copy, so they have to
// be resolved per locale. Monogram, product name and href read the same in both
// languages and stay inline.
//
// **This file is the seed source for the future console CRUD module.** Hardcoding
// the credits here is a placeholder, not the end state. When the module lands,
// generate the seed by calling `colophonSections('en')` and `colophonSections('vi')`
// and zipping them into `{ en, vi }` per field — do not copy the text into a
// separate seed file, or the two will drift the first time an entry changes.
export function colophonSections(locale: Locale): readonly ContentSectionData[] {
  return [
    {
      num: '01',
      id: 'stack',
      title: resolveCopy('colophon.section.stack', locale),
      entries: [
        {
          monogram: 'Ag',
          name: 'Angular 21',
          reason: resolveCopy('colophon.reason.angular', locale),
          href: 'https://angular.dev',
        },
        {
          monogram: 'Ns',
          name: 'NestJS 11',
          reason: resolveCopy('colophon.reason.nestjs', locale),
          href: 'https://nestjs.com',
        },
        {
          monogram: 'Pr',
          name: 'Prisma',
          reason: resolveCopy('colophon.reason.prisma', locale),
          href: 'https://www.prisma.io',
        },
        {
          monogram: 'Pg',
          name: 'Postgres',
          reason: resolveCopy('colophon.reason.postgres', locale),
          href: 'https://www.postgresql.org',
        },
        {
          monogram: 'Nx',
          name: 'Nx 22',
          reason: resolveCopy('colophon.reason.nx', locale),
          href: 'https://nx.dev',
        },
        {
          monogram: 'Tw',
          name: 'Tailwind + SCSS',
          reason: resolveCopy('colophon.reason.tailwind', locale),
          href: 'https://tailwindcss.com',
        },
        {
          monogram: 'Rl',
          name: 'Railway',
          reason: resolveCopy('colophon.reason.railway', locale),
          href: 'https://railway.com',
        },
        {
          monogram: 'Cd',
          name: 'Cloudinary',
          reason: resolveCopy('colophon.reason.cloudinary', locale),
          href: 'https://cloudinary.com',
        },
      ],
    },
    {
      num: '02',
      id: 'tools',
      title: resolveCopy('colophon.section.tools', locale),
      entries: [
        {
          monogram: 'Ex',
          name: 'Excalidraw',
          reason: resolveCopy('colophon.reason.excalidraw', locale),
          href: 'https://excalidraw.com',
        },
        {
          monogram: 'Ob',
          name: 'Obsidian',
          reason: resolveCopy('colophon.reason.obsidian', locale),
          href: 'https://obsidian.md',
        },
        {
          monogram: 'Cl',
          name: 'Claude Code',
          reason: resolveCopy('colophon.reason.claudeCode', locale),
          href: 'https://claude.com/claude-code',
        },
        {
          monogram: 'Fg',
          name: 'Figma',
          reason: resolveCopy('colophon.reason.figma', locale),
          href: 'https://www.figma.com',
        },
        {
          monogram: 'Ss',
          name: 'macOS screenshot',
          reason: resolveCopy('colophon.reason.screenshot', locale),
          href: 'https://support.apple.com/guide/mac-help/take-a-screenshot-mh26782/mac',
        },
      ],
    },
    {
      num: '03',
      id: 'sources',
      title: resolveCopy('colophon.section.sources', locale),
      entries: [
        {
          monogram: 'Ln',
          name: 'Linear',
          reason: resolveCopy('colophon.reason.linear', locale),
          href: 'https://linear.app',
        },
        {
          monogram: 'Sp',
          name: 'Stripe Press',
          reason: resolveCopy('colophon.reason.stripePress', locale),
          href: 'https://press.stripe.com',
        },
        {
          monogram: 'Rw',
          name: 'Railway',
          reason: resolveCopy('colophon.reason.railwaySource', locale),
          href: 'https://railway.com',
        },
        {
          monogram: 'Vc',
          name: 'Vercel Docs',
          reason: resolveCopy('colophon.reason.vercelDocs', locale),
          href: 'https://vercel.com/docs',
        },
        {
          monogram: 'Ds',
          name: 'Design Systems Surf',
          reason: resolveCopy('colophon.reason.designSystemsSurf', locale),
          href: 'https://designsystems.surf',
        },
        {
          monogram: 'Ki',
          name: 'Kiro',
          reason: resolveCopy('colophon.reason.kiro', locale),
          href: 'https://kiro.dev',
        },
        {
          monogram: 'Pa',
          name: 'Parth Sharma',
          reason: resolveCopy('colophon.reason.parthSharma', locale),
          href: 'https://parthh.in',
        },
      ],
    },
    {
      num: '04',
      id: 'type',
      title: resolveCopy('colophon.section.type', locale),
      entries: [
        {
          monogram: 'In',
          name: 'Inter',
          reason: resolveCopy('colophon.reason.inter', locale),
          href: 'https://rsms.me/inter',
        },
        {
          monogram: 'Nr',
          name: 'Newsreader',
          // Same typeface, same one-liner as /uses — one dictionary entry serves both.
          reason: resolveCopy('uses.reason.newsreader', locale),
          href: 'https://fonts.google.com/specimen/Newsreader',
        },
        {
          monogram: 'Jb',
          name: 'JetBrains Mono',
          reason: resolveCopy('colophon.reason.jetbrainsMono', locale),
          href: 'https://www.jetbrains.com/lp/mono',
        },
      ],
    },
  ];
}

/** ISO year-month. Fed to `<time datetime>` raw and to `formatMonthYear` for display. */
export const LAST_UPDATED = '2026-05';
