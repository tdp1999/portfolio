export {
  RADAR_FEED_PAGE_SIZE as FEED_PAGE_SIZE,
  RADAR_FEED_PAGE_SIZES as FEED_PAGE_SIZES,
  RADAR_MAX_CLAIM_ATTEMPTS as MAX_CLAIM_ATTEMPTS,
  RADAR_MAX_PROFILE_CHARS as PROFILE_MAX_CHARS,
  RADAR_MAX_RUN_BUDGET_USD as MAX_RUN_BUDGET_USD,
  RADAR_MAX_RUN_ITEM_CAP as MAX_RUN_ITEM_CAP,
  RADAR_MIN_RUN_BUDGET_USD as MIN_RUN_BUDGET_USD,
} from '@portfolio/shared/types';

/** How often the Runs page refreshes while a run is active. */
export const RUN_POLL_MS = 10_000;

/** How often the Briefs page refreshes while a brief waits for the worker. */
export const BRIEF_POLL_MS = 10_000;

/** Window the New brief form starts with, ending today. */
export const DEFAULT_BRIEF_WINDOW_MONTHS = 1;

/** Item cap the New run form starts with: enough for a few weeks of one source. */
export const DEFAULT_RUN_ITEM_CAP = 200;

/** Window start when a source has no successful run yet. */
export const DEFAULT_RUN_WINDOW_MONTHS = 6;

/** How often the Detail page polls a comments fetch, and how many polls (10 minutes) before it stops waiting. */
export const COMMENTS_POLL_MS = 5_000;
export const COMMENTS_POLL_MAX = 120;

/** localStorage key of the Feed's last used view (Table or Split); `?view=` in the URL wins. */
export const FEED_VIEW_STORAGE_KEY = 'radar.feed.view';
