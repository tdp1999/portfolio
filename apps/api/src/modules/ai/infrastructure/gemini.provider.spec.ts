import { GeminiProvider } from './gemini.provider';

/** The Interactions client's errors are unexported classes carrying `status`; this mimics them. */
const apiError = (status: number, message: string) => Object.assign(new Error(message), { name: 'APIError', status });

describe('GeminiProvider.toCallError', () => {
  it('should type a 429 as rate-limited with the delay Gemini asked for', () => {
    const err = apiError(429, '{"error":{"details":[{"retryDelay": "23.5s"}]}}');
    expect(GeminiProvider.toCallError(err)).toMatchObject({ kind: 'rate-limited', retryAfterMs: 23500 });
  });

  it('should type a 429 without a delay as rate-limited with no wait', () => {
    expect(GeminiProvider.toCallError(apiError(429, 'quota'))).toMatchObject({
      kind: 'rate-limited',
      retryAfterMs: null,
    });
  });

  it.each([
    [apiError(403, 'forbidden'), 'auth'],
    [apiError(400, 'API key not valid. Please pass a valid API key.'), 'auth'],
    [apiError(503, 'high demand'), 'unavailable'],
    [apiError(500, 'internal'), 'provider'],
    [apiError(400, 'Model generated too many tool calls. Please retry the request.'), 'unavailable'],
    [apiError(404, 'Model not found'), 'provider'],
    [Object.assign(new Error('Request timed out'), { name: 'APIConnectionTimeoutError' }), 'unavailable'],
    [Object.assign(new Error('This operation was aborted'), { name: 'AbortError' }), 'unavailable'],
    [new TypeError('fetch failed'), 'network'],
  ])('should map %s to %s', (err, kind) => {
    expect(GeminiProvider.toCallError(err).kind).toBe(kind);
  });
});

describe('GeminiProvider.quotaLimits', () => {
  const now = new Date('2026-10-07T10:00:00Z');

  it('should read each quota a 429 body names as a limit with nothing left until the retry delay', () => {
    const body = JSON.stringify({
      error: {
        code: 429,
        details: [
          {
            '@type': 'type.googleapis.com/google.rpc.QuotaFailure',
            violations: [
              {
                quotaMetric: 'generativelanguage.googleapis.com/generate_content_free_tier_requests',
                quotaId: 'GenerateRequestsPerMinutePerProjectPerModel-FreeTier',
                quotaDimensions: { location: 'global', model: 'gemini-2.5-flash' },
                quotaValue: '10',
              },
            ],
          },
          { '@type': 'type.googleapis.com/google.rpc.RetryInfo', retryDelay: '23s' },
        ],
      },
    });

    const err = GeminiProvider.toCallError(apiError(429, `got status: 429. ${body}`));

    expect(err.limits).toEqual([
      expect.objectContaining({
        metric: 'GenerateRequestsPerMinutePerProjectPerModel-FreeTier',
        label: 'Requests per minute (free tier)',
        kind: 'requests',
        window: 'minute',
        model: 'gemini-2.5-flash',
        limit: 10,
        remaining: 0,
        source: 'error',
      }),
    ]);
    expect(GeminiProvider.quotaLimits(body, 23000, now)[0].resetAt).toEqual(new Date('2026-10-07T10:00:23Z'));
  });

  it('should fall back to the plain-text quota line when the body is not JSON', () => {
    const message =
      'You exceeded your current quota. * Quota exceeded for metric: ' +
      'generativelanguage.googleapis.com/generate_content_free_tier_input_token_count, limit: 250000, model: gemini-2.5-flash';

    expect(GeminiProvider.quotaLimits(message, null, now)).toEqual([
      expect.objectContaining({
        kind: 'input-tokens',
        window: null,
        limit: 250000,
        model: 'gemini-2.5-flash',
        resetAt: null,
      }),
    ]);
  });
});

describe('GeminiProvider.generate', () => {
  const create = jest.fn();
  const provider = () => {
    const p = new GeminiProvider('key');
    // The SDK client is private; only its `interactions.create` is used here.
    Object.assign(p, { client: { interactions: { create } } });
    return p;
  };
  const request = {
    model: 'gemini-3.8-flash',
    system: 'system',
    parts: [
      { text: 'post' },
      { fileUri: 'https://cdn.example.com/a.jpg', mimeType: 'image/jpeg' },
      { fileUri: 'https://cdn.example.com/b.mp4', mimeType: 'video/mp4' },
    ],
    jsonSchema: {},
    tools: ['webSearch' as const, 'readUrls' as const],
  };

  beforeEach(() => create.mockReset());

  it('should map usage, search queries, sources, read links and an early stop from the interaction', async () => {
    create.mockResolvedValue({
      status: 'incomplete',
      output_text: '{"tldr":',
      usage: {
        total_input_tokens: 1200,
        total_output_tokens: 300,
        total_thought_tokens: 500,
        total_cached_tokens: 100,
        total_tool_use_tokens: 40,
        grounding_tool_count: [{ type: 'google_search', count: 3 }],
      },
      steps: [
        { type: 'google_search_call', arguments: { queries: ['claude 5', 'anthropic news'] } },
        { type: 'url_context_result', result: [{ url: 'https://a.dev', status: 'success' }, { status: 'error' }] },
        {
          type: 'model_output',
          content: [
            {
              type: 'text',
              text: 'x',
              annotations: [
                { type: 'url_citation', url: 'https://a.dev', title: 'A' },
                { type: 'url_citation', url: 'https://b.dev' },
                { type: 'file_citation' },
              ],
            },
          ],
        },
      ],
    });

    const res = await provider().generate(request);

    expect(res).toEqual({
      text: '{"tldr":',
      complete: false,
      usage: { inputTokens: 1200, outputTokens: 300, thinkingTokens: 500, cachedTokens: 100, toolTokens: 40 },
      // The usage reports 3 queries while the steps list 2: the higher count is billed.
      searchQueries: 3,
      trace: {
        searchQueries: ['claude 5', 'anthropic news'],
        sources: [
          { url: 'https://a.dev', title: 'A' },
          { url: 'https://b.dev', title: null },
        ],
        urls: [
          { url: 'https://a.dev', status: 'success' },
          { url: '', status: 'error' },
        ],
        finishReason: 'incomplete',
      },
      limits: [],
    });
    const sent = create.mock.calls[0][0];
    expect(sent.input.map((c: { type: string }) => c.type)).toEqual(['text', 'image', 'video']);
    expect(sent.tools).toEqual([{ type: 'google_search' }, { type: 'url_context' }]);
  });

  it('should report a completed interaction with no usage and no steps as complete with zero counts', async () => {
    create.mockResolvedValue({ status: 'completed', output_text: '{}' });

    const res = await provider().generate(request);

    expect(res).toMatchObject({
      complete: true,
      searchQueries: 0,
      usage: { inputTokens: 0, outputTokens: 0, thinkingTokens: 0, cachedTokens: 0, toolTokens: 0 },
    });
  });

  it('should throw the mapped error when the request fails', async () => {
    create.mockRejectedValue(apiError(503, 'high demand'));

    await expect(provider().generate(request)).rejects.toMatchObject({ kind: 'unavailable' });
  });
});
