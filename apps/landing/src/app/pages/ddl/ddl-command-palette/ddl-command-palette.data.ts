import type { DdlVariant } from '../ddl.types';

// Decision record — this page is still EXPLORING: four Cmd+K (Ctrl+K) palette
// directions are on the board, none has won. All share one dataset (pages ·
// sections · projects · actions) and one keyboard model (↑↓ navigate, ↵
// activate, Esc close); they differ only in chrome, density, and how the kind
// category is surfaced. No `selected`; each carries its trade-off as a `note`.
export const COMMAND_PALETTE_VARIANTS: readonly DdlVariant[] = [
  {
    id: 'v1',
    label: 'V1 — Linear-style',
    note: '🟢 leading candidate · centered modal, top-third, section headers per group + a keyboard-hint footer. The familiar pattern; section headers pay off the category-rich data.',
  },
  {
    id: 'v2',
    label: 'V2 — Spotlight (flat)',
    note: '💡 strong alternative · flat list, no group headers, a small mono kind-chip on the right of each row. Less chrome, faster feel — reads like an OS tool.',
  },
  {
    id: 'v3',
    label: 'V3 — Raycast (rich rows)',
    note: '⚠ heavy · wider modal, framed icon + two-line title/description per row. Wins only when descriptions disambiguate near-identical names; tall rows otherwise cost density.',
  },
  {
    id: 'v4',
    label: 'V4 — minimal',
    note: '⚠ opinionated · input + bare title list, no icons/chips/footer. Quiet and fast, but drops the affordances that help when items span many categories.',
  },
];
