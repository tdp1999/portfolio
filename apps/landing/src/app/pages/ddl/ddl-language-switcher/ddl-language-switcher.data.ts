import type { MegaMenuItem } from '@portfolio/landing/shared/ui';

import type { DdlVariant } from '../ddl.types';

// Decision record — this page is still EXPLORING: six directions for the EN / VI
// header toggle are on the board, none has won. No `selected`; each direction
// carries its trade-off as a `note`, so the widget tags them all "Candidate".
export const LANGUAGE_SWITCHER_VARIANTS: readonly DdlVariant[] = [
  {
    id: 'v1',
    label: 'V1 — segmented pill',
    note: 'Both labels always visible in one capsule, active filled accent. Heaviest weight — declares bilingualism as a feature. Best when both langs are first-class peers.',
  },
  {
    id: 'v2',
    label: 'V2 — mono inline toggle',
    note: 'Two lowercase mono codes split by a slash, whole thing one button. Lightest possible, editorial vibe — fits the lowercase "tdp." mark. Scales to 2 langs only.',
  },
  {
    id: 'v3',
    label: 'V3 — single-trigger dropdown',
    note: 'Active code + chevron opens a menu of native names with a check. Standard, compact pick that expands cleanly if a 3rd lang lands later.',
  },
  {
    id: 'v4',
    label: 'V4 — globe icon + code',
    note: 'Same menu as V3 but a universal globe glyph leads. Friendly to non-EN readers; trade-off is glyph weight competing with the theme sun/moon next to it.',
  },
  {
    id: 'v5',
    label: 'V5 — single-click flip pill',
    note: 'Shows only the OTHER language as a CTA ("Switch to VI"), one click flips. Explicit verb kills ambiguity; doesn\'t scale past 2 langs.',
  },
  {
    id: 'v6',
    label: 'V6 — marquee swap (text crossfade)',
    note: 'A single mono code roll-swaps on click, flip-board style. Quiet personality marker, signals craft; adds animation cost and may feel showy on remembered-state loads.',
  },
];

/** Mock items for mega-menu variant to demonstrate "shared dropdown shell". */
export const MEGA_MENU_ITEMS: readonly MegaMenuItem[] = [
  {
    label: 'English',
    description: 'Default — site copy in English.',
    href: '#en',
    iconName: 'globe',
  },
  {
    label: 'Tiếng Việt',
    description: 'Bản tiếng Việt — same content, localized.',
    href: '#vi',
    iconName: 'globe',
  },
];
