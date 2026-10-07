import { z } from 'zod/v4';

import type { AiPart } from '../../../ai';
import type { RadarBriefScope, RadarBriefWorkItem } from '../ports/radar-brief.repository.port';
import { RADAR_BRIEF_RULES } from './radar-brief.rules';

/** The model answers with the whole markdown in one field; the links are checked afterwards. */
export const RadarBriefAnswerSchema = z.object({ body: z.string() });

export type RadarBriefAnswer = z.infer<typeof RadarBriefAnswerSchema>;

/**
 * The request of an AUTO brief: the rules as the system prompt, then the window and its posts as
 * compact JSON (the analysis, not the raw post), so a window of hundreds of posts stays one request.
 */
export class RadarBriefPrompt {
  // --- Constants ---

  /**
   * Posts sent at most. A larger window keeps its best-scored posts: a brief cannot cover a
   * thousand posts point by point anyway.
   */
  static readonly MAX_POSTS = 800;
  /** The key terms are a reference list; their start is enough to name what a post is about. */
  private static readonly MAX_KEY_TERMS = 600;

  // --- Rules ---

  /** The workflow profile comes first (it decides what "matters most" means), then the rules. */
  static system(profile: string | null): string {
    const body = profile?.trim();
    return `# The Owner's workflow profile\n\n${body || '(empty)'}\n\n${RADAR_BRIEF_RULES}`;
  }

  /** The best-scored posts up to {@link MAX_POSTS}, oldest first, as the timeline the brief follows. */
  static select(items: readonly RadarBriefWorkItem[]): RadarBriefWorkItem[] {
    if (items.length <= RadarBriefPrompt.MAX_POSTS) return [...items];
    return [...items]
      .sort((a, b) => b.signalScore - a.signalScore)
      .slice(0, RadarBriefPrompt.MAX_POSTS)
      .sort((a, b) => a.publishedAt.getTime() - b.publishedAt.getTime());
  }

  static parts(
    scope: RadarBriefScope,
    sourceName: string | null,
    posts: readonly RadarBriefWorkItem[],
    total: number
  ): AiPart[] {
    const window = {
      from: RadarBriefPrompt.day(scope.windowFrom),
      to: RadarBriefPrompt.day(scope.windowTo),
      sources: sourceName ?? 'all sources',
      postsInWindow: total,
      postsGiven: posts.length,
    };
    const list = posts.map((p) => ({
      id: p.id,
      date: RadarBriefPrompt.day(p.publishedAt),
      author: p.authorName,
      source: p.sourceName,
      tldr: p.tldr,
      providerTags: p.providerTags,
      contentType: p.contentType,
      signalScore: p.signalScore,
      isPromo: p.isPromo,
      isRelevant: p.isRelevant,
      keyTerms: p.context?.slice(0, RadarBriefPrompt.MAX_KEY_TERMS) ?? null,
    }));
    return [{ text: `# Window\n${JSON.stringify(window)}\n\n# Posts, oldest first\n${JSON.stringify(list)}` }];
  }

  /** The same request, with the reason the last body was refused, for the one retry. */
  static retryParts(parts: AiPart[], reason: string): AiPart[] {
    return [
      ...parts,
      { text: `Your previous brief was refused for this reason:\n${reason}\nWrite it again, fixing only that.` },
    ];
  }

  // --- Private ---

  private static day(date: Date): string {
    return date.toISOString().slice(0, 10);
  }
}
