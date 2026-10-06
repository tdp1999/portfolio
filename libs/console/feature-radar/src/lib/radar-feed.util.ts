import type { Params } from '@angular/router';
import {
  CONTENT_TYPE_LABELS,
  FEED_SORT_KEYS,
  FEED_STATUS_LABELS,
  MIN_SCORE_OPTIONS,
  PROVIDER_LABELS,
} from './radar.data';
import { FEED_PAGE_SIZE, FEED_PAGE_SIZES } from './radar.constants';
import type {
  RadarFeedItem,
  RadarFeedParams,
  RadarFeedSortKey,
  RadarFeedState,
  RadarTriageStatus,
} from './radar.types';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The triage tab as the URL spells it; Inbox is the default and stays out of the URL. */
const TRIAGE_PARAMS: Record<string, RadarTriageStatus> = { saved: 'SAVED', done: 'DONE' };

export const DEFAULT_FEED_STATE: RadarFeedState = {
  search: '',
  providerTag: '',
  contentType: '',
  minScore: '',
  includePromo: false,
  status: '',
  sourceId: '',
  sortBy: 'publishedAt',
  sortDir: 'desc',
  pageIndex: 0,
  pageSize: FEED_PAGE_SIZE,
  triage: 'INBOX',
};

/** A stale or hand-edited filter value would make the API answer 400 on every retry; drop it. */
const known = (value: unknown, allowed: readonly string[]): string =>
  typeof value === 'string' && allowed.includes(value) ? value : '';

/** Reads the Feed's URL query params. Unknown or malformed values fall back to the default. */
export function parseFeedQuery(params: Params): RadarFeedState {
  const page = Number(params['page']);
  const size = Number(params['size']);
  return {
    search: params['search'] ?? '',
    providerTag: known(params['provider'], Object.keys(PROVIDER_LABELS)),
    contentType: known(params['type'], Object.keys(CONTENT_TYPE_LABELS)),
    minScore: known(
      params['score'],
      MIN_SCORE_OPTIONS.map((o) => o.value)
    ),
    includePromo: params['promo'] === '1',
    status: known(params['status'], Object.keys(FEED_STATUS_LABELS)),
    // Sources are data, not a fixed list: only the shape is checked here.
    sourceId: typeof params['source'] === 'string' && UUID.test(params['source']) ? params['source'] : '',
    sortBy: FEED_SORT_KEYS.includes(params['sort']) ? (params['sort'] as RadarFeedSortKey) : 'publishedAt',
    sortDir: params['dir'] === 'asc' ? 'asc' : 'desc',
    pageIndex: Number.isInteger(page) && page > 1 ? page - 1 : 0,
    pageSize: (FEED_PAGE_SIZES as readonly number[]).includes(size) ? size : FEED_PAGE_SIZE,
    triage: Object.hasOwn(TRIAGE_PARAMS, params['triage']) ? TRIAGE_PARAMS[params['triage']] : 'INBOX',
  };
}

/** The Split pane's open post (`?item=`): only an id-shaped value, so a hand-edited URL never reaches the API. */
export function parseItemParam(value: unknown): string | null {
  return typeof value === 'string' && UUID.test(value) ? value : null;
}

/** The inverse of `parseFeedQuery`: defaults are left out so a plain Feed has a clean URL. */
export function toFeedQuery(state: RadarFeedState): Record<string, string> {
  const params: Record<string, string> = {};
  if (state.search) params['search'] = state.search;
  if (state.providerTag) params['provider'] = state.providerTag;
  if (state.contentType) params['type'] = state.contentType;
  if (state.minScore) params['score'] = state.minScore;
  if (state.includePromo) params['promo'] = '1';
  if (state.status) params['status'] = state.status;
  if (state.sourceId) params['source'] = state.sourceId;
  if (state.sortBy !== 'publishedAt') params['sort'] = state.sortBy;
  if (state.sortDir === 'asc') params['dir'] = 'asc';
  if (state.pageIndex > 0) params['page'] = String(state.pageIndex + 1);
  if (state.pageSize !== FEED_PAGE_SIZE) params['size'] = String(state.pageSize);
  if (state.triage !== 'INBOX') params['triage'] = state.triage.toLowerCase();
  return params;
}

export function toFeedRequest(state: RadarFeedState): RadarFeedParams {
  return {
    page: state.pageIndex + 1,
    limit: state.pageSize,
    search: state.search || undefined,
    providerTag: state.providerTag || undefined,
    contentType: state.contentType || undefined,
    minScore: state.minScore ? Number(state.minScore) : undefined,
    includePromo: state.includePromo,
    status: state.status || undefined,
    sourceId: state.sourceId || undefined,
    sortBy: state.sortBy,
    sortDir: state.sortDir,
    triageStatus: state.triage,
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
