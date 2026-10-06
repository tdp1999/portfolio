import { ApifyCaptureAdapter } from './apify-capture.adapter';

const TOKEN = 'apify_api_secret';

const respond = (body: unknown, status = 200) => ({ ok: status < 400, status, json: async () => body }) as Response;

const setup = (responses: unknown[]) => {
  const queue = [...responses];
  const http = jest.fn(async (_url: string | URL | Request, _init?: RequestInit) => respond(queue.shift()));
  const adapter = new ApifyCaptureAdapter(
    {
      apifyToken: TOKEN,
      apifyPostsActor: 'apify/facebook-posts-scraper',
      apifyCommentsActor: 'apify/facebook-comments-scraper',
      commentsMaxChargeUsd: 0.5,
    },
    http as unknown as typeof fetch
  );
  return { http, adapter };
};

describe('ApifyCaptureAdapter', () => {
  it('should map Apify run states to running, succeeded with the dataset size, or failed with the provider message', async () => {
    const { adapter } = setup([
      { data: { status: 'RUNNING' } },
      { data: { status: 'SUCCEEDED', defaultDatasetId: 'ds-1' } },
      { data: { itemCount: 42 } },
      { data: { status: 'TIMED-OUT', statusMessage: 'Actor exceeded timeout' } },
      { data: { status: 'ABORTED' } },
    ]);

    expect(await adapter.poll('r')).toEqual({ state: 'running' });
    expect(await adapter.poll('r')).toEqual({ state: 'succeeded', datasetRef: 'ds-1', itemCount: 42 });
    expect(await adapter.poll('r')).toEqual({
      state: 'failed',
      message: 'Apify run TIMED-OUT: Actor exceeded timeout',
    });
    expect(await adapter.poll('r')).toEqual({ state: 'failed', message: 'Apify run ABORTED' });
  });

  it('should send the date filter only for a windowed run and keep the token out of the URL', async () => {
    const { http, adapter } = setup([{ data: { id: 'run-1' } }, { data: { id: 'run-2' } }]);
    const base = { sourceUrl: 'https://www.facebook.com/mrgoonie', itemCap: 50 };

    await adapter.start({ ...base, windowFrom: null, windowTo: null });
    await adapter.start({ ...base, windowFrom: new Date('2026-09-01T00:00:00Z'), windowTo: null });

    const [backfill, windowed] = http.mock.calls.map(([url, init]) => ({
      url: String(url),
      input: JSON.parse(String(init?.body)),
      auth: (init?.headers as Record<string, string>)['Authorization'],
    }));
    expect(backfill.input).not.toHaveProperty('onlyPostsNewerThan');
    expect(windowed.input).toMatchObject({ onlyPostsNewerThan: '2026-09-01', resultsLimit: 50 });
    expect(backfill.url).toContain('/acts/apify~facebook-posts-scraper/runs');
    expect(backfill.url).not.toContain(TOKEN);
    expect(backfill.auth).toBe(`Bearer ${TOKEN}`);
  });
});
