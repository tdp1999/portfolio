/**
 * Comment rules for task 411: which posts are worth paying to read comments for (tier), how each
 * comment is labelled, and which comments are kept. All of it is free heuristics; nothing here
 * calls a provider or a model.
 */

/** `author` = the post's own author. `low` = no content ("hóng", emoji). `spam` = ads, copy-paste, ib. */
export type RadarCommentLabel = 'author' | 'substantive' | 'low' | 'spam';

export interface RadarCommentImage {
  url: string;
  ocrText: string | null;
}

/** One stored comment, in `radar_items.comments`. */
export interface RadarComment {
  /** Provider comment id; replies point at it through `parentId`. */
  id: string;
  parentId: string | null;
  /** 0 = top-level, 1 = reply, 2 = reply to a reply. */
  depth: number;
  isAuthor: boolean;
  /** Only kept for the post's author: commenters are private individuals and the digest needs no names. */
  authorName: string | null;
  text: string;
  publishedAt: string | null;
  likes: number;
  replies: number;
  label: RadarCommentLabel;
  links: string[];
  images: RadarCommentImage[];
}

/**
 * How much of a post's comments to buy.
 * - `light`: 5 top-level, no replies. Enough to catch the author's "link in comments" comment.
 * - `full`: 15 top-level with replies, for a real discussion.
 * - `full-flat`: `full` without replies, for a post so large the replies would eat the run's cap.
 */
export type RadarCommentTier = 'light' | 'full' | 'full-flat' | 'skip';

export interface RadarCommentTierInput {
  /** Top-level comments the actor may return per post. */
  resultsLimit: number;
  includeReplies: boolean;
}

export const COMMENT_TIER_INPUT: Record<Exclude<RadarCommentTier, 'skip'>, RadarCommentTierInput> = {
  light: { resultsLimit: 5, includeReplies: false },
  full: { resultsLimit: 15, includeReplies: true },
  'full-flat': { resultsLimit: 15, includeReplies: false },
};

/** Below this a post has nothing to read. */
export const MIN_COMMENTS_TO_FETCH = 3;
/** From this a post counts as a discussion, worth the full tier. */
export const FULL_TIER_MIN_COMMENTS = 20;
/** From this, replies alone could exhaust the run's charge cap. */
export const NO_REPLIES_MIN_COMMENTS = 100;
/** Non-author comments kept per item; author comments are always kept. */
export const MAX_STORED_OTHER_COMMENTS = 50;
/** Longest text stored per comment. */
export const MAX_COMMENT_TEXT = 2000;
/** Longest non-author text handed to the worker. */
export const MAX_CLAIM_COMMENT_TEXT = 500;

export interface RadarCommentPost {
  text: string;
  commentCount: number;
  hasLinks: boolean;
  hasMedia: boolean;
}

/** The post points to its comments: "link dưới còm 👇", "cmt", "comment". */
const POINTS_TO_COMMENTS = /(còm|\bcomment|\bcmt\b|👇|\blink\b)/iu;
/** Giveaway bait: "comment 'ok' để nhận", "cmt để lấy file". Hundreds of one-word comments. */
const GIVEAWAY_BAIT = /(còm|comment|cmt)\S*(\s+\S+){0,5}?\s+(để|de)\s+(nhận|nhan|lấy|lay|được|duoc)/iu;
/** A meme is short: a caption under an image, no link, no pointer to the comments. */
const MEME_MAX_TEXT = 80;

export function selectCommentTier(post: RadarCommentPost): RadarCommentTier {
  if (post.commentCount < MIN_COMMENTS_TO_FETCH) return 'skip';
  if (GIVEAWAY_BAIT.test(post.text)) return 'light';

  const pointsToComments = POINTS_TO_COMMENTS.test(post.text);
  const isMeme =
    post.hasMedia && !post.hasLinks && !pointsToComments && stripHashtags(post.text).length < MEME_MAX_TEXT;
  if (isMeme) return 'skip';

  if (post.commentCount >= FULL_TIER_MIN_COMMENTS) {
    return post.commentCount >= NO_REPLIES_MIN_COMMENTS ? 'full-flat' : 'full';
  }
  return pointsToComments ? 'light' : 'skip';
}

