import { z } from 'zod/v4';

import { RADAR_CONTENT_TYPES, RADAR_PROVIDER_TAGS } from '@portfolio/shared/types';

export const RADAR_ENRICHMENT_SCHEMA_VERSION = 1;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => v || null);

/** What the external worker submits for one item. Text stays in the source language (RAD-002). */
export const RadarEnrichmentSchema = z.object({
  tldr: z.string().trim().min(1).max(280),
  providerTags: z
    .array(z.enum(RADAR_PROVIDER_TAGS))
    .max(RADAR_PROVIDER_TAGS.length)
    .default([])
    .transform((tags) => [...new Set(tags)]),
  contentType: z.enum(RADAR_CONTENT_TYPES),
  signalScore: z.int().min(0).max(10),
  isPromo: z.boolean(),
  isRelevant: z.boolean(),
  imageNotes: optionalText(4000),
  linkSummaries: z
    .array(z.object({ url: z.url({ protocol: /^https?$/ }).max(1000), summary: z.string().trim().min(1).max(1000) }))
    .max(20)
    .default([]),
  commentDigest: optionalText(4000),
  factCheck: optionalText(4000),
  applyNote: optionalText(8000),
  producer: z.object({ adapter: z.string().trim().min(1).max(64), model: z.string().trim().min(1).max(100) }),
  schemaVersion: z.literal(RADAR_ENRICHMENT_SCHEMA_VERSION),
});

export type RadarEnrichmentInput = z.infer<typeof RadarEnrichmentSchema>;
