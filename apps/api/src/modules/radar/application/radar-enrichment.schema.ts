import { z } from 'zod/v4';

import { RADAR_CONTENT_TYPES, RADAR_PROVIDER_TAGS } from '@portfolio/shared/types';

/**
 * v2 added `context` and `scoreReason` and made `applyNote` required. v3 added `overview` (the
 * general read, now the main analysis) and `factCheckSeverity`.
 */
export const RADAR_ENRICHMENT_SCHEMA_VERSION = 3;

export const RADAR_FACT_CHECK_SEVERITIES = ['minor', 'major'] as const;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => v || null);

const requiredText = (max: number) => z.string().trim().min(1).max(max);

/** What the external worker submits for one item. Text stays in the source language (RAD-002). */
export const RadarEnrichmentSchema = z
  .object({
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
    /** The comments likely hold the real content (links, corrections) but were not fetched: a hint for the Owner. */
    wantsComments: z.boolean().default(false),
    factCheck: optionalText(4000),
    /** Required with a fact check: `major` means the post misleads on its main claim and the console warns. */
    factCheckSeverity: z.enum(RADAR_FACT_CHECK_SEVERITIES).nullish(),
    /** The general read: what happened, why it matters, where it fits, its limits, what to watch next. */
    overview: requiredText(6000),
    /** Key terms: what each tool, model or company the post names is, as a short reference. */
    context: requiredText(4000),
    /** Why the item got its score, type and relevance, so the Owner can disagree with it. */
    scoreReason: requiredText(1000),
    /** Required even for promo and off-topic posts: then it says why there is nothing to do. */
    applyNote: requiredText(8000),
    producer: z.object({ adapter: z.string().trim().min(1).max(64), model: z.string().trim().min(1).max(100) }),
    schemaVersion: z.literal(RADAR_ENRICHMENT_SCHEMA_VERSION),
  })
  .refine((e) => !e.factCheck || !!e.factCheckSeverity, {
    message: 'factCheckSeverity is required when factCheck is set',
    path: ['factCheckSeverity'],
  })
  // A severity without a fact check means nothing: it is dropped, not stored.
  .transform((e) => ({ ...e, factCheckSeverity: e.factCheck ? (e.factCheckSeverity ?? null) : null }));

export type RadarEnrichmentInput = z.infer<typeof RadarEnrichmentSchema>;
