import type { DdlVariant } from '../ddl.types';
import type { ToolCategory } from './ddl-uses-card.types';

// Decision record (epic §2b) — replaces the prose "Picked:" line.
export const USES_CARD_VARIANTS: readonly DdlVariant[] = [
  {
    id: 'v2-s1',
    label: 'V2 — monogram tile · section S1',
    selected: true,
    decision: 'Zero icon-debt, matches the mono terminal voice, uniform tile shape. Graduated to /uses on 2026-05-16.',
  },
  {
    id: 'v1-s1',
    label: 'V1 — brand-icon · section S1',
    note: 'Strongest visual ID, but needs a per-tool brand glyph kept up to date.',
  },
  {
    id: 'v3-s2',
    label: 'V3 — hairline row · section S2',
    note: 'Quietest, closest to the sub-page rule — but reads least like a card.',
  },
];

const ICONIFY = 'https://api.iconify.design';
const brand = (slug: string, color?: string) =>
  color ? `${ICONIFY}/${slug}.svg?color=${encodeURIComponent('#' + color)}` : `${ICONIFY}/${slug}.svg`;

export const SAMPLE_CATEGORIES: readonly ToolCategory[] = [
  {
    num: '02',
    id: 'editor',
    title: 'Editor',
    entries: [
      {
        monogram: 'VS',
        icon: brand('logos:visual-studio-code'),
        lucide: 'code',
        name: 'VS Code',
        reason: 'Primary editor. GitHub Dark theme, format-on-save, Vim keymap off.',
        href: 'https://code.visualstudio.com',
      },
      {
        monogram: 'Cu',
        icon: brand('simple-icons:cursor', 'D4D4D4'),
        lucide: 'code',
        name: 'Cursor',
        reason: 'When a refactor needs Claude in the loop — opens the same workspace as VS Code.',
        href: 'https://cursor.sh',
      },
    ],
  },
  {
    num: '04',
    id: 'cli',
    title: 'CLI',
    entries: [
      {
        monogram: 'pn',
        icon: brand('logos:pnpm'),
        lucide: 'briefcase',
        name: 'pnpm',
        reason: 'Workspace package manager — tighter disk usage than npm, faster cold installs.',
        href: 'https://pnpm.io',
      },
      {
        monogram: 'nx',
        icon: brand('logos:nx'),
        lucide: 'layout-grid',
        name: 'Nx',
        reason: 'Monorepo orchestrator. `nx affected` is the daily workhorse for tests and builds.',
        href: 'https://nx.dev',
      },
      {
        monogram: 'gh',
        icon: brand('simple-icons:github', 'F0F6FC'),
        lucide: 'github',
        name: 'gh',
        reason: 'GitHub CLI — PR review and check status without leaving the terminal.',
        href: 'https://cli.github.com',
      },
    ],
  },
];
