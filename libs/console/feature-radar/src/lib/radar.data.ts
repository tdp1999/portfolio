import type { FilterOption, SegmentedControlOption, ToastAction } from '@portfolio/console/shared/ui';
import {
  RADAR_FEED_SORT_KEYS,
  RADAR_MAX_CLAIM_ATTEMPTS,
  type RadarContentType,
  type RadarFeedStatus,
  type RadarProviderTag,
} from '@portfolio/shared/types';
import type {
  RadarAnalysisDepth,
  RadarFeedItem,
  RadarFeedSortKey,
  RadarRunDisplayStatus,
  RadarRunFlow,
  RadarBriefWriter,
  RadarBriefDisplayStatus,
  RadarCommentLabel,
  RadarPlatform,
  RadarRunStatus,
  RadarQueueState,
  RadarReanalyzeMode,
  RadarRunStep,
  RadarTranscriptStatus,
  RadarTriageStatus,
  RadarWorkStatus,
  ReanalyzeItemsResult,
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

/** Where a source's posts live, as the copy names it (`12 on YouTube`, `Watch on Facebook`). */
export const PLATFORM_LABELS: Record<RadarPlatform, string> = {
  FACEBOOK: 'Facebook',
  YOUTUBE: 'YouTube',
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

export const BRIEF_STATUS_LABELS: Record<RadarBriefDisplayStatus, string> = {
  WAITING_WORKER: 'Waiting for worker',
  QUEUED: 'Queued',
  WRITING: 'Being written',
  READY: 'Ready',
  FAILED: 'Failed',
};

export const BRIEF_STATUS_BADGES: Record<RadarBriefDisplayStatus, string> = {
  WAITING_WORKER: 'console-badge--warn',
  QUEUED: 'console-badge--muted',
  WRITING: 'console-badge--muted',
  READY: 'console-badge--success',
  FAILED: 'console-badge--danger',
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

export const REANALYZE_HELP =
  'Posts picked in the Feed, analyzed again by the server with AI. No capture: each post keeps its text, images and transcript.';

export const REANALYZE_MODE_HELP: Record<RadarReanalyzeMode, string> = {
  AUTO: 'The server analyzes the posts now with AI, in a re-analysis run you can follow on the Runs page.',
  WORKER: 'The posts wait in the queue for the next /radar work in Claude Code.',
};

/** Auto first; greyed out with no AI key on the server. */
export function reanalyzeModeOptions(aiConfigured: boolean): SegmentedControlOption[] {
  return [
    { value: 'AUTO', label: 'Auto', disabled: !aiConfigured },
    { value: 'WORKER', label: 'Claude Code' },
  ];
}

/**
 * What the toast after a re-analysis request says: how many went back and how many were left. A
 * worker re-analysis adds the next step; an Auto one gets a link to the Runs page instead.
 */
export function reanalyzeToast(result: ReanalyzeItemsResult, mode: RadarReanalyzeMode): string {
  const posts = (n: number) => `${n} ${n === 1 ? 'post' : 'posts'}`;
  const skipped = result.skipped
    ? ` ${posts(result.skipped)} skipped (still being analyzed, in a running run, or on a paused source).`
    : '';
  if (result.requeued === 0) return `Nothing was queued.${skipped}`;
  const next = mode === 'WORKER' ? ' Run /radar work to analyze them.' : '';
  return `${posts(result.requeued)} queued for re-analysis.${skipped}${next}`;
}

/** AI ledger features a run can spend on. Unknown features show their raw name. */
export const RUN_AI_FEATURE_LABELS: Record<string, string> = {
  'radar.analyze': 'Deep analysis',
  'radar.analyze.light': 'Quick analysis',
  'radar.transcript': 'Video transcripts',
};

export const ITEM_KIND_LABELS: Record<RadarFeedItem['kind'], string> = {
  POST: 'Post',
  REEL: 'Reel',
  VIDEO: 'Video',
  SHARE: 'Share',
};

/** The toast action of an Auto re-analysis: opens the run it started. */
export const reanalyzeRunLink = (runId: string): ToastAction => ({
  label: 'Follow the run',
  link: ['/radar/runs', runId],
});

export const RUN_FLOW_ORDER: readonly RadarRunFlow[] = ['AUTO', 'HYBRID', 'MANUAL'];

export const BRIEF_WRITER_HELP: Record<RadarBriefWriter, string> = {
  AUTO: 'The server writes it with AI within a minute or two, linking each point to its post.',
  WORKER: 'It waits until you run /radar work brief in Claude Code, which writes it and links each point to its post.',
};

/** The writer picker; Auto is greyed out while the server has no AI key. */
export function briefWriterOptions(aiConfigured: boolean): SegmentedControlOption[] {
  return [
    { value: 'AUTO', label: 'Auto', disabled: !aiConfigured },
    { value: 'WORKER', label: 'Claude Code' },
  ];
}

/** The flow picker; AUTO is greyed out while the server has no AI key. */
/** `manualAllowed`: a Manual run uploads a Facebook export, so a YouTube source cannot take one. */
export function runFlowOptions(aiConfigured: boolean, manualAllowed = true): SegmentedControlOption[] {
  return RUN_FLOW_ORDER.map((value) => ({
    value,
    label: RUN_FLOW_LABELS[value],
    disabled: (value === 'AUTO' && !aiConfigured) || (value === 'MANUAL' && !manualAllowed),
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

/** Only the exceptions carry a badge: kept comments are substantive by default (spam is filtered at capture). */
export const COMMENT_TAGS: Record<RadarCommentLabel, { text: string; badge: string } | null> = {
  author: null,
  substantive: null,
  low: { text: 'Filler', badge: 'console-badge console-badge--muted' },
  spam: { text: 'Spam', badge: 'console-badge console-badge--danger' },
};

/** The mark a row carries once it was moved out of the open tab (it leaves on the next load). */
export const TRIAGE_ROW_MARKS: Record<RadarTriageStatus, { icon: string; label: string }> = {
  INBOX: { icon: 'inbox', label: 'Moved to Inbox' },
  SAVED: { icon: 'bookmark', label: 'Saved to To try' },
  DONE: { icon: 'check', label: 'Marked done' },
};

/** The transcript fold's gist when there is no transcript to show (DONE and FAILED say more). */
export const TRANSCRIPT_STATUS_GISTS: Record<Exclude<RadarTranscriptStatus, 'DONE' | 'FAILED'>, string> = {
  NONE: 'No transcript: only Auto runs make one',
  PENDING: 'Waiting: the AI was busy, the next tick tries again',
};
