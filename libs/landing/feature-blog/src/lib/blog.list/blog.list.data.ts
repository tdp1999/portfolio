import type { SegmentOption, ViewToggleOption } from '@portfolio/landing/shared/ui';
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

export const VIEW_OPTIONS: readonly ViewToggleOption[] = [
  { id: 'row', label: 'Row', icon: 'list', description: 'List view — title + meta dominant.' },
  { id: 'grid', label: 'Grid', icon: 'layout-grid', description: 'Grid view — cover-dominant cards.' },
];

export const SORT_OPTIONS: readonly SegmentOption[] = [
  { id: 'newest', label: 'Newest' },
  { id: 'oldest', label: 'Oldest' },
];

export const EMPTY_RESPONSE: BlogPostListResponse = {
  data: [],
  total: 0,
  page: 1,
  limit: PAGE_SIZE,
};
