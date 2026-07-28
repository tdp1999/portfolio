import type { Locale } from '@portfolio/shared/types';
import { resolveCopy } from '@portfolio/landing/shared/ui';
import type { BreadcrumbItem, ContentSectionData } from '@portfolio/landing/shared/ui';

// Procida Rule 4 (specific, not generic). Tool name + 1-line reason + link per entry.
//
// A function rather than a const: `title` and `reason` are copy, so they have to
// be resolved per locale. Everything else (monogram, tool name, href) is the same
// in both languages and stays inline.
//
// **This file is the seed source for the future console CRUD module.** Hardcoding
// the inventory here is a placeholder, not the end state. When the module lands,
// generate the seed by calling `usesSections('en')` and `usesSections('vi')` and
// zipping them into `{ en, vi }` per field — do not copy the text into a separate
// seed file, or the two will drift the first time a tool changes.
export function usesSections(locale: Locale): readonly ContentSectionData[] {
  return [
    {
      num: '01',
      id: 'hardware',
      title: resolveCopy('uses.section.hardware', locale),
      entries: [
        {
          monogram: 'X1',
          name: 'ThinkPad X1 Carbon Gen 10',
          reason: resolveCopy('uses.reason.thinkpad', locale),
          href: 'https://www.lenovo.com/us/en/p/laptops/thinkpad/thinkpadx1/x1-carbon-gen-10/22tp2x1x1c0',
        },
      ],
    },
    {
      num: '02',
      id: 'editor',
      title: resolveCopy('uses.section.editor', locale),
      entries: [
        {
          monogram: 'Vs',
          name: 'VS Code',
          reason: resolveCopy('uses.reason.vscode', locale),
          href: 'https://code.visualstudio.com',
        },
        {
          monogram: 'Cu',
          name: 'Cursor',
          reason: resolveCopy('uses.reason.cursor', locale),
          href: 'https://cursor.sh',
        },
      ],
    },
    {
      num: '03',
      id: 'terminal',
      title: resolveCopy('uses.section.terminal', locale),
      entries: [
        {
          monogram: 'Wt',
          name: 'Windows Terminal',
          reason: resolveCopy('uses.reason.windowsTerminal', locale),
          href: 'https://aka.ms/terminal',
        },
      ],
    },
    {
      num: '04',
      id: 'cli',
      title: resolveCopy('uses.section.cli', locale),
      entries: [
        {
          monogram: 'pn',
          name: 'pnpm',
          reason: resolveCopy('uses.reason.pnpm', locale),
          href: 'https://pnpm.io',
        },
        {
          monogram: 'nx',
          name: 'Nx',
          reason: resolveCopy('uses.reason.nx', locale),
          href: 'https://nx.dev',
        },
        {
          monogram: 'gh',
          name: 'gh',
          reason: resolveCopy('uses.reason.gh', locale),
          href: 'https://cli.github.com',
        },
      ],
    },
    {
      num: '05',
      id: 'browser',
      title: resolveCopy('uses.section.browser', locale),
      entries: [
        {
          monogram: 'Cr',
          name: 'Chrome',
          reason: resolveCopy('uses.reason.chrome', locale),
          href: 'https://www.google.com/chrome',
        },
        {
          monogram: 'Fx',
          name: 'Firefox Developer Edition',
          reason: resolveCopy('uses.reason.firefox', locale),
          href: 'https://www.mozilla.org/firefox/developer',
        },
      ],
    },
    {
      num: '06',
      id: 'fonts',
      title: resolveCopy('uses.section.fonts', locale),
      entries: [
        {
          monogram: 'In',
          name: 'Inter',
          reason: resolveCopy('uses.reason.inter', locale),
          href: 'https://rsms.me/inter',
        },
        {
          monogram: 'Ns',
          name: 'Newsreader',
          reason: resolveCopy('uses.reason.newsreader', locale),
          href: 'https://fonts.google.com/specimen/Newsreader',
        },
        {
          monogram: 'Jb',
          name: 'JetBrains Mono',
          reason: resolveCopy('uses.reason.jetbrainsMono', locale),
          href: 'https://www.jetbrains.com/lp/mono',
        },
      ],
    },
    {
      num: '07',
      id: 'other',
      title: resolveCopy('uses.section.other', locale),
      entries: [
        {
          monogram: 'Ex',
          name: 'Excalidraw',
          reason: resolveCopy('uses.reason.excalidraw', locale),
          href: 'https://excalidraw.com',
        },
        {
          monogram: 'Ob',
          name: 'Obsidian',
          reason: resolveCopy('uses.reason.obsidian', locale),
          href: 'https://obsidian.md',
        },
      ],
    },
  ];
}

export function usesBreadcrumb(locale: Locale): readonly BreadcrumbItem[] {
  return [
    { label: resolveCopy('common.page.home', locale), href: '/' },
    { label: resolveCopy('common.page.uses', locale) },
  ];
}

/** ISO year-month. Fed to `<time datetime>` raw and to `formatMonthYear` for display. */
export const LAST_UPDATED = '2026-05';
