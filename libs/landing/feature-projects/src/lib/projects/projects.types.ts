import type { ProjectListItem } from '@portfolio/landing/shared/data-access';
import type { Locale } from '@portfolio/shared/types';
import { resolveCopy } from '@portfolio/landing/shared/ui';

export const QUERY = { YEAR: 'year', STATUS: 'status', STACK: 'stack', VIEW: 'view' } as const;

export const VIEW_MODES = ['row', 'grid', 'timeline'] as const;
export type ViewMode = (typeof VIEW_MODES)[number];

export type ProjectRow = ProjectListItem & { readonly year: string };

/**
 * View-toggle options. `label` becomes the button's aria-label, `description`
 * the visible tooltip — both are copy, so this is a function of locale.
 */
export function viewOptions(locale: Locale) {
  return [
    {
      id: 'row',
      label: resolveCopy('common.view.row', locale),
      icon: 'list',
      description: resolveCopy('common.view.row.desc', locale),
    },
    {
      id: 'grid',
      label: resolveCopy('common.view.grid', locale),
      icon: 'layout-grid',
      description: resolveCopy('common.view.grid.desc', locale),
    },
    {
      id: 'timeline',
      label: resolveCopy('common.view.timeline', locale),
      icon: 'history',
      description: resolveCopy('common.view.timeline.desc', locale),
    },
  ] as const;
}
