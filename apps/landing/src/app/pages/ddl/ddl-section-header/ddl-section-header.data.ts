import type { SectionPreview } from './ddl-section-header.types';

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
