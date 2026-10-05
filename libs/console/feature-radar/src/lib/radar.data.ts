import type { FilterOption } from '@portfolio/console/shared/ui';
import {
  RADAR_FEED_SORT_KEYS,
  type RadarContentType,
  type RadarFeedStatus,
  type RadarProviderTag,
} from '@portfolio/shared/types';
import type { RadarFeedSortKey, RadarWorkStatus } from './radar.types';

export const PROVIDER_LABELS: Record<RadarProviderTag, string> = {
  anthropic: 'Anthropic',
  openai: 'OpenAI',
  google: 'Google',
  meta: 'Meta',
  xai: 'xAI',
  deepseek: 'DeepSeek',
  opensource: 'Open source',
  other: 'Other',
};

export const CONTENT_TYPE_LABELS: Record<RadarContentType, string> = {
  news: 'News',
  tool: 'Tool',
  workflow: 'Workflow',
  opinion: 'Opinion',
  tutorial: 'Tutorial',
  promo: 'Promo',
};

const toOptions = (labels: Record<string, string>): FilterOption[] =>
  Object.entries(labels).map(([value, label]) => ({ value, label }));

/** Queue buckets of the Status filter, in the order the dropdown lists them. */
export const FEED_STATUS_LABELS: Record<RadarFeedStatus, string> = {
  pending: 'Pending',
  analyzed: 'Analyzed',
  stuck: 'Stuck',
  paused: 'Paused',
};

export const PROVIDER_OPTIONS = toOptions(PROVIDER_LABELS);
export const CONTENT_TYPE_OPTIONS = toOptions(CONTENT_TYPE_LABELS);

/** Bands of the enrichment guide's signal scale. */
export const MIN_SCORE_OPTIONS: FilterOption[] = [
  { value: '9', label: '9+ must read' },
  { value: '7', label: '7+ worth reading' },
  { value: '4', label: '4+ skimmable' },
];

/** Feed columns the API can sort by; guards the `sort` query param. */
export const FEED_SORT_KEYS: readonly RadarFeedSortKey[] = RADAR_FEED_SORT_KEYS;

export const WORK_STATUS_LABELS: Record<RadarWorkStatus, string> = {
  PENDING: 'Waiting in queue',
  CLAIMED: 'Being analyzed',
  DONE: 'Analyzed',
};
