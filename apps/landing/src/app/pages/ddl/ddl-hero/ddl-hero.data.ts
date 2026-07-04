import type { DdlVariant } from '../ddl.types';

export const DEMO = {
  fullName: 'Phuong Tran',
  role: 'Frontend Engineer',
  lead: 'Four years shipping fintech tools for the Singapore market.',
  emphasis: 'Document engines, loan systems, permission frameworks.',
  status: 'AVAILABLE FOR HIRE',
  stack: 'ANGULAR / TYPESCRIPT / ANGULAR MATERIAL',
  city: 'HO CHI MINH CITY',
} as const;

// Decision record — five entrance compositions over the same hero content.
// α (settled stagger) shipped; the rest stay as the considered alternatives.
export const HERO_VARIANTS: readonly DdlVariant[] = [
  {
    id: 'alpha',
    label: 'α — settled stagger',
    selected: true,
    decision:
      'Per-character rise (22ms stagger, blur removed for clean end state) + clip-path role reveal — crafted, human-typed. Graduated to landing-home-hero via landing-stagger-text.',
  },
  {
    id: 'v1',
    label: 'V1 — anchor (fallback)',
    note: 'Safe fade-up on a 96px H1 — the conservative baseline, but reads as ordinary next to α. Kept as a low-risk fallback.',
  },
  {
    id: 'v2',
    label: 'V2 — no entrance',
    note: 'No entrance phase; relies on the now site-wide spotlight (landing-shell). Calm, but loses the first-paint moment α earns.',
  },
  {
    id: 'beta',
    label: 'β — marquee in',
    note: 'Name slides from left, hairline draws, role enters from right. Compositional, but the cross-axis travel felt jerkier than α even after smoothing.',
  },
  {
    id: 'gamma',
    label: 'γ — diagonal mask wipe',
    note: 'Letters reveal under a 135° gradient mask sweep. Editorial, but the diagonal wipe is heavier and slower to settle than α.',
  },
];
