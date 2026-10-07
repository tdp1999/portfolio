import { ApiError } from '@google/genai';

import { GeminiProvider } from './gemini.provider';

describe('GeminiProvider.toCallError', () => {
  it('should type a 429 as rate-limited with the delay Gemini asked for', () => {
    const err = new ApiError({ status: 429, message: '{"error":{"details":[{"retryDelay": "23.5s"}]}}' });
    expect(GeminiProvider.toCallError(err)).toMatchObject({ kind: 'rate-limited', retryAfterMs: 23500 });
  });

  it('should type a 429 without a delay as rate-limited with no wait', () => {
    expect(GeminiProvider.toCallError(new ApiError({ status: 429, message: 'quota' }))).toMatchObject({
      kind: 'rate-limited',
      retryAfterMs: null,
    });
  });

  it.each([
    [new ApiError({ status: 403, message: 'forbidden' }), 'auth'],
    [new ApiError({ status: 400, message: 'API key not valid. Please pass a valid API key.' }), 'auth'],
    [new ApiError({ status: 503, message: 'high demand' }), 'unavailable'],
    [new ApiError({ status: 500, message: 'internal' }), 'provider'],
    [Object.assign(new Error('This operation was aborted'), { name: 'AbortError' }), 'unavailable'],
    [new TypeError('fetch failed'), 'network'],
  ])('should map %s to %s', (err, kind) => {
    expect(GeminiProvider.toCallError(err).kind).toBe(kind);
  });
});
