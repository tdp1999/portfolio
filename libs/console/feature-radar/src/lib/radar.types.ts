import type {
  RadarContentType,
  RadarFeedSortKey,
  RadarProviderTag,
  RadarQueueState,
  RadarReanalyzeMode,
  RadarTriageStatus,
} from '@portfolio/shared/types';

export type { RadarFeedSortKey, RadarQueueState, RadarReanalyzeMode, RadarTriageStatus };

export type RadarWorkStatus = 'PENDING' | 'CLAIMED' | 'DONE';

/** Where a source's posts live. A YouTube source is a channel. */
export type RadarPlatform = 'FACEBOOK' | 'YOUTUBE';

export interface RadarItemSource {
  id: string;
  displayName: string;
  isActive: boolean;
  platform: RadarPlatform;
}

export interface RadarEnrichmentSummary {
  tldr: string;
  providerTags: RadarProviderTag[];
  contentType: RadarContentType;
  signalScore: number;
  isPromo: boolean;
  isRelevant: boolean;
  /** The analysis thinks the comments hold value (links, corrections) and they were not fetched. */
  wantsComments: boolean;
  /** `major`: the post misleads on its main claim, so the Feed and the post warn. Null without a fact check. */
  factCheckSeverity: RadarFactCheckSeverity | null;
  /** A server (AUTO) analysis: `light` quick pass or `deep` researched one. Null for a worker analysis (always full). */
  analysisDepth: RadarAnalysisDepth | null;
}

export type RadarAnalysisDepth = 'light' | 'deep';

export type RadarFactCheckSeverity = 'minor' | 'major';

export interface RadarEnrichmentDetail extends RadarEnrichmentSummary {
  imageNotes: string | null;
  linkSummaries: { url: string; summary: string }[];
  commentDigest: string | null;
  factCheck: string | null;
  applyNote: string | null;
  /** Null on v1 enrichments, written before the field existed. */
  context: string | null;
  scoreReason: string | null;
  /** The general read of the post; null before enrichment v3, until the post is re-analyzed. */
  overview: string | null;
  /** Pages the analysis used as evidence; empty when it named none. */
  sources: { url: string; title: string | null }[];
  producerAdapter: string;
  producerModel: string;
  updatedAt: string;
}

export type RadarCommentsStatus = 'NOT_FETCHED' | 'FETCHED' | 'PARTIAL' | 'FAILED';

/** An item's comment capture state. `postCount` is what Facebook reported; `fetchedCount` what was kept. */
export interface RadarCommentsSummary {
  status: RadarCommentsStatus;
  fetchedCount: number;
  fetchedAt: string | null;
  error: string | null;
  postCount: number;
}

export type RadarCommentLabel = 'author' | 'substantive' | 'low' | 'spam';

export interface RadarComment {
  id: string;
  parentId: string | null;
  depth: number;
  isAuthor: boolean;
  /** Only set on the post author's own comments. */
  authorName: string | null;
  text: string;
  publishedAt: string | null;
  likes: number;
  replies: number;
  label: RadarCommentLabel;
  links: string[];
  images: { url: string; ocrText: string | null }[];
}

export interface RadarFeedItem {
  id: string;
  source: RadarItemSource;
  kind: 'POST' | 'REEL' | 'VIDEO' | 'SHARE';
  permalink: string;
  authorName: string;
  publishedAt: string;
  /** The first 200 characters of the post text. */
  preview: string;
  workStatus: RadarWorkStatus;
  /** Where the post stands in the worker's queue (a live lease reads as `claimed`). */
  queueState: RadarQueueState;
  /** The Owner's decision: Inbox until marked Done or To try (`SAVED`). */
  triageStatus: RadarTriageStatus;
  /** Why the last analysis failed: a stuck post, or a deep pass that kept the quick result. */
  workError: string | null;
  /** The post's own images and video thumbnails, and how their stored copies stand. */
  images: RadarImagesSummary;
  enrichment: RadarEnrichmentSummary | null;
  comments: RadarCommentsSummary;
  /** Set when the capture carried a video file. */
  video: Pick<RadarItemVideo, 'durationSec' | 'transcriptStatus'> | null;
}

export interface RadarImagesSummary {
  total: number;
  /** Not copied to our storage yet. */
  pending: number;
  /** The copy failed; only the provider URL is left, which can expire. */
  failed: number;
}

export interface RadarFeedPage {
  data: RadarFeedItem[];
  total: number;
  page: number;
  limit: number;
  /** Items per triage tab under the same filters, whichever tab is open. */
  triageCounts: Record<RadarTriageStatus, number>;
}

