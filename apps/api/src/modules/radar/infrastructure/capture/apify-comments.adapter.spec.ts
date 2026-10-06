import { COMMENT_TIER_INPUT } from '../../domain/radar-comments';
import { ApifyCommentsAdapter } from './apify-comments.adapter';

const TOKEN = 'apify_api_secret';

const respond = (body: unknown, status = 200) => ({ ok: status < 400, status, json: async () => body }) as Response;

const setup = (responses: unknown[]) => {
  const queue = [...responses];
  const http = jest.fn(async (_url: string | URL | Request, _init?: RequestInit) => respond(queue.shift()));
  const adapter = new ApifyCommentsAdapter(
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

describe('ApifyCommentsAdapter', () => {
  it('should map Apify run states: running, finished (stopped when cut short), failed', async () => {
    const { adapter } = setup([
      { data: { status: 'RUNNING' } },
      { data: { status: 'SUCCEEDED', defaultDatasetId: 'ds-1' } },
      { data: { itemCount: 12 } },
      { data: { status: 'TIMED-OUT', defaultDatasetId: 'ds-2' } },
      { data: { itemCount: 3 } },
      { data: { status: 'FAILED', statusMessage: 'Actor crashed' } },
    ]);

    expect(await adapter.poll('r')).toEqual({ state: 'running' });
    expect(await adapter.poll('r')).toEqual({ state: 'finished', datasetRef: 'ds-1', itemCount: 12, stopped: false });
    expect(await adapter.poll('r')).toEqual({ state: 'finished', datasetRef: 'ds-2', itemCount: 3, stopped: true });
    expect(await adapter.poll('r')).toEqual({ state: 'failed', message: 'Apify run FAILED: Actor crashed' });
  });

  it('should put the charge cap on every start, the only hard limit on replies', async () => {
    const { http, adapter } = setup([{ data: { id: 'run-1' } }]);

    await adapter.start({ postUrls: ['https://fb.test/p/1'], tier: COMMENT_TIER_INPUT.full, maxChargeUsd: 0.25 });

    const [url, init] = http.mock.calls[0];
    expect(String(url)).toContain('/acts/apify~facebook-comments-scraper/runs?');
    expect(String(url)).toContain('maxTotalChargeUsd=0.25');
    expect(String(url)).not.toContain(TOKEN);
    expect(JSON.parse(String(init?.body))).toMatchObject({ resultsLimit: 15, includeNestedComments: true });
  });

  it('should abort a running job and leave one that already ended alone', async () => {
    const { http, adapter } = setup([{ data: { status: 'RUNNING' } }, {}, { data: { status: 'SUCCEEDED' } }]);

    await adapter.abort('job1');
    await adapter.abort('job2');

    const calls = http.mock.calls.map(([url, init]) => `${init?.method ?? 'GET'} ${String(url).split('/v2')[1]}`);
    expect(calls).toEqual(['GET /actor-runs/job1', 'POST /actor-runs/job1/abort', 'GET /actor-runs/job2']);
  });
});
