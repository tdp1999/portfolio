import type { RadarContentType, RadarFeedSortKey, RadarProviderTag } from '@portfolio/shared/types';

export type { RadarFeedSortKey };

export type RadarWorkStatus = 'PENDING' | 'CLAIMED' | 'DONE';

export interface RadarItemSource {
  id: string;
  displayName: string;
  isActive: boolean;
}

export interface RadarEnrichmentSummary {
  tldr: string;
  providerTags: RadarProviderTag[];
  contentType: RadarContentType;
  signalScore: number;
  isPromo: boolean;
  isRelevant: boolean;
}

export interface RadarEnrichmentDetail extends RadarEnrichmentSummary {
  imageNotes: string | null;
  linkSummaries: { url: string; summary: string }[];
  commentDigest: string | null;
  factCheck: string | null;
  applyNote: string | null;
  /** Null on v1 enrichments, written before the field existed. */
  context: string | null;
  scoreReason: string | null;
  producerAdapter: string;
  producerModel: string;
  updatedAt: string;
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
  enrichment: RadarEnrichmentSummary | null;
}

export interface RadarFeedPage {
  data: RadarFeedItem[];
  total: number;
  page: number;
  limit: number;
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
  sortBy: RadarFeedSortKey;
  sortDir: 'asc' | 'desc';
  pageIndex: number;
}

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

export interface RadarItemDetail extends Omit<RadarFeedItem, 'preview' | 'enrichment'> {
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
}

export interface RadarQueueStats {
  pending: number;
  stuck: number;
  paused: number;
  analyzed: number;
}

export interface RadarSource {
  id: string;
  platform: 'FACEBOOK';
  url: string;
  displayName: string;
  isActive: boolean;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRadarSourceInput {
  url: string;
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

export type RadarRunFlow = 'MANUAL' | 'HYBRID';
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

export interface RadarRun {
  id: string;
  source: { id: string; displayName: string };
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
  error: string | null;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  /** Always in pipeline order: CAPTURE, NORMALIZE, ENRICH, ANALYZE. */
  steps: RadarStepRun[];
}

export interface CreateRadarRunInput {
  sourceId: string;
  flow: RadarRunFlow;
  itemCap: number;
  windowFrom?: string;
  windowTo?: string;
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
  steps: (RadarStepRun & { tooltip: string })[];
}
