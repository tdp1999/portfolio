import { RadarErrorCode } from '@portfolio/shared/errors';

import { RequeueStuckHandler } from '../commands/requeue-stuck.command';
import { IRadarItemRepository, RadarFeedRow, RadarItemDetail } from '../ports/radar-item.repository.port';
import { RadarLeasePolicy } from '../../domain/policies/radar-lease.policy';

const { MAX_CLAIM_ATTEMPTS } = RadarLeasePolicy;
import { GetRadarItemHandler, GetRadarItemQuery } from './get-radar-item.query';
import { GetRadarQueueStatsHandler } from './get-radar-queue-stats.query';
import { ListRadarItemsHandler, ListRadarItemsQuery } from './list-radar-items.query';

const ITEM_ID = '01a10755-0000-7000-8000-00000000000a';

const row: RadarFeedRow = {
  id: ITEM_ID,
  source: { id: '01a10755-0000-7000-8000-00000000000b', displayName: 'mrgoonie', isActive: true },
  kind: 'POST',
  permalink: 'https://www.facebook.com/x/posts/1',
  authorName: 'Duy',
  publishedAt: new Date('2026-10-01T00:00:00Z'),
  text: 'x'.repeat(500),
  media: [],
  workStatus: 'PENDING',
  claimCount: 0,
  leaseExpiresAt: null,
  triageStatus: 'INBOX',
  engagement: { likes: 0, comments: 4, shares: 0, views: null },
  commentsStatus: 'NOT_FETCHED',
  commentsFetchedCount: 0,
  commentsFetchedAt: null,
  commentsError: null,
  enrichment: null,
};

describe('Radar item queries', () => {
  let repo: jest.Mocked<IRadarItemRepository>;

  beforeEach(() => {
    repo = {
      list: jest.fn().mockResolvedValue({ data: [row], total: 1 }),
      countByTriage: jest.fn().mockResolvedValue({ INBOX: 1, SAVED: 0, DONE: 0 }),
      setTriage: jest.fn(),
      findById: jest.fn(),
      stats: jest.fn().mockResolvedValue({ pending: 4, stuck: 1, paused: 2, analyzed: 7 }),
      requeueStuck: jest.fn().mockResolvedValue(1),
    };
  });

  describe('ListRadarItemsHandler', () => {
    const run = (params: unknown) => new ListRadarItemsHandler(repo).execute(new ListRadarItemsQuery(params));

    it('should default to page 1 of 50 with promo hidden', async () => {
      const result = await run({});

      expect(repo.list).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, limit: 50, includePromo: false, sortBy: 'publishedAt', sortDir: 'desc' }),
        expect.any(Date),
        MAX_CLAIM_ATTEMPTS
      );
      expect(result).toMatchObject({ total: 1, page: 1, limit: 50 });
    });

    it('should parse query-string values', async () => {
      await run({
        page: '2',
        minScore: '6',
        includePromo: 'true',
        providerTag: 'openai',
        search: '  claude ',
        status: 'stuck',
      });

      expect(repo.list).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
          minScore: 6,
          includePromo: true,
          providerTag: 'openai',
          search: 'claude',
          status: 'stuck',
        }),
        expect.any(Date),
        MAX_CLAIM_ATTEMPTS
      );
    });

    it('should treat includePromo=false as false and a blank search as none', async () => {
      await run({ includePromo: 'false', search: '   ' });

      expect(repo.list).toHaveBeenCalledWith(
        expect.objectContaining({ includePromo: false, search: undefined }),
        expect.any(Date),
        MAX_CLAIM_ATTEMPTS
      );
    });

    it('should send a 200-character preview instead of the full text', async () => {
      const result = await run({});

      expect(result.data[0].preview).toHaveLength(200);
      expect(result.data[0]).not.toHaveProperty('text');
    });

    it.each([
      { providerTag: 'nvidia' },
      { minScore: '11' },
      { limit: '500' },
      { sourceId: 'nope' },
      { sortBy: 'text' },
      { sortDir: 'up' },
      { status: 'claimed' },
    ])('should reject %p as invalid input', async (params) => {
      await expect(run(params)).rejects.toMatchObject({ errorCode: RadarErrorCode.INVALID_INPUT });
      expect(repo.list).not.toHaveBeenCalled();
    });
  });

  describe('GetRadarItemHandler', () => {
    const run = (id: string) => new GetRadarItemHandler(repo).execute(new GetRadarItemQuery(id));

    it('should return the item with served image URLs', async () => {
      const detail: RadarItemDetail = {
        ...row,
        comments: [],
        media: [
          {
            type: 'photo',
            url: 'https://cdn.fb/x.jpg',
            thumbnailUrl: null,
            width: 10,
            height: 10,
            ocrText: null,
            externalId: '1',
            storedUrl: 'https://res.cloudinary.com/x.jpg',
            storedExternalId: 'radar/x',
            storageStatus: 'stored',
            storageError: null,
          },
        ],
        links: [],
        sharedPost: null,
        engagement: { likes: 1, comments: 0, shares: 0, views: null },
        enrichment: null,
      };
      repo.findById.mockResolvedValue(detail);

      const result = await run(ITEM_ID);

      expect(result.text).toHaveLength(500);
      expect(result.images).toEqual([
        expect.objectContaining({ url: 'https://res.cloudinary.com/x.jpg', storageStatus: 'stored' }),
      ]);
    });

    it('should throw ITEM_NOT_FOUND for an unknown item', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(run(ITEM_ID)).rejects.toMatchObject({ errorCode: RadarErrorCode.ITEM_NOT_FOUND });
    });
  });

  describe('queue stats and requeue', () => {
    it('should count against the claim attempt cap', async () => {
      const result = await new GetRadarQueueStatsHandler(repo).execute();

      expect(result).toEqual({ pending: 4, stuck: 1, paused: 2, analyzed: 7 });
      expect(repo.stats).toHaveBeenCalledWith(expect.any(Date), MAX_CLAIM_ATTEMPTS);
    });

    it('should report how many stuck items went back to the queue', async () => {
      const result = await new RequeueStuckHandler(repo).execute();

      expect(result).toEqual({ requeued: 1 });
      expect(repo.requeueStuck).toHaveBeenCalledWith(expect.any(Date), MAX_CLAIM_ATTEMPTS);
    });
  });
});
