import {
  RadarBriefWriter,
  RadarCommentsStatus,
  RadarItemKind,
  RadarPlatform,
  RadarRunFlow,
  RadarRunKind,
  RadarStatus,
  RadarStep,
  RadarTriageStatus,
  RadarWorkStatus,
} from '@prisma/client';

import { RadarComment } from '../domain/radar-comment.types';
import { RadarItemVideo } from '../domain/radar-transcript.types';
import { RadarRunFailure } from '../domain/radar-run.types';
import { z } from 'zod/v4';

import {
  RADAR_CONTENT_TYPES,
  RADAR_FEED_PAGE_SIZE,
  RADAR_FEED_PAGE_SIZES,
  RADAR_FEED_SORT_KEYS,
  RADAR_FEED_STATUSES,
  RADAR_MAX_PROFILE_CHARS,
  RADAR_MAX_RUN_BUDGET_USD,
  RADAR_MAX_RUN_ITEM_CAP,
  RADAR_MIN_RUN_BUDGET_USD,
  RADAR_PROVIDER_TAGS,
  RADAR_REANALYZE_MAX_IDS,
  RADAR_REANALYZE_MODES,
  RADAR_TRIAGE_MAX_IDS,
  RADAR_TRIAL_MAX_IDS,
  type RadarQueueState,
} from '@portfolio/shared/types';

import { RadarEngagement, RadarLink, RadarMediaStorageStatus, RadarNormalizeFailure } from '../domain/radar.types';
import {
  RadarEnrichmentDetail,
  RadarEnrichmentSummary,
  RadarQueueStats,
  RadarTriageCounts,
} from './ports/radar-item.repository.port';

/** A 6-month backfill of one prolific profile is ~1,100 posts; leave room without inviting abuse. */
export const MAX_UPLOAD_POSTS = 5000;
export const MAX_UPLOAD_BYTES = 30 * 1024 * 1024;
/** Cap the per-post failure list in the response; the counts stay exact. */
export const MAX_REPORTED_FAILURES = 50;

/** A bare YouTube handle (`@channel`) stands for its channel page. */
const withHandleUrl = (v: unknown) =>
  typeof v === 'string' && /^@[\w.-]+$/.test(v.trim()) ? `https://www.youtube.com/${v.trim()}` : v;
const YOUTUBE_HOST = /^https?:\/\/([a-z0-9-]+\.)*(youtube\.com|youtu\.be)(\/|$)/i;

export const CreateRadarSourceSchema = z
  .object({
    platform: z.enum(RadarPlatform).default(RadarPlatform.FACEBOOK),
    url: z.preprocess(
      withHandleUrl,
      z
        .url({ protocol: /^https?$/ })
        .max(500)
        .transform((v) => v.trim().replace(/\/+$/, ''))
    ),
    /** Optional for YouTube: the channel's own title is used when it is left empty. */
    displayName: z.string().trim().max(200).default(''),
  })
  .refine((v) => v.platform !== RadarPlatform.FACEBOOK || v.displayName.length > 0, {
    path: ['displayName'],
    message: 'A Facebook source needs a display name',
  })
  .refine((v) => v.platform !== RadarPlatform.FACEBOOK || !YOUTUBE_HOST.test(v.url), {
    path: ['platform'],
    message: 'This is a YouTube URL; add it as a YouTube source',
  });

export const UploadCaptureBodySchema = z.object({
  format: z.string().min(1).max(64).default('apify-facebook-posts'),
  /** A Manual run created through the runs API that waits for this file. Omit for a one-off upload. */
  runId: z.uuid().optional(),
});

export const UploadCaptureFileSchema = z.array(z.unknown()).min(1).max(MAX_UPLOAD_POSTS);

