import type { DdlVariant } from '../ddl.types';
import type { SectionPreview } from './ddl-section-header.types';

// Decision record — DECIDED. The shipped section-header treatment is
// eyebrow + centered display heading + italic accent word(s) (the "cii"
// pattern). Left-anchored and no-eyebrow variants remain in the primitive's
// API for specific contexts, but the centered+eyebrow+accent form is the
// default and the crowned direction. The alternatives are kept as considered.
export const SECTION_HEADER_VARIANTS: readonly DdlVariant[] = [
  {
    id: 'centered-eyebrow-accent',
    label: 'Centered display + eyebrow + italic accent',
    selected: true,
    decision:
      'Won as the default. The eyebrow names the section, the centered display heading carries the statement, and the italic indigo accent word(s) add voice without a second typeface. Same cii rhythm as /ddl/stack — propagates one recognizable section opener across §03–§06.',
  },
  {
    id: 'left-anchored',
    label: 'Left-anchored heading',
    state: 'considered',
    note: 'Kept for sections whose body is a single left-anchored column (no center column above). Shipped on §03 (Selected Work). A contextual option, not the default — centered reads as the section opener everywhere else.',
  },
  {
    id: 'standalone-no-eyebrow',
    label: 'Centered, no eyebrow',
    state: 'considered',
    note: 'For landing-style pages without §-numbering (uses, colophon) where an eyebrow would invent a label. Drops the eyebrow but keeps the centered display + accent — same family, lighter chrome.',
  },
];

export const SECTIONS: readonly SectionPreview[] = [
  {
    id: 's03',
    label: '§03 · Selected Work',
    note: 'Shipped — left-anchored. Heading sourced from Profile.selectedWorkIntro; BE-parses *word* into <em>. Project title font also switched to Newsreader (display).',
  },
  {
    id: 's04',
    label: '§04 · The Stack',
    note: 'Shipped 2026-05-12 — centered, no trailing period, fully centered groups (column + chip rows). ⚠️ Eyebrow + heading currently tautological ("THE STACK" / "toolkit") — see reframe candidates below.',
  },
  {
    id: 's05',
    label: '§05 · The Story',
    note: 'Currently eyebrow + trailingRule, no heading. Adding a visible heading is a new commitment.',
  },
  {
    id: 's06',
    label: '§06 · Get in Touch',
    note: 'Already has "Let\'s talk." in landing-heading. Promote to section-header with italic accent.',
  },
];