const stripHashtags = (text: string) => text.replace(/#\S+/g, '').trim();

/** Shortened links, chat invites and shops: what a spammer posts under a popular post. */
const SPAM_LINK = /(bit\.ly|tinyurl|t\.me\/|telegram\.|zalo\.me|shopee\.|lazada\.|tiktok\.com\/@|s\.shopee)/i;
const SPAM_PHRASE = /(^|\s)(ib|inbox|check ib|xem ib|kb zalo|add zalo|liên hệ zalo)(\s|$|[!.,])/iu;
const LOW_PHRASE =
  /^(hóng|hong|xin link|xin|cho xin|cho mình xin|\+1|chấm|ok|oke|done|đã cmt|đã còm|cmt|còm|up|hay|hay quá|thanks|thank you|cảm ơn|cam on)$/iu;
/** Under this many letters or digits, a comment says nothing. */
const LOW_MIN_CHARS = 5;

/** What {@link labelComments} needs from each comment. */
export interface RadarCommentDraft extends Omit<RadarComment, 'label'> {
  /** Provider profile id, used to spot copy-paste across people; never stored. */
  profileId: string | null;
}

/** Labels every comment of one post. Copy-paste is judged across the post, so it takes the whole list. */
export function labelComments(drafts: readonly RadarCommentDraft[]): RadarComment[] {
  const peoplePerText = new Map<string, Set<string>>();
  for (const draft of drafts) {
    if (draft.isAuthor) continue;
    const key = normalizeForDuplicates(draft.text);
    if (key.length < LOW_MIN_CHARS) continue;
    const people = peoplePerText.get(key) ?? new Set<string>();
    people.add(draft.profileId ?? draft.id);
    peoplePerText.set(key, people);
  }

  return drafts.map(({ profileId: _, ...comment }) => ({
    ...comment,
    label: labelOf(comment, (peoplePerText.get(normalizeForDuplicates(comment.text))?.size ?? 0) > 1),
  }));
}

function labelOf(comment: Omit<RadarComment, 'label'>, copiedByOthers: boolean): RadarCommentLabel {
  if (comment.isAuthor) return 'author';
  if (copiedByOthers || comment.links.some((l) => SPAM_LINK.test(l)) || SPAM_LINK.test(comment.text)) return 'spam';
  if (SPAM_PHRASE.test(comment.text)) return 'spam';

  const words = comment.text.replace(/[^\p{L}\p{N}\s+]/gu, '').trim();
  if (LOW_PHRASE.test(words)) return 'low';
  // An image with no words is a sticker or a reaction meme, unless the image holds text.
  if (words.replace(/\s/g, '').length < LOW_MIN_CHARS && !comment.images.some((i) => i.ocrText)) return 'low';
  return 'substantive';
}

const normalizeForDuplicates = (text: string) => text.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

const LABEL_RANK: Record<RadarCommentLabel, number> = { author: 0, substantive: 1, low: 2, spam: 3 };

/**
 * Keeps every author comment and the best {@link MAX_STORED_OTHER_COMMENTS} others (label first,
 * then likes + replies), in their original thread order.
 */
export function keepComments(comments: readonly RadarComment[]): RadarComment[] {
  const others = comments
    .filter((c) => !c.isAuthor)
    .sort((a, b) => LABEL_RANK[a.label] - LABEL_RANK[b.label] || b.likes + b.replies - (a.likes + a.replies))
    .slice(0, MAX_STORED_OTHER_COMMENTS);
  const kept = new Set<RadarComment>(others);
  return comments.filter((c) => c.isAuthor || kept.has(c));
}

/** What the worker reads: author comments in full, substantive ones cut short, the rest left out. */
export function commentsForClaim(comments: readonly RadarComment[]): RadarComment[] {
  return comments
    .filter((c) => c.label === 'author' || c.label === 'substantive')
    .map((c) => (c.isAuthor ? c : { ...c, text: c.text.slice(0, MAX_CLAIM_COMMENT_TEXT) }));
}
