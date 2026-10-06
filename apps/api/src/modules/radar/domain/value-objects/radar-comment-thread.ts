import { RadarCommentLabelPolicy } from '../policies/radar-comment-label.policy';
import {
  RadarComment,
  RadarCommentDraft,
  RadarCommentLabel,
  RadarCommentsFetch,
  RadarCommentsReceived,
} from '../radar-comment.types';

/**
 * One post's comments: labelled and trimmed from the provider's drafts, or loaded as stored. It
 * remembers what the provider returned before trimming, which is what tells a cut-short post apart.
 */
export class RadarCommentThread {
  // --- Constants ---

  /** Non-author comments kept per post; author comments are always kept. */
  static readonly MAX_STORED_OTHERS = 50;
  /** Longest text stored per comment. */
  static readonly MAX_TEXT = 2000;
  /** Longest non-author text handed to the worker. */
  static readonly MAX_CLAIM_TEXT = 500;

  private static readonly LABEL_RANK: Record<RadarCommentLabel, number> = {
    author: 0,
    substantive: 1,
    low: 2,
    spam: 3,
  };

  private constructor(
    readonly comments: readonly RadarComment[],
    readonly received: RadarCommentsReceived
  ) {
    Object.freeze(this);
  }

  // --- Factory Methods ---

  static fromDrafts(drafts: readonly RadarCommentDraft[]): RadarCommentThread {
    return new RadarCommentThread(
      RadarCommentThread.keep(RadarCommentLabelPolicy.label(drafts)),
      RadarCommentThread.count(drafts)
    );
  }

  static stored(comments: readonly RadarComment[]): RadarCommentThread {
    return new RadarCommentThread(comments, RadarCommentThread.count(comments));
  }

  /** A post the provider returned nothing for. */
  static empty(): RadarCommentThread {
    return new RadarCommentThread([], { topLevel: 0, total: 0 });
  }

  // --- Getters ---

  get size(): number {
    return this.comments.length;
  }

  // --- Rules ---

  /** What the worker reads: author comments in full, substantive ones cut short, the rest left out. */
  forClaim(): RadarComment[] {
    return this.comments
      .filter((c) => c.label === 'author' || c.label === 'substantive')
      .map((c) => (c.isAuthor ? c : { ...c, text: c.text.slice(0, RadarCommentThread.MAX_CLAIM_TEXT) }));
  }

  /**
   * PARTIAL when the fetch stopped early and this post could have been cut short: fewer top-level
   * comments than asked for and fewer comments in all than Facebook counts. The post's count
   * includes replies, so a thread whose replies make up the difference is complete.
   */
  fetchStatus(fetch: RadarCommentsFetch, postCommentCount: number): 'FETCHED' | 'PARTIAL' {
    const cutShort = this.received.topLevel < fetch.resultsLimit && this.received.total < postCommentCount;
    return fetch.capHit && cutShort ? 'PARTIAL' : 'FETCHED';
  }

  // --- Private ---

  /**
   * Keeps every author comment and the best {@link MAX_STORED_OTHERS} others (label first, then
   * likes + replies), in their original thread order.
   */
  private static keep(comments: readonly RadarComment[]): RadarComment[] {
    const rank = (c: RadarComment) => RadarCommentThread.LABEL_RANK[c.label];
    const others = comments
      .filter((c) => !c.isAuthor)
      .sort((a, b) => rank(a) - rank(b) || b.likes + b.replies - (a.likes + a.replies))
      .slice(0, RadarCommentThread.MAX_STORED_OTHERS);
    const kept = new Set<RadarComment>(others);
    return comments.filter((c) => c.isAuthor || kept.has(c));
  }

  private static count(comments: readonly Pick<RadarComment, 'depth'>[]): RadarCommentsReceived {
    return { topLevel: comments.filter((c) => c.depth === 0).length, total: comments.length };
  }
}
