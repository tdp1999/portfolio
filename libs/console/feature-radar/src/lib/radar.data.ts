import type { FilterOption, SegmentedControlOption } from '@portfolio/console/shared/ui';
import {
  RADAR_FEED_SORT_KEYS,
  RADAR_MAX_CLAIM_ATTEMPTS,
  type RadarContentType,
  type RadarFeedStatus,
  type RadarProviderTag,
} from '@portfolio/shared/types';
import type {
  RadarAnalysisDepth,
  RadarFeedSortKey,
  RadarRunDisplayStatus,
  RadarRunFlow,
  RadarRunStatus,
  RadarQueueState,
  RadarRunStep,
  RadarTriageStatus,
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
  AUTO: 'Auto',
  HYBRID: 'Hybrid',
  MANUAL: 'Manual',
};

/** What the Owner does by hand in each flow, shown under the flow picker and on the Runs page. */
export const RUN_FLOW_HELP: Record<RadarRunFlow, string> = {
  AUTO: 'The server captures the posts with Apify and analyzes them with AI. You only read the Feed.',
  HYBRID: 'The server captures the posts with Apify. You analyze them with /radar work in Claude Code.',
  MANUAL: 'You export the posts from Apify, upload the file into the run, then run /radar work.',
};

export const RUN_FLOW_ORDER: readonly RadarRunFlow[] = ['AUTO', 'HYBRID', 'MANUAL'];

/** The flow picker; AUTO is greyed out while the server has no AI key. */
export function runFlowOptions(aiConfigured: boolean): SegmentedControlOption[] {
  return RUN_FLOW_ORDER.map((value) => ({
    value,
    label: RUN_FLOW_LABELS[value],
    disabled: value === 'AUTO' && !aiConfigured,
  }));
}

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

/** The Feed's triage tabs, in reading order. `SAVED` reads as "To try". */
export const TRIAGE_TABS: { value: RadarTriageStatus; label: string }[] = [
  { value: 'INBOX', label: 'Inbox' },
  { value: 'SAVED', label: 'To try' },
  { value: 'DONE', label: 'Done' },
];

export const FEED_VIEW_OPTIONS: SegmentedControlOption[] = [
  { value: 'table', label: 'Table', icon: 'table_rows' },
  { value: 'split', label: 'Split', icon: 'vertical_split' },
];

/** The Split view has no column headers to sort by, so sort is a select: one option per sort key and direction. */
export const SPLIT_SORT_OPTIONS: (FilterOption & { sortBy: RadarFeedSortKey; sortDir: 'asc' | 'desc' })[] = [
  { value: 'newest', label: 'Newest', sortBy: 'publishedAt', sortDir: 'desc' },
  { value: 'oldest', label: 'Oldest', sortBy: 'publishedAt', sortDir: 'asc' },
  { value: 'score', label: 'Top score', sortBy: 'signalScore', sortDir: 'desc' },
  { value: 'source', label: 'Source A to Z', sortBy: 'source', sortDir: 'asc' },
];

/** The analysis icon of a Feed row, per queue state: shape and tone carry the state, the tooltip names it. */
export const QUEUE_STATE_ICONS: Record<RadarQueueState, { icon: string; tone: string; label: string }> = {
  analyzed: { icon: 'check_circle', tone: 'success', label: 'Analyzed' },
  claimed: { icon: 'autorenew', tone: 'info', label: 'Being analyzed: a worker holds it right now' },
  pending: { icon: 'schedule', tone: 'muted', label: 'Waiting in the queue for the next /radar work' },
  stuck: {
    icon: 'report',
    tone: 'error',
    label: `Stuck: claimed ${RADAR_MAX_CLAIM_ATTEMPTS} times with no result. Re-queue it from the header`,
  },
  paused: { icon: 'pause_circle', tone: 'warning', label: 'Paused: its source is paused, so the worker skips it' },
};

/** How deep an analysis went: server quick pass, server researched pass, or the worker (always full). */
export const ANALYSIS_DEPTH_LABELS: Record<RadarAnalysisDepth | 'worker', string> = {
  light: 'Quick',
  deep: 'Deep',
  worker: 'Full',
};

export const ANALYSIS_DEPTH_HELP: Record<RadarAnalysisDepth | 'worker', string> = {
  light:
    'Quick pass on the server: images, TL;DR and score, no web search and no link reading. The best-scoring posts then get the deep analysis.',
  deep: 'Deep analysis on the server: web search, links read, fact check.',
  worker: 'Analyzed by /radar work in Claude Code, with research and links read.',
};
