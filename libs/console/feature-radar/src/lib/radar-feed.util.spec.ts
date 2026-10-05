import { DEFAULT_FEED_STATE, locateInPage, parseFeedQuery, toFeedQuery, toFeedRequest } from './radar-feed.util';
import type { RadarFeedItem } from './radar.types';

const item = (id: string) => ({ id }) as RadarFeedItem;
const page = (ids: string[], total: number) => ({ data: ids.map(item), total });

describe('feed query', () => {
  it('round-trips a full state through the URL', () => {
    const state = {
      search: 'claude',
      providerTag: 'anthropic',
      contentType: 'tool',
      minScore: '7',
      includePromo: true,
      sortBy: 'signalScore' as const,
      sortDir: 'asc' as const,
      pageIndex: 2,
    };
    expect(parseFeedQuery(toFeedQuery(state))).toEqual(state);
  });

  it('leaves defaults out of the URL', () => {
    expect(toFeedQuery(DEFAULT_FEED_STATE)).toEqual({});
  });

  it('falls back to the default for malformed values', () => {
    expect(parseFeedQuery({ sort: 'text', dir: 'up', page: 'abc' })).toEqual(DEFAULT_FEED_STATE);
    expect(parseFeedQuery({ page: '0' }).pageIndex).toBe(0);
  });

  it('drops filter values the API would reject', () => {
    expect(parseFeedQuery({ provider: 'foo', type: 'bar', score: 'x' })).toEqual(DEFAULT_FEED_STATE);
    expect(parseFeedQuery({ score: '5' }).minScore).toBe('');
  });

  it('builds the API request with a 1-based page and a numeric score', () => {
    const req = toFeedRequest({ ...DEFAULT_FEED_STATE, minScore: '4', pageIndex: 1 }, 50);
    expect(req).toMatchObject({ page: 2, limit: 50, minScore: 4, sortBy: 'publishedAt', sortDir: 'desc' });
    expect(req.search).toBeUndefined();
  });
});

describe('locateInPage', () => {
  it('finds both neighbours inside the page', () => {
    expect(locateInPage(page(['a', 'b', 'c'], 3), 'b', 0, 3)).toEqual({
      position: 2,
      prev: item('a'),
      next: item('c'),
    });
  });

  it('has no neighbour past either end of the Feed', () => {
    expect(locateInPage(page(['a', 'b'], 2), 'a', 0, 2)).toMatchObject({ prev: null, next: item('b') });
    expect(locateInPage(page(['a', 'b'], 2), 'b', 0, 2)).toMatchObject({ prev: item('a'), next: null });
  });

  it('points at the adjacent page at a page boundary', () => {
    expect(locateInPage(page(['c', 'd'], 6), 'c', 1, 2)).toEqual({
      position: 3,
      prev: 'previous-page',
      next: item('d'),
    });
    expect(locateInPage(page(['c', 'd'], 6), 'd', 1, 2)).toEqual({ position: 4, prev: item('c'), next: 'next-page' });
  });

  it('returns null when the item is not on the page', () => {
    expect(locateInPage(page(['a', 'b'], 2), 'z', 0, 2)).toBeNull();
  });
});
