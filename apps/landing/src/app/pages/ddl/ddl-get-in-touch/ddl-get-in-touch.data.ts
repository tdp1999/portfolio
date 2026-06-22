import type { DdlVariant } from '../ddl.types';

// Decision record (epic §2b) — replaces the prose "Historical sandbox" lede.
//
// §07 began as a right-column exploration (V1/V2/V3 globe + a/b/c CV placement).
// The decision evolved *past* that question: §7 became a centered 1-column router
// (no right column), the globe graduated to /contact, and a 3-purpose CTA split
// with an email fallback shipped to home — locked 2026-05-19. The on-page mocks
// below are kept as the record of how the section got there; the shipped winner
// is the centered direction, not any of the right-column variants.
export const GET_IN_TOUCH_VARIANTS: readonly DdlVariant[] = [
  {
    id: 'centered-3p',
    label: 'Shipped — centered · 3-purpose split + email fallback',
    selected: true,
    decision:
      'Dropped the right column entirely; centered the section as a 3-intent router (full-time · freelance · say hi) with an email fallback. Globe graduated to /contact. Locked 2026-05-19.',
  },
  {
    id: 'v1-svg-globe',
    label: 'V1 — SVG globe constellation (static)',
    note: '~8kb, no WebGL. Cheapest delivery of the "served across SE Asia + AU" story — but the two-column composition was later abandoned.',
  },
  {
    id: 'v2-drag-globe',
    label: 'V2 — drag-rotate globe (interactive proxy)',
    note: 'Stand-in for production globe.gl WebGL. Risk: reads like a toy for a contact section and mobile drag is awkward.',
  },
  {
    id: 'v3-info-panel',
    label: 'V3 — info panel (status · timezone · served-from)',
    note: 'Strongest signal density for a scanning hiring manager, zero JS — but least memorable and still a right column.',
  },
  {
    id: 'cv-a-callingcard',
    label: 'CV (a) — standalone calling-card row',
    note: 'Gives the resume its own ceremony but adds a new full-width row below the CTAs.',
  },
  {
    id: 'cv-b-4th-cta',
    label: 'CV (b) — 4th CTA in the split',
    note: 'Keeps the single CTA-stack rhythm but flattens the resume into just another intent.',
  },
  {
    id: 'cv-c-rightcol',
    label: 'CV (c) — under the globe / info panel',
    note: 'Anchors the right column but competes with the illustration above it — moot once the right column was dropped.',
  },
];
