import type { FilterOption, SegmentedControlOption } from '@portfolio/console/shared/ui';
import {
  RADAR_FEED_SORT_KEYS,
  type RadarContentType,
  type RadarFeedStatus,
  type RadarProviderTag,
} from '@portfolio/shared/types';
import type {
  RadarFeedSortKey,
  RadarRunDisplayStatus,
  RadarRunFlow,
  RadarRunStatus,
  RadarRunStep,
  RadarWorkStatus,
} from './radar.types';

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

export const BRIEF_STATUS_LABELS: Record<RadarWorkStatus, string> = {
  PENDING: 'Waiting for worker',
  CLAIMED: 'Being written',
  DONE: 'Ready',
};

export const BRIEF_STATUS_BADGES: Record<RadarWorkStatus, string> = {
  PENDING: 'console-badge--warn',
  CLAIMED: 'console-badge--muted',
  DONE: 'console-badge--success',
};

export const RUN_STEP_LABELS: Record<RadarRunStep, string> = {
  CAPTURE: 'Capture',
  NORMALIZE: 'Normalize',
  ENRICH: 'Images',
  ANALYZE: 'Analyze',
};

export const RUN_STATUS_LABELS: Record<RadarRunDisplayStatus, string> = {
  PENDING: 'Queued',
  RUNNING: 'Running',
  AWAITING_EXTERNAL: 'Waiting',
  DONE: 'Done',
  FAILED: 'Failed',
  CANCELLED: 'Cancelled',
};

export const RUN_FLOW_LABELS: Record<RadarRunFlow, string> = {
  HYBRID: 'Hybrid',
  MANUAL: 'Manual',
};

export const RUN_FLOW_OPTIONS: SegmentedControlOption[] = (['HYBRID', 'MANUAL'] as const).map((value) => ({
  value,
  label: RUN_FLOW_LABELS[value],
}));

/** Badge tone of a run's overall status on the Runs page. */
export const RUN_STATUS_BADGES: Record<RadarRunDisplayStatus, string> = {
  PENDING: 'console-badge--muted',
  RUNNING: 'console-badge--muted',
  AWAITING_EXTERNAL: 'console-badge--warn',
  DONE: 'console-badge--success',
  FAILED: 'console-badge--danger',
  CANCELLED: 'console-badge--muted',
};

/** Icon of each step's status in the Runs page's step track. */
export const RUN_STEP_ICONS: Record<RadarRunStatus, string> = {
  PENDING: 'radio_button_unchecked',
  RUNNING: 'autorenew',
  AWAITING_EXTERNAL: 'hourglass_top',
  DONE: 'check_circle',
  FAILED: 'error',
};
