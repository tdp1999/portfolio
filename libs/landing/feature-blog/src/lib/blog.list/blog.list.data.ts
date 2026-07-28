import { resolveCopy, type SegmentOption, type ViewToggleOption } from '@portfolio/landing/shared/ui';
import type { Locale } from '@portfolio/shared/types';
import type { BlogPostListResponse } from '@portfolio/landing/shared/data-access';

export const QUERY = {
  SEARCH: 'search',
  CATEGORY: 'category',
  SORT: 'sort',
  VIEW: 'view',
  PAGE: 'page',
} as const;

export const PAGE_SIZE = 10;
export const FEATURED_CAP = 5;
export const V1_THRESHOLD = 5;
export const STRIP_MIN = 3;
export const SEARCH_DEBOUNCE_MS = 300;

/** Same `common.view.*` entries /projects reads — one wording for both pages. */
export function viewOptions(locale: Locale): readonly ViewToggleOption[] {
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
  ];
}

export function sortOptions(locale: Locale): readonly SegmentOption[] {
  return [
    { id: 'newest', label: resolveCopy('common.sort.newest', locale) },
    { id: 'oldest', label: resolveCopy('common.sort.oldest', locale) },
  ];
}

export const EMPTY_RESPONSE: BlogPostListResponse = {
  data: [],
  total: 0,
  page: 1,
  limit: PAGE_SIZE,
};
