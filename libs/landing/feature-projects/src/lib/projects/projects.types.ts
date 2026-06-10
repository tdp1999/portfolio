import type { ProjectListItem } from '@portfolio/landing/shared/data-access';

export const QUERY = { YEAR: 'year', STATUS: 'status', STACK: 'stack', VIEW: 'view' } as const;

export const VIEW_MODES = ['row', 'grid', 'timeline'] as const;
export type ViewMode = (typeof VIEW_MODES)[number];

export type ProjectRow = ProjectListItem & { readonly year: string };

export const VIEW_OPTIONS = [
  {
    id: 'row',
    label: 'Row',
    icon: 'list',
    description: 'List View.',
  },
  {
    id: 'grid',
    label: 'Grid',
    icon: 'layout-grid',
    description: 'Grid View.',
  },
  {
    id: 'timeline',
    label: 'Timeline',
    icon: 'history',
    description: 'Timeline View, grouped by year.',
  },
] as const;
