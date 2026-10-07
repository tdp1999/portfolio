import { z } from 'zod/v4';

import { RADAR_CONTENT_TYPES, RADAR_PROVIDER_TAGS } from '@portfolio/shared/types';

import type { AiPart } from '../../../ai';
import { RadarAnalysisPolicy } from '../../domain/policies/radar-analysis.policy';
import { RADAR_ENRICHMENT_SCHEMA_VERSION, RADAR_FACT_CHECK_SEVERITIES } from '../radar-enrichment.schema';
import type { RadarWorkImageDto, RadarWorkItemDto } from '../radar.dto';
import { RADAR_ANALYSIS_RULES } from './radar-analysis.rules';

/**
 * The shape the model is asked for: the enrichment without the fields the server fills
 * (`producer`, `schemaVersion`). Kept free of transforms so it converts to JSON Schema; the full
 * rules (lengths, severity with a fact check) are checked afterwards by `RadarEnrichmentSchema`.
 */
export const RadarAnalysisAnswerSchema = z.object({
  tldr: z.string(),
  providerTags: z.array(z.enum(RADAR_PROVIDER_TAGS)),
  contentType: z.enum(RADAR_CONTENT_TYPES),
  signalScore: z.int().min(0).max(10),
  isPromo: z.boolean(),
  isRelevant: z.boolean(),
  imageNotes: z.string().nullable(),
  linkSummaries: z.array(z.object({ url: z.string(), summary: z.string() })),
  commentDigest: z.string().nullable(),
  wantsComments: z.boolean(),
  factCheck: z.string().nullable(),
  factCheckSeverity: z.enum(RADAR_FACT_CHECK_SEVERITIES).nullable(),
  overview: z.string(),
  context: z.string(),
  scoreReason: z.string(),
  applyNote: z.string(),
  sources: z.array(z.object({ url: z.string(), title: z.string().nullable() })),
});

export type RadarAnalysisAnswer = z.infer<typeof RadarAnalysisAnswerSchema>;

export type RadarAnalysisOptions =
  /** `deepMinScore`: the score that earns the deep pass; null when the deep pass is off. */
  | { depth: 'light'; maxImages: number; deepMinScore: number | null }
  | { depth: 'deep'; maxImages: number; webSearch: boolean; maxSearchQueries: number };

/** Builds the request for one item and turns the answer into an enrichment to validate. */
export class RadarAnalysisPrompt {
  // --- Constants ---

  private static readonly MIME: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
  };

  // --- Rules ---

  /** The workflow profile comes first (the yardstick for `applyNote`), then the rules. */
  static system(profile: string | null): string {
    const body = profile?.trim();
    return `# The Owner's workflow profile\n\n${body || '(empty)'}\n\n${RADAR_ANALYSIS_RULES}`;
  }

  /**
   * The post as JSON, then its images by URL (the first `maxImages`: galleries carry the news first).
   * A light pass has no research tools, so the request says so and keeps the answer short. Facebook URLs are removed from every text and list
   * first (RAD-003): the provider's URL reader could otherwise open them. The post's own permalink
   * is left out for the same reason.
   */
  static parts(item: RadarWorkItemDto, options: RadarAnalysisOptions): AiPart[] {
    const images = [
      ...item.images.map((image) => ({ owner: 'own' as const, image })),
      ...(item.sharedPost?.images ?? []).map((image) => ({ owner: 'shared' as const, image })),
    ];
    const sent = images.filter(({ image }) => !RadarAnalysisPolicy.isBlockedUrl(image.url)).slice(0, options.maxImages);
    const strip = RadarAnalysisPolicy.stripBlockedUrls;

    const post = {
      kind: item.kind,
      author: item.authorName,
      publishedAt: item.publishedAt,
      text: strip(item.text),
      links: item.links.filter((l) => !RadarAnalysisPolicy.isBlockedUrl(l.url)),
      sharedPost: item.sharedPost && {
        author: item.sharedPost.authorName,
        text: strip(item.sharedPost.text),
      },
      engagement: item.engagement,
      video: item.video && {
        durationSec: item.video.durationSec,
        transcriptStatus: item.video.transcriptStatus,
        transcript: item.video.transcript && {
          ...item.video.transcript,
          spoken: item.video.transcript.spoken && strip(item.video.transcript.spoken),
          onScreenText: item.video.transcript.onScreenText && strip(item.video.transcript.onScreenText),
        },
        transcriptError: item.video.transcriptError,
      },
      images: images.map(({ owner, image }) => ({
        owner,
        type: image.type,
        ocrText: image.ocrText,
        sent: sent.some((s) => s.image === image),
      })),
      comments: {
        status: item.comments.status,
        items: item.comments.items.map((c) => ({
          id: c.id,
          parentId: c.parentId,
          isAuthor: c.isAuthor,
          // Only the post's author may be named (see Comments in the rules).
          author: c.isAuthor ? c.authorName : null,
          text: strip(c.text),
          likes: c.likes,
          links: c.links.filter((url) => !RadarAnalysisPolicy.isBlockedUrl(url)),
        })),
      },
    };

    const research = RadarAnalysisPrompt.research(options);
    return [
      { text: `${research}\nImages marked "sent" follow this message in order (own first, then shared).\n\n` },
      { text: JSON.stringify(post, null, 1) },
      ...sent.map(({ image }) => RadarAnalysisPrompt.imagePart(image)),
    ];
  }

  /** The same request, with the reason the last answer was refused, for the one retry. */
  static retryParts(parts: AiPart[], reason: string): AiPart[] {
    return [
      ...parts,
      { text: `Your previous answer was refused for this reason:\n${reason}\nAnswer again, fixing only that.` },
    ];
  }

  /** The answer plus the server's fields; the severity rule is applied before validation. */
  static toEnrichment(answer: RadarAnalysisAnswer, producer: { adapter: string; model: string }) {
    const sources = answer.sources.filter((s) => !RadarAnalysisPolicy.isBlockedUrl(s.url));
    return {
      ...answer,
      sources,
      factCheckSeverity: RadarAnalysisPolicy.severity(answer.factCheckSeverity, sources.length),
      producer,
      schemaVersion: RADAR_ENRICHMENT_SCHEMA_VERSION,
    };
  }

  // --- Private ---

  private static research(options: RadarAnalysisOptions): string {
    if (options.depth === 'light') {
      return [
        'This is a quick pass: no web search and no link reading. Judge from the post, its images and its comments.',
        'Keep it short: "overview" one paragraph, "context" at most three bullets, "applyNote" one line.',
        'Leave "linkSummaries" and "sources" empty. Write "factCheck" only for a contradiction visible in the post or its comments, never a "could not be checked" note.',
        options.deepMinScore === null
          ? 'Score with care: the score decides what the Owner reads first.'
          : `Score with care: only a score of ${options.deepMinScore} or more earns a full analysis with research later.`,
      ].join('\n');
    }
    return options.webSearch
      ? `Web search is available: at most ${options.maxSearchQueries} queries for this post, fewer when the post is clear.`
      : 'Web search is not available for this post: judge from the post, its images, its comments and its links.';
  }

  private static imagePart(image: RadarWorkImageDto): AiPart {
    const ext = /\.([a-z0-9]+)(?:$|[?#])/i.exec(new URL(image.url).pathname)?.[1]?.toLowerCase() ?? '';
    return { fileUri: image.url, mimeType: RadarAnalysisPrompt.MIME[ext] ?? 'image/jpeg' };
  }
}
