export const RADAR_CAPTURE_CONFIG = Symbol('RADAR_CAPTURE_CONFIG');

/** The official posts actor chosen in task 400. */
export const DEFAULT_APIFY_POSTS_ACTOR = 'apify/facebook-posts-scraper';
/** The official comments actor probed in task 411. */
export const DEFAULT_APIFY_COMMENTS_ACTOR = 'apify/facebook-comments-scraper';
/** Hard cap Apify enforces on one comments run: it stops the actor once billing reaches this. */
export const DEFAULT_COMMENTS_MAX_CHARGE_USD = 0.5;
/** Cap for the single-post "Fetch comments" action on the Detail page. */
export const DEFAULT_ITEM_COMMENTS_MAX_CHARGE_USD = 0.1;

export interface RadarCaptureConfig {
  /** Null when `APIFY_TOKEN` is unset: Hybrid runs are refused, Manual runs still work. */
  apifyToken: string | null;
  apifyPostsActor: string;
  apifyCommentsActor: string;
  /** Per comments run; `RADAR_COMMENTS_MAX_CHARGE_USD` overrides. */
  commentsMaxChargeUsd: number;
}

/**
 * Reads the Apify settings. Optional on purpose, like the worker token: a deploy never depends on
 * them, and the token stays inside the adapter (no endpoint returns this config).
 */
export function loadRadarCaptureConfig(env: NodeJS.ProcessEnv = process.env): RadarCaptureConfig {
  return {
    apifyToken: env['APIFY_TOKEN']?.trim() || null,
    apifyPostsActor: env['RADAR_APIFY_POSTS_ACTOR']?.trim() || DEFAULT_APIFY_POSTS_ACTOR,
    apifyCommentsActor: env['RADAR_APIFY_COMMENTS_ACTOR']?.trim() || DEFAULT_APIFY_COMMENTS_ACTOR,
    commentsMaxChargeUsd: positiveNumber(env['RADAR_COMMENTS_MAX_CHARGE_USD']) ?? DEFAULT_COMMENTS_MAX_CHARGE_USD,
  };
}

const positiveNumber = (value: string | undefined): number | null => {
  const n = Number(value);
  return value && Number.isFinite(n) && n > 0 ? n : null;
};