export interface RadarSourceResponseDto {
  id: string;
  platform: RadarPlatform;
  url: string;
  displayName: string;
  isActive: boolean;
  itemCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/** A comments export: one dataset item per comment, a few thousand at most. */
export const MAX_UPLOAD_COMMENTS = 20_000;
export const UploadCommentsFileSchema = z.array(z.unknown()).min(1).max(MAX_UPLOAD_COMMENTS);

export interface UploadCommentsResponseDto {
  /** Posts whose comment list was replaced. */
  posts: number;
  /** Comments stored across those posts, after filtering. */
  comments: number;
  /** Comments whose post is not an item of this source. */
  unmatched: number;
  failed: number;
  failures: RadarNormalizeFailure[];
}

/** An item's comment capture state, for the list chip and the Detail page. */
export interface RadarItemCommentsDto {
  status: RadarCommentsStatus;
  fetchedCount: number;
  fetchedAt: Date | null;
  error: string | null;
}

/** What the New run dialog needs to offer an AUTO run. */
export interface RadarAiSettingsDto {
  /** False while the AI provider has no key: an AUTO run is refused. */
  configured: boolean;
  /** `free`: spend figures are list-price estimates, nothing is charged. */
  billing: 'free' | 'paid';
  defaultBudgetMicroUsd: number;
}

/** Comment limits the console quotes in its confirm texts; they follow the server's config. */
export interface RadarCommentsSettingsDto {
  /** Charge cap shared by all comments jobs of one run. */
  runMaxChargeUsd: number;
  /** Charge cap of one Detail page fetch. */
  itemMaxChargeUsd: number;
  /** Top-level comments a Detail page fetch reads (replies come on top). */
  itemTopLevelLimit: number;
}

/** The Detail page's comments fetch: `running` until the provider job ends, then what was stored. */
export type RadarItemCommentsFetchDto =
  | { state: 'running'; jobRef: string }
  | { state: 'done'; jobRef: string; status: RadarCommentsStatus; fetchedCount: number };

export interface RadarItemCommentsSummaryDto extends RadarItemCommentsDto {
  /** Comments Facebook reported on the post when it was captured. */
  postCount: number;
}

export interface UploadCaptureResponseDto {
  runId: string;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  failures: RadarNormalizeFailure[];
}

export const MAX_CLAIM_ITEMS = 20;
/** One worst-case result is ~30 KB, so 10 keep a normal batch under the 100 KB JSON body limit; on a 413 the worker resubmits one by one. */
export const MAX_SUBMIT_RESULTS = 10;
export const MAX_PROFILE_CHARS = RADAR_MAX_PROFILE_CHARS;

/** Items carry one work status, so only the item-level analyze step is claimable today. */
export const ClaimWorkSchema = z.object({
  step: z.enum([RadarStep.ANALYZE]),
  limit: z.int().min(1).max(MAX_CLAIM_ITEMS).default(5),
});

/** Each `enrichment` is validated on its own so one bad result never sinks the batch. */
export const SubmitResultsSchema = z.object({
  results: z
    .array(z.object({ itemId: z.uuid(), enrichment: z.unknown() }))
    .min(1)
    .max(MAX_SUBMIT_RESULTS),
});

export const UpsertWorkflowProfileSchema = z.object({
  body: z.string().max(MAX_PROFILE_CHARS),
});

export interface RadarWorkImageDto {
  type: 'photo' | 'video';
  url: string;
  ocrText: string | null;
}

/** A comment as the worker reads it: author comments in full, others cut short, low and spam left out. */
export type RadarWorkCommentDto = Pick<
  RadarComment,
  'id' | 'parentId' | 'depth' | 'isAuthor' | 'authorName' | 'text' | 'likes' | 'replies' | 'links' | 'images'
>;

export interface RadarWorkItemDto {
  id: string;
  kind: RadarItemKind;
  permalink: string;
  authorName: string;
  publishedAt: Date;
  text: string;
  images: RadarWorkImageDto[];
  links: RadarLink[];
  sharedPost: { authorName: string | null; permalink: string | null; text: string; images: RadarWorkImageDto[] } | null;
  engagement: RadarEngagement;
  /** `NOT_FETCHED` means nobody looked, not that the post has none: never infer "no discussion" from it. */
  comments: { status: RadarCommentsStatus; items: RadarWorkCommentDto[] };
  /**
   * The post's video, when it has one: `transcript` is set once status is DONE. `NONE` means no
   * transcript was made (a Hybrid or Manual run), `FAILED` carries the reason in `transcriptError`.
   */
  video: RadarItemVideo | null;
}

export interface ClaimWorkResponseDto {
  step: RadarStep;
  /** Null when nothing was claimed. */
  leaseExpiresAt: Date | null;
  items: RadarWorkItemDto[];
}

export interface SubmitResultsResponseDto {
  stored: number;
  rejected: { itemId: string; reason: string }[];
}

export interface RadarWorkflowProfileDto {
  body: string;
  /** Null until the Owner saves a profile for the first time. */
  updatedAt: Date | null;
}

export const FEED_PAGE_SIZE = RADAR_FEED_PAGE_SIZE;
/** What the Feed shows for an item the worker has not analyzed yet. */
export const FEED_PREVIEW_CHARS = 200;

/** Query-string shape of `GET /radar/items`, so every value arrives as a string. */

export const ListRadarItemsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(Math.max(...RADAR_FEED_PAGE_SIZES))
    .default(FEED_PAGE_SIZE),
  search: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((v) => v || undefined),
  providerTag: z.enum(RADAR_PROVIDER_TAGS).optional(),
  contentType: z.enum(RADAR_CONTENT_TYPES).optional(),
  minScore: z.coerce.number().int().min(0).max(10).optional(),
  // stringbool, not coerce.boolean: coerce turns the string "false" into true.
  includePromo: z.stringbool().default(false),
  sourceId: z.uuid().optional(),
  /** Posts this run touched last (`lastRunId`); a later run that touches a post takes it over. */
  runId: z.uuid().optional(),
  status: z.enum(RADAR_FEED_STATUSES).optional(),
  triageStatus: z.enum(RadarTriageStatus).optional(),
  sortBy: z.enum(RADAR_FEED_SORT_KEYS).default('publishedAt'),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
});

