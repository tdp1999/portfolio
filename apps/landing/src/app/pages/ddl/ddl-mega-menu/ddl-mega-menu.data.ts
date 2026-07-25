import type { DdlVariant } from '../ddl.types';
import type { MoreItem, MoreSection } from './ddl-mega-menu.types';

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
  {
    id: 'v7a',
    label: 'V7a — columned, type-led (Stripe / Linear)',
    note: 'Three titled columns, mono eyebrow per section, no icons, accent bar slides in on hover. Most in step with the type-led hero — but the single Product item reads a touch empty next to its heading.',
  },
  {
    id: 'v7b',
    label: 'V7b — featured product rail + two columns (Vercel)',
    note: 'Product is a prominent flagship card on the left; Explore + Documents sit as two compact titled columns. Gives Document Engine the weight it earns; asymmetric and confident, but the most markup.',
  },
  {
    id: 'v7c',
    label: 'V7c — stacked groups, one narrow column (Raycast)',
    note: 'One narrow column, sections stacked with a mono label + thin divider between groups. Simplest and safest; scales to any width and any device — quietest of the four.',
  },
  {
    id: 'v7d',
    label: 'V7d — uniform card grid (Raycast / Vercel cards)',
    note: 'Every item is a uniform icon + title + one-liner card, grouped under section labels. The most visual and premium — also the heaviest, and it needs confident copy in every card.',
  },
  {
    id: 'v8a',
    label: 'V8a — working disclosure · type-led columns',
    note: 'V7a shape as a real disclosure: native button + aria-expanded, Esc with focus return, click-outside, grouped links under real headings — deliberately NOT role=menu. Most in step with the type-led hero.',
  },
  {
    id: 'v8b',
    label: 'V8b — working disclosure · featured product rail',
    note: 'The first shape tried in production (product rail on the left). Superseded by V9b, which reads richer — icon columns + a What’s-New rail — for the same content.',
  },
  {
    id: 'v8c',
    label: 'V8c — working disclosure · stacked narrow',
    note: 'Same disclosure contract, V7c shape: one narrow column, groups stacked with dividers. Simplest and most device-portable — the same panel reads on desktop and mobile.',
  },
  {
    id: 'v9a',
    label: 'V9a — icon-forward · featured promo panel',
    note: 'Dribbble SaaS register (BuzzBiz): framed icons on every item, two labelled columns, and a filled accent promo panel for Document Engine — heading, blurb, decorative tile, CTA pill. Same disclosure contract as V8. The most marketing-forward of the set.',
  },
  {
    id: 'v9b',
    label: 'V9b — icon-forward · Products column + titled columns',
    selected: true,
    decision:
      'Shipped to the production landing-mega-menu. A featured “Products” column leads (preview screenshot of the product that cross-fades to the icon tile on hover + blurb + link), then divided icon columns for Explore and Documents (framed icon + self-explanatory label, no hints or badges). Disclosure contract (not role=menu); opens on hover AND click; the panel is centred on the viewport. Below laptop the titled columns stack (Documents drops under Explore). The Products column scales with count — one → featured card, two+ → a stacked list.',
  },
  {
    id: 'v9c',
    label: 'V9c — icon-forward · overview tile + two-col grid',
    note: 'Dribbble Nimbus register: an “All of it” overview link over a CSS-only decorative tile on the left, then every item as a framed-icon row in a two-column grid. Flattest and most scannable — no filled promo, no badges.',
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

// ── V7 sectioned data ────────────────────────────────────────────────
// The "More" menu grown into titled groups. Product leads (Document Engine is
// the flagship and carries a description); Explore holds the utility links;
// Documents holds downloads. Icons use only names registered in the landing
// lucide provider — `package` doubles as the product mark on the DE hero.
export const SECTIONS: readonly MoreSection[] = [
  {
    title: 'Product',
    items: [
      {
        label: 'Document Engine',
        description: 'A framework-agnostic rich-text engine that stores structured, versioned documents.',
        hint: 'product',
        iconName: 'package',
        meta: '/document-engine',
        featured: true,
      },
    ],
  },
  {
    title: 'Explore',
    items: [
      {
        label: 'Blog',
        description: 'Essays on engineering, design, and the build.',
        hint: 'writing',
        iconName: 'list',
        meta: '/blog',
      },
      {
        label: 'Uses',
        description: 'Hardware, editor, services I lean on daily.',
        hint: 'tools',
        iconName: 'briefcase',
        meta: '/uses',
      },
      {
        label: 'Colophon',
        description: 'The stack and tooling behind this site.',
        hint: 'behind the build',
        iconName: 'code',
        meta: '/colophon',
      },
      {
        label: 'DDL',
        description: 'Design sandbox — primitives, prototypes, picks.',
        hint: 'sandbox',
        iconName: 'layout-grid',
        meta: '/ddl',
      },
    ],
  },
  {
    title: 'Documents',
    items: [
      {
        label: 'Resume / CV',
        description: 'Download my CV (PDF).',
        hint: 'PDF · 120kb',
        iconName: 'download',
        meta: 'download',
      },
    ],
  },
];
