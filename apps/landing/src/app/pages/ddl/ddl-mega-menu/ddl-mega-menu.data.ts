import type { DdlVariant } from '../ddl.types';
import type { MoreItem } from './ddl-mega-menu.types';

// Decision record — this page is EXPLORING: six "More" dropdown layout
// directions are on the board, none has won. No `selected`; each direction
// carries its one-line trade-off as a `note`, so the widget tags them all
// "Candidate". V3 (typography) + V5 (hero + list) stay visible as the strongest
// directions; the other four collapse under "Considered".
export const MEGA_MENU_VARIANTS: readonly DdlVariant[] = [
  {
    id: 'v1',
    label: 'V1 — refined side-icon row',
    note: 'Lowest-effort fix: 14px glyph (no frame), vertically centered, explicit left-align, descriptions stay visible. The simplest evolution from the current panel.',
  },
  {
    id: 'v2',
    label: 'V2 — Vercel-style centered cards',
    note: 'Premium register: framed icon centered above centered title + description; Resume spans both columns as a featured row. Doubles per-item height and needs confident copy in every card.',
  },
  {
    id: 'v3',
    label: 'V3 — typography only (Stripe / Linear)',
    note: 'No icons. Display-sans title + muted body description, left-accent bar slides in on hover. Editorial and type-led — most aligned with the existing hero display accents.',
  },
  {
    id: 'v4',
    label: 'V4 — editorial eyebrow',
    note: 'Tiny mono eyebrow above the title, no description, no icon. Specimen-sheet voice; quietest direction. Only works when titles are self-evident and descriptions read as filler.',
  },
  {
    id: 'v5',
    label: 'V5 — featured hero + compact rows',
    note: 'Resume becomes a hero card (big icon + Download affordance); the four utility links sit as compact rows. Solves the orphaned-5th-cell problem and gives the strongest information hierarchy.',
  },
  {
    id: 'v6',
    label: 'V6 — inline-glyph row, hover-reveal',
    note: 'Inline 12px glyph in the title row; description fades in on hover. Densest layout — the description is rescue copy, not first-glance content. Risk: hides load-bearing info.',
  },
];

export const ITEMS: readonly MoreItem[] = [
  {
    label: 'Uses',
    description: 'Hardware, editor, services I lean on daily.',
    hint: 'tools',
    iconName: 'briefcase',
    meta: 'page',
  },
  {
    label: 'Contact',
    description: 'Email, social, and the fastest way to reach me.',
    hint: 'reach me',
    iconName: 'mail',
    meta: '/#contact',
  },
  {
    label: 'Colophon',
    description: 'The stack and tooling behind this site.',
    hint: 'behind the build',
    iconName: 'code',
    meta: 'site',
  },
  {
    label: 'DDL',
    description: 'Design sandbox — primitives, prototypes, picks.',
    hint: 'sandbox',
    iconName: 'layout-grid',
    meta: 'specimen',
  },
  {
    label: 'Resume',
    description: 'Download my CV (PDF).',
    hint: 'CV / 120kb',
    iconName: 'download',
    meta: 'download',
    featured: true,
  },
];
