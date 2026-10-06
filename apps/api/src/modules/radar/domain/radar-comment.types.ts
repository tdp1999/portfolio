// --- Comments ---

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

/** A comment as the provider returned it, before labelling. */
export interface RadarCommentDraft extends Omit<RadarComment, 'label'> {
  /** Provider profile id, used to spot copy-paste across people; never stored. */
  profileId: string | null;
}

// --- Tiers ---

/**
 * How much of a post's comments to buy.
 * - `light`: 5 top-level, no replies. Enough to catch the author's "link in comments" comment.
 * - `full`: 15 top-level with replies, for a real discussion.
 * - `full-flat`: `full` without replies, for a post so large the replies would eat the run's cap.
 */
export type RadarCommentTier = 'light' | 'full' | 'full-flat' | 'skip';

/** A tier that buys comments. */
export type RadarFetchTier = Exclude<RadarCommentTier, 'skip'>;

export interface RadarCommentTierInput {
  /** Top-level comments the actor may return per post. */
  resultsLimit: number;
  includeReplies: boolean;
}

/** What the tier rule needs from a post. */
export interface RadarCommentPost {
  text: string;
  commentCount: number;
  hasLinks: boolean;
  hasMedia: boolean;
}

// --- Fetch ---

/** What the provider returned for one post, before trimming. */
export interface RadarCommentsReceived {
  topLevel: number;
  /** Top-level comments plus replies, the same unit as the post's own comment count. */
  total: number;
}

/** How one fetch went, as the PARTIAL rule needs it. */
export interface RadarCommentsFetch {
  /** The provider stopped before finishing (charge cap, timeout, abort). */
  capHit: boolean;
  /** Top-level comments asked for per post. */
  resultsLimit: number;
}
