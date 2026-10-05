import { RadarItemKind, RadarPlatform, RadarStep } from '@prisma/client';
import { z } from 'zod/v4';

import { RadarEngagement, RadarLink, RadarNormalizeFailure } from '../domain/radar.types';

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
/** An item claimed this many times without a stored result is skipped from then on, so a post the worker keeps failing on cannot cost tokens forever. */
export const MAX_CLAIM_ATTEMPTS = 3;
export const MAX_PROFILE_CHARS = 20_000;

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