export interface RadarFeedParams {
  page: number;
  limit: number;
  search?: string;
  providerTag?: string;
  contentType?: string;
  minScore?: number;
  includePromo?: boolean;
  sortBy?: RadarFeedSortKey;
  sortDir?: 'asc' | 'desc';
  status?: string;
  sourceId?: string;
  /** Posts this run touched last. */
  runId?: string;
  triageStatus?: RadarTriageStatus;
}

/** The Feed's filters, sort and page as the URL carries them, shared by the Feed and Detail (prev/next). */
export interface RadarFeedState {
  search: string;
  providerTag: string;
  contentType: string;
  /** Kept as the select's string value; '' means no minimum. */
  minScore: string;
  includePromo: boolean;
  /** A `RADAR_FEED_STATUSES` value; '' means every status. */
  status: string;
  /** A source id; '' means every source. */
  sourceId: string;
  sortBy: RadarFeedSortKey;
  sortDir: 'asc' | 'desc';
  pageIndex: number;
  /** One of `FEED_PAGE_SIZES`. */
  pageSize: number;
  /** The open triage tab. */
  triage: RadarTriageStatus;
}

/** How the Feed is shown: the table, or the list with the open post beside it. */
export type RadarFeedView = 'table' | 'split';

/** A prev/next target in the Feed, with the page it sits on so the walk can continue from there. */
export interface RadarNeighbour {
  id: string;
  pageIndex: number;
}

export interface RadarWorkflowProfile {
  body: string;
  updatedAt: string | null;
}

export interface RadarItemImage {
  type: 'photo' | 'video';
  url: string;
  storageStatus: 'pending' | 'stored' | 'failed';
  width: number | null;
  height: number | null;
  ocrText: string | null;
}

export interface RadarItemDetail extends Omit<RadarFeedItem, 'preview' | 'enrichment' | 'comments' | 'images'> {
  text: string;
  images: RadarItemImage[];
  links: { url: string; origin: 'post' | 'shared-post' }[];
  sharedPost: {
    authorName: string | null;
    permalink: string | null;
    publishedAt: string | null;
    text: string;
    images: RadarItemImage[];
  } | null;
  engagement: { likes: number; comments: number; shares: number; views: number | null };
  enrichment: RadarEnrichmentDetail | null;
  comments: RadarCommentsSummary & { items: RadarComment[] };
  /** Null for a post without a playable video. */
  video: RadarItemVideo | null;
  /** The run that touched this post last; null for a post stored before runs existed. */
  lastRunId: string | null;
}

/** What a video says and shows; only `spoken` is null for a silent video. */
export interface RadarTranscript {
  spoken: string | null;
  onScreenText: string | null;
  visualSummary: string;
  language: string | null;
}

export type RadarTranscriptStatus = 'NONE' | 'PENDING' | 'DONE' | 'FAILED';

export interface RadarItemVideo {
  durationSec: number | null;
  transcriptStatus: RadarTranscriptStatus;
  transcript: RadarTranscript | null;
  transcriptError: string | null;
}

export interface RadarQueueStats {
  pending: number;
  stuck: number;
  paused: number;
  analyzed: number;
}

