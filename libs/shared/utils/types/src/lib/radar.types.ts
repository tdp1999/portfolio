/** Who a Radar item is about. Shared by the API enrichment schema and the console filters. */
export const RADAR_PROVIDER_TAGS = [
  'anthropic',
  'openai',
  'google',
  'meta',
  'xai',
  'deepseek',
  'opensource',
  'other',
] as const;
export type RadarProviderTag = (typeof RADAR_PROVIDER_TAGS)[number];

/** What kind of post a Radar item is. Shared by the API enrichment schema and the console filters. */
export const RADAR_CONTENT_TYPES = ['news', 'tool', 'workflow', 'opinion', 'tutorial', 'promo'] as const;
export type RadarContentType = (typeof RADAR_CONTENT_TYPES)[number];

/** Feed columns the console can sort by. */
export const RADAR_FEED_SORT_KEYS = ['publishedAt', 'signalScore', 'source'] as const;
export type RadarFeedSortKey = (typeof RADAR_FEED_SORT_KEYS)[number];

/**
 * Queue status filter of `GET /radar/items`, the same buckets `GET /radar/items/stats` counts:
 * `pending` still claimable (queued or under a live lease), `analyzed` is done (`workStatus` DONE),
 * `stuck` hit the claim cap with no result, `paused` not done and its source is inactive. An item
 * re-queued for a newer enrichment schema keeps its old enrichment but counts as `pending`.
 */
export const RADAR_FEED_STATUSES = ['pending', 'analyzed', 'stuck', 'paused'] as const;
export type RadarFeedStatus = (typeof RADAR_FEED_STATUSES)[number];

/** Default page size of `GET /radar/items`. */
export const RADAR_FEED_PAGE_SIZE = 50;

/** Page sizes the Feed offers; the largest is also the most `GET /radar/items` returns at once. */
export const RADAR_FEED_PAGE_SIZES = [20, 50, 100, 200] as const;

/** Longest workflow profile `PUT /radar/profile` accepts. */
export const RADAR_MAX_PROFILE_CHARS = 20_000;

/** An item claimed this many times without a stored result is skipped from then on, so a post the worker keeps failing on cannot cost tokens forever. */
export const RADAR_MAX_CLAIM_ATTEMPTS = 3;

/** Most posts one run may capture: a 6-month backfill is ~1,100 posts, and the cap also bounds what Apify bills per run. */
export const RADAR_MAX_RUN_ITEM_CAP = 1500;

/** Error a run and its current step get when the Owner cancels it; the console reads it to show "Cancelled" rather than "Failed". */
export const RADAR_RUN_CANCELLED_MESSAGE = 'Cancelled by the Owner';
