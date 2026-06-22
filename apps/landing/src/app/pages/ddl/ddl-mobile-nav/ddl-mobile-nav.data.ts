import type { DdlVariant } from '../ddl.types';
import type { PrimaryItem, SecondaryItem } from './ddl-mobile-nav.types';

export const PRIMARY_ITEMS: readonly PrimaryItem[] = [
  { label: 'Home', index: '01', active: true },
  { label: 'About', index: '02' },
  { label: 'Projects', index: '03' },
  { label: 'Blog', index: '04' },
];

export const SECONDARY_ITEMS: readonly SecondaryItem[] = [
  { label: 'Uses', hint: 'tools' },
  { label: 'Contact', hint: 'reach me' },
  { label: 'Colophon', hint: 'behind the build' },
  { label: 'DDL', hint: 'sandbox' },
];

// Decision record — this page is still EXPLORING: three visual treatments for
// the `< tablet` full-screen nav sheet are on the board, none has won. No
// `selected`; each look carries its character as a one-line `note`, so the
// widget tags them all "Candidate". Pop any look to full width to judge it at
// true phone/viewport scale before deciding.
export const MOBILE_NAV_VARIANTS: readonly DdlVariant[] = [
  {
    id: 'a',
    label: 'A — Editorial index',
    note: 'Mono group eyebrows · numbered 01–04 · arrow on active. Most on-brand, reads like a contents page.',
  },
  {
    id: 'b',
    label: 'B — Big type, edge index',
    note: 'Oversized display labels · index pushed to the right edge · secondary collapsed to one mono row. Boldest, least dense.',
  },
  {
    id: 'c',
    label: 'C — Arrow list, airy',
    note: 'No numbers · trailing arrow on every link · generous spacing · single MORE eyebrow. Quietest, most tap-friendly.',
  },
];
