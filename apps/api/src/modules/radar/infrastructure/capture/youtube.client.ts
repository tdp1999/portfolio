import { isPlainObject } from '@portfolio/shared/utils';

const API_BASE = 'https://www.googleapis.com/youtube/v3';
const REQUEST_TIMEOUT_MS = 30_000;

/** A refusal from the YouTube Data API, with Google's own reason code (`quotaExceeded`, `keyInvalid`, …). */
export class YouTubeApiError extends Error {
  constructor(
    readonly status: number,
    readonly reason: string | null,
    message: string
  ) {
    super(message);
    this.name = 'YouTubeApiError';
  }

  /** The day's quota is gone: retrying before it resets only fails again. */
  get quotaExhausted(): boolean {
    return this.reason === 'quotaExceeded' || this.reason === 'dailyLimitExceeded';
  }

  /** The key is wrong, restricted or the API is off for its project: a retry cannot fix it. */
  get keyRejected(): boolean {
    // An invalid key comes back as a 400 `badRequest` whose message names the key.
    return this.status === 401 || this.status === 403 || (this.status === 400 && /API key/i.test(this.message));
  }

  /** Any other refusal of the request itself (a bad parameter): final too, but not the key's fault. */
  get requestRejected(): boolean {
    return this.status === 400;
  }
}

/**
 * The YouTube Data API v3 calls Radar makes: public data with an API key, no OAuth and no account
 * (RAD-003). The key travels in the `X-Goog-Api-Key` header, so it never lands in a URL or a log.
 */
export class YouTubeClient {
  constructor(
    private readonly apiKey: string | null,
    private readonly http: typeof fetch = (input, init) => fetch(input, init)
  ) {}

  get isConfigured(): boolean {
    return this.apiKey !== null;
  }

  /** `resource` is `channels`, `playlistItems` or `videos`; the answer's `items` and next page token. */
  async list(
    resource: string,
    params: Record<string, string>
  ): Promise<{ items: unknown[]; nextPageToken: string | null }> {
    if (!this.apiKey) throw new Error('YOUTUBE_API_KEY is not set');

    const res = await this.http(`${API_BASE}/${resource}?${new URLSearchParams(params)}`, {
      headers: { 'X-Goog-Api-Key': this.apiKey, Accept: 'application/json' },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    const body: unknown = await res.json().catch(() => null);
    if (!res.ok) throw YouTubeClient.error(res.status, body);
    if (!isPlainObject(body)) throw new Error(`YouTube ${resource} answer is not an object`);
    return {
      items: Array.isArray(body['items']) ? body['items'] : [],
      nextPageToken: typeof body['nextPageToken'] === 'string' ? body['nextPageToken'] : null,
    };
  }

  // --- Private ---

  /** Google's error body: `{ error: { code, message, errors: [{ reason }] } }`. */
  private static error(status: number, body: unknown): YouTubeApiError {
    const error = isPlainObject(body) && isPlainObject(body['error']) ? body['error'] : {};
    const first = Array.isArray(error['errors']) && isPlainObject(error['errors'][0]) ? error['errors'][0] : {};
    const reason = typeof first['reason'] === 'string' ? first['reason'] : null;
    const message = typeof error['message'] === 'string' ? error['message'] : '';
    return new YouTubeApiError(
      status,
      reason,
      `YouTube ${status}${reason ? ` ${reason}` : ''}${message ? `: ${message}` : ''}`
    );
  }
}