interface RadarItemSourceDto {
  id: string;
  displayName: string;
  isActive: boolean;
  /** Where the post lives, so the console names it ("Open on YouTube") and marks its monogram. */
  platform: RadarPlatform;
}

export interface RadarFeedItemDto {
  id: string;
  source: RadarItemSourceDto;
  kind: RadarItemKind;
  permalink: string;
  authorName: string;
  publishedAt: Date;
  /** The first `FEED_PREVIEW_CHARS` characters of the post text. */
  preview: string;
  workStatus: RadarWorkStatus;
  /** Where the item stands in the worker's queue, split out of `workStatus` and the lease. */
  queueState: RadarQueueState;
  triageStatus: RadarTriageStatus;
  /** Why the last analysis failed; null when it did not. */
  workError: string | null;
  /** Photos and videos of the post itself (a shared post's are not counted), and how their copies stand. */
  images: RadarImagesSummaryDto;
  enrichment: RadarEnrichmentSummary | null;
  comments: RadarItemCommentsSummaryDto;
  /** Set when the capture carried a video file, so the Feed can mark the post; never the file URL. */
  video: Pick<RadarItemVideo, 'durationSec' | 'transcriptStatus'> | null;
}

export interface RadarImagesSummaryDto {
  total: number;
  /** Not copied to our storage yet; shown from the provider URL, which can expire. */
  pending: number;
  /** The copy failed; the provider URL is all there is. */
  failed: number;
}

export interface RadarFeedPageDto {
  data: RadarFeedItemDto[];
  total: number;
  page: number;
  limit: number;
  /** Per triage status under the same filters, for the Inbox / To try / Done tabs. */
  triageCounts: RadarTriageCounts;
}

export const TriageRadarItemsSchema = z.object({
  ids: z.array(z.uuid()).min(1).max(RADAR_TRIAGE_MAX_IDS),
  status: z.enum(RadarTriageStatus),
});

export const ReanalyzeItemsSchema = z
  .object({
    ids: z.array(z.uuid()).min(1).max(RADAR_REANALYZE_MAX_IDS),
    mode: z.enum(RADAR_REANALYZE_MODES).default('AUTO'),
    budgetUsd: z.number().min(RADAR_MIN_RUN_BUDGET_USD).max(RADAR_MAX_RUN_BUDGET_USD).optional(),
  })
  .refine((v) => v.budgetUsd === undefined || v.mode === 'AUTO', {
    message: 'A budget applies only to an Auto re-analysis',
    path: ['budgetUsd'],
  });

export interface ReanalyzeItemsResponseDto {
  /** Items put back in the queue. */
  requeued: number;
  /** Unknown ids, items under a live lease, items whose run is still active, items of a paused source. */
  skipped: number;
  /** The REANALYZE run analyzing them; null for `WORKER`, or when nothing was requeued. */
  runId: string | null;
}

export const CreateTrialsSchema = z.object({
  itemIds: z.array(z.uuid()).min(1).max(RADAR_TRIAL_MAX_IDS),
  depth: z.enum(['light', 'deep']).default('deep'),
  /** A model id to try; the depth's default chain when left out. */
  model: z.string().trim().min(1).max(100).optional(),
});

