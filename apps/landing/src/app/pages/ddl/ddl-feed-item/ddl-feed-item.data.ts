import type { DdlVariant } from '../ddl.types';

// Decision record (component-docs convention) — replaces the prose intro line.
// EXPLORING: no winner yet. We are weighing three shape families for any feed /
// index page (/projects, /blog) on the same 4-project sample, then a view-toggle
// in the toolbar lets users switch between them. The list is organised as the
// three *families* (Row / Card / Timeline) — the candidates the page is actually
// choosing a default from — with the Row family's rejected density sub-variants
// (A · B · C1 · C2) called out so the trade-offs that led to C3 stay on record.
export const FEED_ITEM_VARIANTS: readonly DdlVariant[] = [
  {
    id: 'row',
    label: 'Row — editorial row (best sub-variant: C3 · cover + chips)',
    note: 'Typographic, scannable, no image required. Calmest reading rhythm at C3 (year · cover · title · italic one-liner · top-3 chips); status drops out of the row and lives in the filter bar. Strongest default for a long index.',
  },
  {
    id: 'card',
    label: 'Card — cover-dominant grid (D)',
    note: '16:10 cover + title / one-liner / status pill below; 3-col desktop, 2-col tablet, 1-col mobile. Best visual-browsing mode — covers + status let scanners parse stack-fit before reading. Natural view-toggle alternate.',
  },
  {
    id: 'timeline',
    label: 'Timeline — year-grouped vertical (E)',
    note: 'Year is the spine; entries stack under each year header on a vertical rail. Great career-narrative framing. Trade-off: scroll height grows fast past ~20 projects — better as a toggle option than the default.',
  },
  {
    id: 'row-a',
    label: 'Row · A — minimal (current ship)',
    state: 'rejected',
    note: 'Year + title + one-liner only. No visual hook for skimmers — fallback only.',
  },
  {
    id: 'row-b',
    label: 'Row · B — cover-left',
    state: 'rejected',
    note: 'Adds a 96×64 thumb; empty cover falls back to a placeholder block. Superseded by C3, which also carries chips.',
  },
  {
    id: 'row-c1',
    label: 'Row · C1 — cover + status pill + chips (full)',
    state: 'rejected',
    note: 'Too noisy — five info groups per row. Kept only as the reference C2/C3 simplify from.',
  },
  {
    id: 'row-c2',
    label: 'Row · C2 — cover + status dot + chips',
    state: 'rejected',
    note: 'The status dot is too cryptic — green/indigo/amber needs a legend, and a hover tooltip helps neither mobile nor scanners.',
  },
];
