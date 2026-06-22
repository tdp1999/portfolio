import type { DdlVariant } from '../ddl.types';
import type { MockProject } from './ddl-selected-work.types';

// Decision record — this page is still EXPLORING: four panel-swap motion
// strategies are on the board, none has won yet. No `selected`; each variant
// carries its trade-off as a `note`, so the widget tags them all "Candidate".
export const SELECTED_WORK_VARIANTS: readonly DdlVariant[] = [
  {
    id: 'v1',
    label: 'V1 — Crossfade whole panel',
    note: 'Opacity-only (360ms). Simplest and cohesive, but a touch flat — the swap can read as a plain flicker.',
  },
  {
    id: 'v2',
    label: 'V2 — Text fade-up · gallery crossfade',
    note: 'Text rises 8px while the image stays anchored. Reads as craft without grabbing attention — the safe middle.',
  },
  {
    id: 'v3',
    label: 'V3 — Staggered text cascade · gallery crossfade',
    note: 'Meta → title → desc → chips cascade in. Most crafted, but heaviest — can feel "busy" on rapid tab swaps.',
  },
  {
    id: 'v4',
    label: 'V4 — Directional slide · gallery crossfade',
    note: 'Text slides in the direction of the tab move. Adds wayfinding, but can feel like page nav rather than a content swap.',
  },
];

export const PROJECTS: readonly MockProject[] = [
  {
    slug: 'audit-console',
    title: 'Audit Console',
    year: '2024',
    role: 'Frontend lead',
    description:
      'A permission-grade audit dashboard for fintech ops — built around column-aware tables, ' +
      'replayable filter state, and predictable empty states. The kind of console you trust at 2am.',
    skills: ['Angular', 'NgRx', 'Postgres', 'Nx'],
    imageUrls: [
      'https://picsum.photos/seed/audit-1/960/720',
      'https://picsum.photos/seed/audit-2/960/720',
      'https://picsum.photos/seed/audit-3/960/720',
    ],
  },
  {
    slug: 'doc-engine',
    title: 'Document Engine',
    year: '2023',
    role: 'IC engineer',
    description:
      'A template + variable engine that renders Singapore-market loan documents at compile time. ' +
      'Plugin-extensible, fault-injecting test rig, full audit trail per render.',
    skills: ['TypeScript', 'NestJS', 'TipTap', 'Playwright'],
    imageUrls: ['https://picsum.photos/seed/doc-1/960/720', 'https://picsum.photos/seed/doc-2/960/720'],
  },
  {
    slug: 'rte',
    title: 'Rich Text Editor',
    year: '2025',
    role: 'Solo build',
    description:
      'Self-shipped TipTap extension powering this very portfolio. Custom block schema, inline marks, ' +
      'and a markdown serializer that I had to write because the off-the-shelf ones lied about coverage.',
    skills: ['TipTap', 'ProseMirror', 'Angular signals'],
    imageUrls: [
      'https://picsum.photos/seed/rte-1/960/720',
      'https://picsum.photos/seed/rte-2/960/720',
      'https://picsum.photos/seed/rte-3/960/720',
      'https://picsum.photos/seed/rte-4/960/720',
    ],
  },
];