export interface CreateTrialsResponseDto {
  /** Trials started, in the background; read them with `GET /radar/items/:id/trials`. */
  started: { id: string; itemId: string }[];
  /** Items with nothing to compare against: unknown, or not analyzed yet. */
  skipped: { itemId: string; reason: string }[];
}

export interface RadarTrialDto {
  id: string;
  depth: 'light' | 'deep';
  requestedModel: string | null;
  status: 'RUNNING' | 'DONE' | 'FAILED';
  /** The trial's enrichment (same fields as the item's), null until DONE. */
  enrichment: Record<string, unknown> | null;
  error: string | null;
  tokensIn: number;
  tokensOut: number;
  costMicroUsd: number | null;
  searchQueries: number;
  latencyMs: number | null;
  createdAt: string;
  finishedAt: string | null;
}

export interface TriageRadarItemsResponseDto {
  /** Items that exist and were set; unknown ids are ignored. */
  updated: number;
}

export interface RadarItemImageDto {
  type: 'photo' | 'video';
  /** Our stored copy when there is one, else the provider URL (which may have expired). */
  url: string;
  storageStatus: RadarMediaStorageStatus;
  width: number | null;
  height: number | null;
  ocrText: string | null;
}

export interface RadarItemDetailDto {
  id: string;
  source: RadarItemSourceDto;
  kind: RadarItemKind;
  permalink: string;
  authorName: string;
  publishedAt: Date;
  text: string;
  workStatus: RadarWorkStatus;
  queueState: RadarQueueState;
  triageStatus: RadarTriageStatus;
  workError: string | null;
  images: RadarItemImageDto[];
  links: RadarLink[];
  sharedPost: {
    authorName: string | null;
    permalink: string | null;
    publishedAt: string | null;
    text: string;
    images: RadarItemImageDto[];
  } | null;
  engagement: RadarEngagement;
  enrichment: RadarEnrichmentDetail | null;
  /** Stored comments: every author comment plus the best others, labelled. */
  comments: RadarItemCommentsSummaryDto & { items: RadarComment[] };
  video: RadarItemVideo | null;
  /** The run that touched this post last; null for a post stored before runs existed. */
  lastRunId: string | null;
}

export type RadarQueueStatsDto = RadarQueueStats;

export interface RequeueStuckResponseDto {
  requeued: number;
}

export const MAX_RUN_ITEM_CAP = RADAR_MAX_RUN_ITEM_CAP;
export const RUN_LIST_LIMIT = 50;

export const CreateRunSchema = z
  .object({
    sourceId: z.uuid(),
    flow: z.enum(RadarRunFlow).default(RadarRunFlow.HYBRID),
    windowFrom: z.coerce.date().optional(),
    windowTo: z.coerce.date().optional(),
    itemCap: z.int().min(1).max(MAX_RUN_ITEM_CAP),
    fetchComments: z.boolean().default(false),
    /** AUTO only: the run's AI spend cap in USD; the configured default when absent. */
    budgetUsd: z.number().min(RADAR_MIN_RUN_BUDGET_USD).max(RADAR_MAX_RUN_BUDGET_USD).optional(),
  })
  .refine((v) => !v.windowFrom || !v.windowTo || v.windowFrom < v.windowTo, {
    message: 'windowFrom must be before windowTo',
    path: ['windowTo'],
  })
  // Task 411 cost plan: a backfill (no window start) never buys comments; old posts get them on demand.
  .refine((v) => !v.fetchComments || (v.flow !== RadarRunFlow.MANUAL && v.windowFrom !== undefined), {
    message: 'Comments are fetched only on a Hybrid or Auto run with a window start',
    path: ['fetchComments'],
  })
  .refine((v) => v.budgetUsd === undefined || v.flow === RadarRunFlow.AUTO, {
    message: 'A budget applies only to an Auto run',
    path: ['budgetUsd'],
  });

export interface RadarStepRunDto {
  step: RadarStep;
  status: RadarStatus;
  adapter: string;
  error: string | null;
  startedAt: Date | null;
  finishedAt: Date | null;
}

export interface RadarRunDto {
  id: string;
  kind: RadarRunKind;
  /** Null on a REANALYZE run, whose items can come from several sources. */
  source: { id: string; displayName: string } | null;
  flow: RadarRunFlow;
  status: RadarStatus;
  windowFrom: Date | null;
  windowTo: Date | null;
  itemCap: number;
  captureAdapter: string;
  llmAdapter: string;
  itemsCaptured: number;
  itemsCreated: number;
  itemsUpdated: number;
  itemsFailed: number;
  fetchComments: boolean;
  /** AUTO only: the AI spend cap in micro-USD. */
  budgetMicroUsd: number | null;
  /** AUTO only: the recorded AI cost of the run so far, in micro-USD (an estimate on the free tier). */
  spentMicroUsd: number | null;
  error: string | null;
  warning: string | null;
  createdAt: Date;
  startedAt: Date | null;
  finishedAt: Date | null;
  steps: RadarStepRunDto[];
}

