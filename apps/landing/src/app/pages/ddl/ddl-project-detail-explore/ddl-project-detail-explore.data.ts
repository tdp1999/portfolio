import type { InPageSection, SegmentOption } from '@portfolio/landing/shared/ui';

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
