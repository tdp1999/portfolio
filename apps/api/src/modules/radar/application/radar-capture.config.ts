export const RADAR_CAPTURE_CONFIG = Symbol('RADAR_CAPTURE_CONFIG');

/** The official posts actor chosen in task 400. */
export const DEFAULT_APIFY_POSTS_ACTOR = 'apify/facebook-posts-scraper';

export interface RadarCaptureConfig {
  /** Null when `APIFY_TOKEN` is unset: Hybrid runs are refused, Manual runs still work. */
  apifyToken: string | null;
  apifyPostsActor: string;
}

/**
 * Reads the Apify settings. Optional on purpose, like the worker token: a deploy never depends on
 * them, and the token stays inside the adapter (no endpoint returns this config).
 */
export function loadRadarCaptureConfig(env: NodeJS.ProcessEnv = process.env): RadarCaptureConfig {
  return {
    apifyToken: env['APIFY_TOKEN']?.trim() || null,
    apifyPostsActor: env['RADAR_APIFY_POSTS_ACTOR']?.trim() || DEFAULT_APIFY_POSTS_ACTOR,
  };
}