/** One feature's share of a run's AI calls. */
export interface RadarRunAiSpendDto {
  feature: string;
  calls: number;
  failed: number;
  tokensIn: number;
  tokensOut: number;
  costMicroUsd: number;
}

/** The run detail page: the list row plus what the run sent, what it could not read and what it spent. */
export interface RadarRunDetailDto extends RadarRunDto {
  /** The input sent to the capture provider; null for a Manual run, a re-analysis or a run older than this field. */
  captureInput: Record<string, unknown> | null;
  /** The provider's job reference (the Apify run id); null before the capture started or for an upload. */
  captureJobRef: string | null;
  /** Posts the normalizer could not read: the first ones kept with their reason, the rest counted. */
  failures: { items: RadarRunFailure[]; dropped: number };
  /** AUTO only: calls, tokens and cost per AI feature, most expensive first. */
  aiSpend: RadarRunAiSpendDto[] | null;
}

// --- Briefs ---

export const BRIEF_LIST_LIMIT = 50;
/** A 6-month brief of a few hundred posts fits well inside this, and it stays under the 100 KB body limit. */
export const MAX_BRIEF_CHARS = 60_000;
export const MAX_BRIEF_ITEMS_PAGE = 100;

export const CreateBriefSchema = z
  .object({
    sourceId: z
      .uuid()
      .nullish()
      .transform((v) => v ?? null),
    windowFrom: z.coerce.date(),
    windowTo: z.coerce.date(),
    /** AUTO: the server AI writes it within a minute or two; WORKER: it waits for `/radar work brief`. */
    writer: z.enum(RadarBriefWriter).default(RadarBriefWriter.AUTO),
  })
  .refine((v) => v.windowFrom < v.windowTo, { message: 'windowFrom must be before windowTo', path: ['windowTo'] });

export const SubmitBriefSchema = z.object({
  body: z.string().trim().min(1).max(MAX_BRIEF_CHARS),
  producer: z.object({ adapter: z.string().trim().min(1).max(64), model: z.string().trim().min(1).max(100) }),
});

export const ListBriefItemsSchema = z.object({
  offset: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(MAX_BRIEF_ITEMS_PAGE).default(50),
});

export interface RadarBriefDto {
  id: string;
  /** Null: the brief covers every source. */
  source: { id: string; displayName: string } | null;
  windowFrom: Date;
  windowTo: Date;
  workStatus: RadarWorkStatus;
  leaseExpiresAt: Date | null;
  itemCount: number;
  producer: { adapter: string; model: string } | null;
  writer: RadarBriefWriter;
  /** Set when an AUTO brief could not be written; the brief is DONE with an empty body. */
  error: string | null;
  createdAt: Date;
}

export interface RadarBriefDetailDto extends RadarBriefDto {
  body: string;
}

export interface ClaimBriefResponseDto {
  /**
   * Null when no brief is waiting. `sourceId` null means every source; `itemCount` is how many
   * analyzed posts the window holds now.
   */
  brief:
    | (Omit<RadarBriefDto, 'source' | 'producer' | 'createdAt' | 'writer' | 'error'> & { sourceId: string | null })
    | null;
}

export interface RadarBriefWorkItemDto {
  id: string;
  sourceName: string;
  permalink: string;
  /** The link the brief uses to cite this post. */
  detailPath: string;
  authorName: string;
  publishedAt: Date;
  text: string;
  tldr: string;
  providerTags: string[];
  contentType: string;
  signalScore: number;
  isPromo: boolean;
  isRelevant: boolean;
  overview: string | null;
  context: string | null;
  scoreReason: string | null;
  factCheck: string | null;
  applyNote: string | null;
  linkSummaries: { url: string; summary: string }[];
}

export interface RadarBriefItemsPageDto {
  items: RadarBriefWorkItemDto[];
  total: number;
  /** Null on the last page. */
  nextOffset: number | null;
}

export interface SubmitBriefResponseDto {
  id: string;
  itemCount: number;
}