export interface RadarSource {
  id: string;
  platform: RadarPlatform;
  url: string;
  displayName: string;
  isActive: boolean;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRadarSourceInput {
  platform: RadarPlatform;
  /** A page URL; for YouTube also a channel URL or a bare `@handle`. */
  url: string;
  /** May be empty for YouTube: the channel's title is used. */
  displayName: string;
}

export interface RadarUploadResult {
  runId: string;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  failures: { index: number; reason: string }[];
}

/** Whether an AUTO run can start, and the budget the New run dialog proposes. */
export interface RadarAiSettings {
  /** False while the server has no AI key: AUTO is disabled. */
  configured: boolean;
  /** `free`: spend is a list-price estimate, nothing is charged. */
  billing: 'free' | 'paid';
  defaultBudgetMicroUsd: number;
}

/** Comment limits from the server's config, quoted in the confirm texts. */
export interface RadarCommentsSettings {
  runMaxChargeUsd: number;
  itemMaxChargeUsd: number;
  itemTopLevelLimit: number;
}

/** One Detail page fetch: `running` until the Apify job ends, then what was stored. */
export type RadarItemCommentsFetch =
  | { state: 'running'; jobRef: string }
  | { state: 'done'; jobRef: string; status: RadarCommentsStatus; fetchedCount: number };

export interface RadarCommentsUploadResult {
  posts: number;
  comments: number;
  unmatched: number;
  failed: number;
  failures: { index: number; reason: string }[];
}

export type RadarRunFlow = 'MANUAL' | 'HYBRID' | 'AUTO';
export type RadarRunStatus = 'PENDING' | 'RUNNING' | 'AWAITING_EXTERNAL' | 'DONE' | 'FAILED';
/** A run status as the Runs page shows it: a FAILED run the Owner cancelled reads as `CANCELLED`. */
export type RadarRunDisplayStatus = RadarRunStatus | 'CANCELLED';
export type RadarRunStep = 'CAPTURE' | 'NORMALIZE' | 'ENRICH' | 'ANALYZE';

export interface RadarStepRun {
  step: RadarRunStep;
  status: RadarRunStatus;
  adapter: string;
  error: string | null;
  startedAt: string | null;
  finishedAt: string | null;
}

/** `REANALYZE`: analyzes posts picked in the Feed again; no source, no capture, ANALYZE only. */
export type RadarRunKind = 'CAPTURE' | 'REANALYZE';

export interface RadarRun {
  id: string;
  kind: RadarRunKind;
  /** Null on a re-analysis run, whose posts can come from several sources. */
  source: { id: string; displayName: string } | null;
  flow: RadarRunFlow;
  status: RadarRunStatus;
  /** Null on both ends means a backfill with no date filter. */
  windowFrom: string | null;
  windowTo: string | null;
  itemCap: number;
  captureAdapter: string;
  llmAdapter: string;
  itemsCaptured: number;
  itemsCreated: number;
  itemsUpdated: number;
  itemsFailed: number;
  fetchComments: boolean;
  /** AUTO only: the AI spend cap, micro-USD. */
  budgetMicroUsd: number | null;
  /** AUTO only: the AI cost recorded so far, micro-USD (an estimate on the free tier). */
  spentMicroUsd: number | null;
  error: string | null;
  /** A side step (comments) failed but the run went on. */
  warning: string | null;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  /** In pipeline order: CAPTURE, NORMALIZE, ENRICH, ANALYZE (ANALYZE only on a re-analysis). */
  steps: RadarStepRun[];
}

/** One AI feature's share of a run's calls. */
export interface RadarRunAiSpend {
  feature: string;
  calls: number;
  failed: number;
  tokensIn: number;
  tokensOut: number;
  costMicroUsd: number;
}

export interface RadarRunFailure {
  /** The post's URL or id, when the unreadable row still had one. */
  ref: string | null;
  reason: string;
}

/** The run detail page: the list row plus what the run sent, could not read and spent. */
export interface RadarRunDetail extends RadarRun {
  /** The input sent to the capture provider; null for a Manual run, a re-analysis or an older run. */
  captureInput: Record<string, unknown> | null;
  /** The provider's job reference (the Apify run id); null before the capture started or for an upload. */
  captureJobRef: string | null;
  /** The first unreadable posts with their reason; `dropped` counts the rest. */
  failures: { items: RadarRunFailure[]; dropped: number };
  /** AUTO only: calls, tokens and cost per AI feature, most expensive first. */
  aiSpend: RadarRunAiSpend[] | null;
}

/** One step of the run detail timeline, with what the row shows precomputed. */
export interface RadarRunStepRow extends RadarStepRun {
  label: string;
  /** "Not reached" for a step a finished run never got to, otherwise the status label. */
  statusLabel: string;
  icon: string;
  /** "1 min 12 s"; null when the step has not both started and ended. */
  duration: string | null;
  notReached: boolean;
}

/** One post of the run detail list, ready to render. */
export interface RadarRunPostRow {
  id: string;
  authorName: string;
  publishedAt: string;
  isVideo: boolean;
  kindLabel: string;
  statusLabel: string;
  score: number | null;
}

export interface CreateRadarRunInput {
  sourceId: string;
  flow: RadarRunFlow;
  itemCap: number;
  windowFrom?: string;
  windowTo?: string;
  /** Only on a Hybrid run with a window start; the API refuses it on a backfill. */
  fetchComments?: boolean;
  /** AUTO only, in USD; the server's default when left out. */
  budgetUsd?: number;
}

export interface RadarRunCreateDialogData {
  /** Active sources only: the API refuses a run on a paused one. */
  sources: RadarSource[];
  /** The Runs page's list, newest first, used to chain the default window. */
  runs: RadarRun[];
}

export type RunNotice =
  | { kind: 'failed'; title: string; message: string }
  | { kind: 'cancelled'; title: string }
  | { kind: 'awaiting-upload' }
  | { kind: 'awaiting-work' };

/** A run as one Runs page row shows it: flags, notice and step tooltips computed once per poll. */
export interface RadarRunRow extends Omit<RadarRun, 'steps'> {
  /** The run's status, with a cancelled FAILED run shown as `CANCELLED`. */
  displayStatus: RadarRunDisplayStatus;
  active: boolean;
  awaitingUpload: boolean;
  notice: RunNotice | null;
  stepSummary: string;
  itemsDetail: string;
  /** What the Owner does by hand in this run's flow. */
  flowHelp: string;
  /** The source's name, or "Re-analysis" for a run with no source. */
  sourceLabel: string;
  /** "12 captured", or "12 to analyze" for a re-analysis. */
  itemsLabel: string;
  steps: (RadarStepRun & { tooltip: string })[];
}

// --- Briefs ---

export interface RadarBrief {
  id: string;
  /** Null: the brief covers every source. */
  source: { id: string; displayName: string } | null;
  windowFrom: string;
  windowTo: string;
  workStatus: RadarWorkStatus;
  leaseExpiresAt: string | null;
  /** Analyzed posts the brief covers; set when the worker submits it. */
  itemCount: number;
  producer: { adapter: string; model: string } | null;
  writer: RadarBriefWriter;
  /** Why an Auto brief could not be written; it is then done with an empty body. */
  error: string | null;
  createdAt: string;
}

/** AUTO: the server AI writes it within a minute or two; WORKER: `/radar work brief` in Claude Code. */
export type RadarBriefWriter = 'AUTO' | 'WORKER';

export type RadarBriefDisplayStatus = 'WAITING_WORKER' | 'QUEUED' | 'WRITING' | 'READY' | 'FAILED';

export interface RadarBriefDetail extends RadarBrief {
  /** Markdown. Empty until the brief is written. */
  body: string;
}

export interface CreateRadarBriefInput {
  sourceId: string | null;
  windowFrom: string;
  windowTo: string;
  writer: RadarBriefWriter;
}

export interface RadarBriefCreateDialogData {
  sources: RadarSource[];
}

export type RadarTrialStatus = 'RUNNING' | 'DONE' | 'FAILED';

/** The enrichment a quality trial produced: the same fields as the item's, with who produced it. */
export interface RadarTrialEnrichment {
  tldr: string;
  signalScore: number;
  overview: string;
  context: string;
  applyNote: string;
  factCheck: string | null;
  sources: { url: string; title: string | null }[];
  producer: { adapter: string; model: string };
}

/** One quality trial: the item analyzed again by the server AI, stored next to its enrichment. */
export interface RadarTrial {
  id: string;
  depth: RadarAnalysisDepth;
  requestedModel: string | null;
  status: RadarTrialStatus;
  enrichment: RadarTrialEnrichment | null;
  error: string | null;
  tokensIn: number;
  tokensOut: number;
  costMicroUsd: number | null;
  searchQueries: number;
  latencyMs: number | null;
  createdAt: string;
  finishedAt: string | null;
}

export interface CreateRadarTrialsInput {
  itemIds: string[];
  depth: RadarAnalysisDepth;
  /** A model id; the depth's default chain when left out. */
  model?: string;
}

export interface CreateRadarTrialsResult {
  started: { id: string; itemId: string }[];
  skipped: { itemId: string; reason: string }[];
}

/** One column of the compare table: the item's current enrichment, or one trial. */
export interface RadarTrialColumn {
  key: string;
  heading: string;
  model: string;
  status: RadarTrialStatus;
  error: string | null;
  tldr: string | null;
  score: number | null;
  overview: string | null;
  context: string | null;
  applyNote: string | null;
  factCheck: string | null;
  sources: { url: string; title: string | null }[];
  /** Null for the current enrichment: its call was not recorded. */
  usage: {
    tokensIn: number;
    tokensOut: number;
    costMicroUsd: number | null;
    seconds: string | null;
    searches: number;
  } | null;
}

export interface RadarCommentsChip {
  /** `12 / 40`: kept after filtering / reported by Facebook. Just the Facebook count when not fetched. */
  label: string;
  /** Classes for the cell: a console badge once fetched, plain muted text before. */
  badge: string;
  icon: string;
  tooltip: string;
  /** The analysis suggests fetching them; shown only while they are not fetched. */
  suggested: boolean;
}

export interface RadarSourceMonogram {
  initials: string;
  /** One of six fixed tones, the same for a name on every row and every visit. */
  tone: number;
}

/** What Quick Look needs of an image: a post photo or a comment's image. */
export type RadarLightboxPhoto = Pick<RadarItemImage, 'url' | 'ocrText'>;

/** A triage decision on the open post: the status it moves to. */
export interface RadarTriageDecision {
  id: string;
  status: RadarTriageStatus;
}

// --- Re-analysis ---

export interface ReanalyzeItemsInput {
  ids: string[];
  mode: RadarReanalyzeMode;
  /** AUTO only, in USD; the server's default when left out. */
  budgetUsd?: number;
}

export interface ReanalyzeItemsResult {
  requeued: number;
  /** Unknown, under a live lease, still in an active run, or on a paused source. */
  skipped: number;
  /** The re-analysis run; null for WORKER or when nothing was requeued. */
  runId: string | null;
}

export interface RadarReanalyzeDialogData {
  ids: string[];
}
