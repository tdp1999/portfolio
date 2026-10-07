import { YouTubeCaptureAdapter } from './youtube-capture.adapter';

const CHANNEL_ID = 'UCabcdefghijklmnopqrstuv';

const respond = (body: unknown, status = 200) => ({ ok: status < 400, status, json: async () => body }) as Response;

/** Answers by resource, in order per resource, so a test lists only the pages it cares about. */
const setup = (pages: Record<string, Array<{ body: unknown; status?: number }>>) => {
  const http = jest.fn(async (url: string | URL | Request) => {
    const resource = new URL(String(url)).pathname.split('/').pop() ?? '';
    const next = pages[resource]?.shift();
    return next ? respond(next.body, next.status) : respond({ items: [] });
  });
  const adapter = new YouTubeCaptureAdapter(
    {
      apifyToken: null,
      apifyPostsActor: 'a',
      apifyCommentsActor: 'b',
      commentsMaxChargeUsd: 0.5,
      youtubeApiKey: 'yt-key',
    },
    http as unknown as typeof fetch
  );
  return { http, adapter };
};

const uploads = { body: { items: [{ contentDetails: { relatedPlaylists: { uploads: 'UUplaylist' } } }] } };
const upload = (videoId: string, day: string) => ({
  contentDetails: { videoId, videoPublishedAt: `2026-10-${day}T12:00:00Z` },
});
const job = (over: { from?: string; to?: string; cap?: number } = {}) =>
  JSON.stringify({ channelId: CHANNEL_ID, from: over.from ?? null, to: over.to ?? null, cap: over.cap ?? 50 });

describe('YouTubeCaptureAdapter', () => {
  it('should list uploads inside the window, finishing the page that reaches past its start, then stop', async () => {
    const { http, adapter } = setup({
      channels: [uploads],
      playlistItems: [
        {
          body: {
            items: [upload('newer', '09'), upload('in-1', '07'), upload('older', '04'), upload('in-2', '06')],
            nextPageToken: 'p2',
          },
        },
        { body: { items: [upload('never-read', '06')] } },
      ],
    });

    const status = await adapter.poll(job({ from: '2026-10-05T00:00:00Z', to: '2026-10-08T00:00:00Z' }));

    expect(status).toEqual({ state: 'succeeded', datasetRef: 'in-1,in-2', itemCount: 2 });
    expect(http).toHaveBeenCalledTimes(2);
  });

  it('should stop listing as soon as the item cap is reached', async () => {
    const { adapter } = setup({
      channels: [uploads],
      playlistItems: [
        { body: { items: [upload('a', '07'), upload('b', '06'), upload('c', '05')], nextPageToken: 'p2' } },
      ],
    });

    expect(await adapter.poll(job({ cap: 2 }))).toEqual({ state: 'succeeded', datasetRef: 'a,b', itemCount: 2 });
  });

  it('should fail the run on a spent quota, a refused key or a refused request, and leave any other error to the next tick', async () => {
    const googleError = (code: number, reason: string, message = reason) => ({
      status: code,
      body: { error: { code, message, errors: [{ reason }] } },
    });
    const { adapter } = setup({
      channels: [
        googleError(403, 'quotaExceeded'),
        googleError(400, 'badRequest', 'API key not valid. Please pass a valid API key.'),
        googleError(400, 'invalidParameter'),
        googleError(500, 'backendError'),
      ],
    });

    expect(await adapter.poll(job())).toEqual({
      state: 'failed',
      message: 'The YouTube API daily quota is used up; it resets at midnight Pacific time',
    });
    expect(await adapter.poll(job())).toMatchObject({
      state: 'failed',
      message: expect.stringContaining('refused the API key'),
    });
    expect(await adapter.poll(job())).toMatchObject({
      state: 'failed',
      message: expect.stringContaining('refused the request'),
    });
    await expect(adapter.poll(job())).rejects.toThrow('YouTube 500 backendError');
  });

  it('should capture nothing, not fail, for a channel that never uploaded', async () => {
    const { adapter } = setup({
      channels: [uploads],
      playlistItems: [{ status: 404, body: { error: { code: 404, errors: [{ reason: 'playlistNotFound' }] } } }],
    });

    expect(await adapter.poll(job())).toEqual({ state: 'succeeded', datasetRef: '', itemCount: 0 });
  });

  it('should resolve a handle or a channel URL to the canonical channel URL, and nothing else', async () => {
    const channel = { body: { items: [{ id: CHANNEL_ID, snippet: { title: 'Fireship' } }] } };
    const { http, adapter } = setup({ channels: [channel, channel, channel, channel] });
    const canonical = { url: `https://www.youtube.com/channel/${CHANNEL_ID}`, name: 'Fireship' };

    expect(await adapter.resolveSource('@fireship')).toEqual(canonical);
    expect(await adapter.resolveSource('https://www.youtube.com/@fireship/videos')).toEqual(canonical);
    expect(await adapter.resolveSource(`https://m.youtube.com/channel/${CHANNEL_ID}`)).toEqual(canonical);
    expect(await adapter.resolveSource('https://www.youtube.com/user/fireshipio')).toEqual(canonical);
    expect(await adapter.resolveSource('https://www.facebook.com/@fireship')).toBeNull();
    expect(await adapter.resolveSource('https://www.youtube.com/watch?v=abc')).toBeNull();

    const filters = http.mock.calls.map(([url]) => new URL(String(url)).searchParams);
    expect(filters.map((p) => p.get('forHandle') ?? p.get('id') ?? p.get('forUsername'))).toEqual([
      '@fireship',
      '@fireship',
      CHANNEL_ID,
      'fireshipio',
    ]);
  });
});
