import { RadarPlatform } from '@prisma/client';
import { z } from 'zod/v4';

import { RadarNormalizeFailure } from '../domain/radar.types';

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
