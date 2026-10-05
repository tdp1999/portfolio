import { RadarItemKind, RadarPlatform, RadarRunFlow, RadarStatus, RadarStep, RadarWorkStatus } from '@prisma/client';
import { z } from 'zod/v4';

import {
  RADAR_CONTENT_TYPES,
  RADAR_FEED_PAGE_SIZE,
  RADAR_FEED_SORT_KEYS,
  RADAR_FEED_STATUSES,
  RADAR_MAX_CLAIM_ATTEMPTS,
  RADAR_MAX_PROFILE_CHARS,
  RADAR_MAX_RUN_ITEM_CAP,
  RADAR_PROVIDER_TAGS,
} from '@portfolio/shared/types';

import { RadarEngagement, RadarLink, RadarMediaStorageStatus, RadarNormalizeFailure } from '../domain/radar.types';
import { RadarEnrichmentDetail, RadarEnrichmentSummary, RadarQueueStats } from './ports/radar-item.repository.port';

/** A 6-month backfill of one prolific profile is ~1,100 posts; leave room without inviting abuse. */
export const MAX_UPLOAD_POSTS = 5000;
export const MAX_UPLOAD_BYTES = 30 * 1024 * 1024;
/** Cap the per-post failure list in the response; the counts stay exact. */
export const MAX_REPORTED_FAILURES = 50;

export const CreateRadarSourceSchema = z.object({
  platform: z.enum(RadarPlatform).default(RadarPlatform.FACEBOOK),
  url: z
    .url()
    .max(500)
    .transform((v) => v.trim().replace(/\/+$/, '')),
  displayName: z.string().trim().min(1).max(200),
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

export interface UploadCaptureResponseDto {
  runId: string;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  failures: RadarNormalizeFailure[];
}

/** A lease long enough for one analyze pass over a batch, short enough that a crashed worker's items return soon. */
export const WORK_LEASE_MS = 30 * 60 * 1000;
export const MAX_CLAIM_ITEMS = 20;
/** One worst-case result is ~30 KB, so 10 keep a normal batch under the 100 KB JSON body limit; on a 413 the worker resubmits one by one. */
export const MAX_SUBMIT_RESULTS = 10;
export const MAX_CLAIM_ATTEMPTS = RADAR_MAX_CLAIM_ATTEMPTS;
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
  limit: z.coerce.number().int().positive().max(100).default(FEED_PAGE_SIZE),
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
  status: z.enum(RADAR_FEED_STATUSES).optional(),
  sortBy: z.enum(RADAR_FEED_SORT_KEYS).default('publishedAt'),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
});

interface RadarItemSourceDto {
  id: string;
  displayName: string;
  isActive: boolean;
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
  enrichment: RadarEnrichmentSummary | null;
}

export interface RadarFeedPageDto {
  data: RadarFeedItemDto[];
  total: number;
  page: number;
  limit: number;
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
  })
  .refine((v) => !v.windowFrom || !v.windowTo || v.windowFrom < v.windowTo, {
    message: 'windowFrom must be before windowTo',
    path: ['windowTo'],
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
  source: { id: string; displayName: string };
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
  error: string | null;
  createdAt: Date;
  startedAt: Date | null;
  finishedAt: Date | null;
  steps: RadarStepRunDto[];
}
