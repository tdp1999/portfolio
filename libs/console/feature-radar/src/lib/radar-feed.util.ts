import type { Params } from '@angular/router';
import { CONTENT_TYPE_LABELS, FEED_SORT_KEYS, MIN_SCORE_OPTIONS, PROVIDER_LABELS } from './radar.data';
import type { RadarFeedItem, RadarFeedParams, RadarFeedSortKey, RadarFeedState } from './radar.types';

export const DEFAULT_FEED_STATE: RadarFeedState = {
  search: '',
  providerTag: '',
  contentType: '',
  minScore: '',
  includePromo: false,
  sortBy: 'publishedAt',
  sortDir: 'desc',
  pageIndex: 0,
};

/** A stale or hand-edited filter value would make the API answer 400 on every retry; drop it. */
const known = (value: unknown, allowed: readonly string[]): string =>
  typeof value === 'string' && allowed.includes(value) ? value : '';

/** Reads the Feed's URL query params. Unknown or malformed values fall back to the default. */
export function parseFeedQuery(params: Params): RadarFeedState {
  const page = Number(params['page']);
  return {
    search: params['search'] ?? '',
    providerTag: known(params['provider'], Object.keys(PROVIDER_LABELS)),
    contentType: known(params['type'], Object.keys(CONTENT_TYPE_LABELS)),
    minScore: known(
      params['score'],
      MIN_SCORE_OPTIONS.map((o) => o.value)
    ),
    includePromo: params['promo'] === '1',
    sortBy: FEED_SORT_KEYS.includes(params['sort']) ? (params['sort'] as RadarFeedSortKey) : 'publishedAt',
    sortDir: params['dir'] === 'asc' ? 'asc' : 'desc',
    pageIndex: Number.isInteger(page) && page > 1 ? page - 1 : 0,
  };
}

/** The inverse of `parseFeedQuery`: defaults are left out so a plain Feed has a clean URL. */
export function toFeedQuery(state: RadarFeedState): Record<string, string> {
  const params: Record<string, string> = {};
  if (state.search) params['search'] = state.search;
  if (state.providerTag) params['provider'] = state.providerTag;
  if (state.contentType) params['type'] = state.contentType;
  if (state.minScore) params['score'] = state.minScore;
  if (state.includePromo) params['promo'] = '1';
  if (state.sortBy !== 'publishedAt') params['sort'] = state.sortBy;
  if (state.sortDir === 'asc') params['dir'] = 'asc';
  if (state.pageIndex > 0) params['page'] = String(state.pageIndex + 1);
  return params;
}

export function toFeedRequest(state: RadarFeedState, limit: number): RadarFeedParams {
  return {
    page: state.pageIndex + 1,
    limit,
    search: state.search || undefined,
    providerTag: state.providerTag || undefined,
    contentType: state.contentType || undefined,
    minScore: state.minScore ? Number(state.minScore) : undefined,
    includePromo: state.includePromo,
    sortBy: state.sortBy,
    sortDir: state.sortDir,
  };
}

/**
 * Where an item sits in one Feed page, and which side needs the adjacent page. `null` when the
 * item is not on the page: the filters changed under it, or it was opened without Feed context
 * and is older than the first page.
 */
export function locateInPage(
  page: { data: RadarFeedItem[]; total: number },
  id: string,
  pageIndex: number,
  limit: number
): { position: number; prev: RadarFeedItem | 'previous-page' | null; next: RadarFeedItem | 'next-page' | null } | null {
  const i = page.data.findIndex((it) => it.id === id);
  if (i < 0) return null;
  const position = pageIndex * limit + i + 1;
  const prev = i > 0 ? page.data[i - 1] : pageIndex > 0 ? 'previous-page' : null;
  const next = i < page.data.length - 1 ? page.data[i + 1] : position < page.total ? 'next-page' : null;
  return { position, prev, next };
}
