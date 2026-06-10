import type { MockProject } from './ddl-selected-work-transitions.types';

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
