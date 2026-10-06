import { RadarCommentPost, RadarCommentTier, RadarCommentTierInput, RadarFetchTier } from '../radar-comment.types';

/**
 * Which posts are worth paying to read comments for, and how much of them (task 411). Free
 * heuristics on the post itself; nothing here calls a provider or a model.
 */
export class RadarCommentTierPolicy {
  // --- Constants ---

  /** Below this a post has nothing to read. */
  static readonly MIN_COMMENTS = 3;
  /** From this a post counts as a discussion, worth the full tier. */
  static readonly FULL_MIN_COMMENTS = 20;
  /** From this, replies alone could exhaust the run's charge cap. */
  static readonly NO_REPLIES_MIN_COMMENTS = 100;

  private static readonly INPUT: Record<RadarFetchTier, RadarCommentTierInput> = {
    light: { resultsLimit: 5, includeReplies: false },
    full: { resultsLimit: 15, includeReplies: true },
    'full-flat': { resultsLimit: 15, includeReplies: false },
  };

  /** The post points to its comments: "link dưới còm 👇", "cmt", "comment". */
  private static readonly POINTS_TO_COMMENTS = /(còm|\bcomment|\bcmt\b|👇|\blink\b)/iu;
  /** Giveaway bait: "comment 'ok' để nhận", "cmt để lấy file". Hundreds of one-word comments. */
  private static readonly GIVEAWAY_BAIT =
    /(còm|comment|cmt)\S*(\s+\S+){0,5}?\s+(để|de)\s+(nhận|nhan|lấy|lay|được|duoc)/iu;
  /** A meme is short: a caption under an image, no link, no pointer to the comments. */
  private static readonly MEME_MAX_TEXT = 80;

  // --- Rules ---

  /** The tier a run buys for one of its posts. */
  static select(post: RadarCommentPost): RadarCommentTier {
    if (post.commentCount < RadarCommentTierPolicy.MIN_COMMENTS) return 'skip';
    if (RadarCommentTierPolicy.GIVEAWAY_BAIT.test(post.text)) return 'light';

    const pointsToComments = RadarCommentTierPolicy.POINTS_TO_COMMENTS.test(post.text);
    if (RadarCommentTierPolicy.isMeme(post, pointsToComments)) return 'skip';

    if (post.commentCount >= RadarCommentTierPolicy.FULL_MIN_COMMENTS)
      return RadarCommentTierPolicy.fullTier(post.commentCount);
    return pointsToComments ? 'light' : 'skip';
  }

  /** The Owner asked for this post on its Detail page, so only a very large thread drops replies. */
  static forRequestedPost(commentCount: number): RadarFetchTier {
    return RadarCommentTierPolicy.fullTier(commentCount);
  }

  static input(tier: RadarFetchTier): RadarCommentTierInput {
    return RadarCommentTierPolicy.INPUT[tier];
  }

  // --- Private ---

  private static fullTier(commentCount: number): 'full' | 'full-flat' {
    return commentCount >= RadarCommentTierPolicy.NO_REPLIES_MIN_COMMENTS ? 'full-flat' : 'full';
  }

  private static isMeme(post: RadarCommentPost, pointsToComments: boolean): boolean {
    const caption = post.text.replace(/#\S+/g, '').trim();
    return (
      post.hasMedia && !post.hasLinks && !pointsToComments && caption.length < RadarCommentTierPolicy.MEME_MAX_TEXT
    );
  }
}
