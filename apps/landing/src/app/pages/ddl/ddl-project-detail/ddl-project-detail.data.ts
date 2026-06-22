import type { InPageSection, SegmentOption } from '@portfolio/landing/shared/ui';

import type { DdlVariant } from '../ddl.types';

// Decision record — this page is still EXPLORING: five cover aspect ratios and
// four body layouts are on the board, none has won yet. No `selected`; each
// variant carries its trade-off as a `note`, so the widget tags them all
// "Candidate". Aspect ratios and layouts compose freely — the preview reflects
// any pairing.
export const PROJECT_DETAIL_VARIANTS: readonly DdlVariant[] = [
  {
    id: 'aspect-4-3',
    label: 'Cover 4 : 3',
    note: 'Tall, classic frame — gives the cover the most vertical presence but pushes the body furthest down the fold.',
  },
  {
    id: 'aspect-3-2',
    label: 'Cover 3 : 2',
    note: 'Photographic ratio — balanced height; reads well for screenshot-style covers without dominating.',
  },
  {
    id: 'aspect-16-9',
    label: 'Cover 16 : 9',
    note: 'Widescreen default — cinematic and familiar, but crops tall UI captures aggressively.',
  },
  {
    id: 'aspect-21-9',
    label: 'Cover 21 : 9',
    note: 'Ultrawide banner — minimal vertical cost, fastest to the body; can feel like a thin letterbox sliver.',
  },
  {
    id: 'aspect-natural-capped',
    label: 'Cover natural · capped',
    note: 'Honors the image’s own ratio up to a max height — most faithful, but layout height varies per project.',
  },
  {
    id: 'layout-current',
    label: 'Layout · meta + TOC left',
    note: 'Current shape: both rails stacked on the left. Familiar, but crowds the left gutter and offsets the reading column.',
  },
  {
    id: 'layout-toc-right-strip',
    label: 'Layout · TOC right · meta strip',
    note: 'Meta as a horizontal strip under the hero, TOC on the right. Cleanest reading column; meta competes with the hero for the top.',
  },
  {
    id: 'layout-toc-right-bundled',
    label: 'Layout · TOC right · meta bundled',
    note: 'Meta + TOC bundled together on the right. Tidy single rail, but a tall right column can outrun short articles.',
  },
  {
    id: 'layout-three-col',
    label: 'Layout · 3-col · meta L · TOC R',
    note: 'Meta left, reading center, TOC right. Most scannable on wide screens; needs real width or the center column starves.',
  },
];

export const ASPECT_OPTIONS: readonly SegmentOption[] = [
  { id: '4-3', label: '4 : 3' },
  { id: '3-2', label: '3 : 2' },
  { id: '16-9', label: '16 : 9' },
  { id: '21-9', label: '21 : 9' },
  { id: 'natural-capped', label: 'Natural · capped' },
];

export const LAYOUT_OPTIONS: readonly SegmentOption[] = [
  { id: 'current', label: 'Current · meta+TOC left' },
  { id: 'toc-right-strip', label: 'TOC right · meta strip' },
  { id: 'toc-right-bundled', label: 'TOC right · meta bundled' },
  { id: 'three-col', label: '3-col · meta L · TOC R' },
];

export const SECTIONS: readonly InPageSection[] = [
  { id: 'overview', title: 'Overview', level: 2 },
  { id: 'overview-context', title: 'Context', level: 3 },
  { id: 'overview-scope', title: 'Scope', level: 3 },
  { id: 'motivation', title: 'Motivation', level: 2 },
  { id: 'role', title: 'My role', level: 2 },
  { id: 'role-backend', title: 'Backend', level: 3 },
  { id: 'role-backend-api', title: 'API layer', level: 4 },
  { id: 'role-backend-db', title: 'Database', level: 4 },
  { id: 'role-frontend', title: 'Frontend', level: 3 },
  { id: 'role-frontend-state', title: 'State machine', level: 4 },
  { id: 'highlights', title: 'Highlights', level: 2 },
  { id: 'stack-notes', title: 'Stack notes', level: 2 },
  { id: 'lessons', title: 'Lessons', level: 2 },
];

export const LOREM =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean euismod bibendum laoreet. Proin gravida dolor sit amet lacus accumsan et viverra justo commodo. Proin sodales pulvinar sic tempor. Nam fermentum, nulla luctus pharetra vulputate, felis tellus mollis orci, sed rhoncus pronin sapien nunc accuan eget.';

export const SKILLS: readonly string[] = ['TypeScript', 'Angular', 'Nx', 'Tailwind', 'NestJS', 'Postgres'];

export const COVER_URL = 'https://picsum.photos/id/180/2400/1350';

export const META_ROWS = [
  { label: 'Role', value: 'Lead developer · solo' },
  { label: 'Stack', value: 'TypeScript · Angular · Nx · Tailwind · NestJS · Postgres' },
  { label: 'Year', value: '2025 → Present' },
  { label: 'Status', value: 'Live' },
] as const;
