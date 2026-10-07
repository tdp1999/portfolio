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

/**
 * Where one item stands in the worker's queue, as the Feed shows it per row: a `RadarFeedStatus`,
 * or `claimed` while a worker holds a live lease on it (a `pending` item, split out).
 */
export type RadarQueueState = RadarFeedStatus | 'claimed';

/**
 * The Owner's triage of a post, independent of the worker's status: `INBOX` not decided yet,
 * `SAVED` kept to try later ("To try"), `DONE` read and put away. Opening a post never changes it.
 */
export const RADAR_TRIAGE_STATUSES = ['INBOX', 'SAVED', 'DONE'] as const;
export type RadarTriageStatus = (typeof RADAR_TRIAGE_STATUSES)[number];

/** Most item ids one `PATCH /radar/items/triage` accepts. */
export const RADAR_TRIAGE_MAX_IDS = 100;

/** Most items one quality-trial request takes: a deep trial runs ~45 s, so ten finish in minutes. */
export const RADAR_TRIAL_MAX_IDS = 10;

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

/** Range of the AI budget the Owner may give one AUTO run, in USD: a cent at least, $100 at most. */
export const RADAR_MIN_RUN_BUDGET_USD = 0.01;
export const RADAR_MAX_RUN_BUDGET_USD = 100;

/** Error a run and its current step get when the Owner cancels it; the console reads it to show "Cancelled" rather than "Failed". */
export const RADAR_RUN_CANCELLED_MESSAGE = 'Cancelled by the Owner';
