import { isPlainObject } from '@portfolio/shared/utils';

const API_BASE = 'https://api.apify.com/v2';
const REQUEST_TIMEOUT_MS = 30_000;

/**
 * The Apify REST calls both actors share. Native `fetch` with a timeout on every call; the token
 * travels in the Authorization header only, so it never lands in a URL or an access log.
 */
export class ApifyClient {
  constructor(
    private readonly token: string | null,
    private readonly http: typeof fetch = (input, init) => fetch(input, init)
  ) {}

  get isConfigured(): boolean {
    return this.token !== null;
  }

  async call(path: string, init: RequestInit = {}, timeoutMs = REQUEST_TIMEOUT_MS): Promise<unknown> {
    if (!this.token) throw new Error('APIFY_TOKEN is not set');

    const res = await this.http(`${API_BASE}${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(timeoutMs),
    });
    const body: unknown = await res.json().catch(() => null);
    if (!res.ok) {
      const error = isPlainObject(body) && isPlainObject(body['error']) ? body['error']['message'] : null;
      throw new Error(`Apify ${res.status}${typeof error === 'string' ? `: ${error}` : ''}`);
    }
    return body;
  }
}

export function dataOf(body: unknown): Record<string, unknown> {
  if (isPlainObject(body) && isPlainObject(body['data'])) return body['data'];
  throw new Error('Unexpected Apify response');
}

/** `apify/facebook-posts-scraper` → `apify~facebook-posts-scraper`, the form the URL path takes. */
export const actorPath = (actor: string) => encodeURIComponent(actor.replace('/', '~'));
