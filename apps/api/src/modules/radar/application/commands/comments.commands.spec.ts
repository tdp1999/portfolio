import { RadarErrorCode } from '@portfolio/shared/errors';

import { MulterFile } from '../../../../shared/types';
import { normalizeApifyComments } from '../../infrastructure/capture/apify-comments.normalizer';
import { CommentsJobStatus, ICommentsProvider } from '../ports/comments-provider.port';
import { IRadarCommentsRepository, RadarCommentCandidate } from '../ports/radar-comments.repository.port';
import { IRadarSourceRepository } from '../ports/radar-source.repository.port';
import {
  CollectItemCommentsCommand,
  CollectItemCommentsHandler,
  FetchItemCommentsCommand,
  FetchItemCommentsHandler,
} from './comments.fetch.command';
import { UploadCommentsCommand, UploadCommentsHandler } from './comments.upload.command';

const SOURCE_ID = '01a10755-fd0d-700c-af4f-05a7a675700e';
const ITEM_ID = '01a10b5b-9d90-753e-a6a3-000000000101';
const OTHER_ID = '01a10b5b-9d90-753e-a6a3-000000000102';

const target = (id: string, permalink: string): RadarCommentCandidate => ({
  id,
  permalink,
  authorExternalId: 'author',
  text: 'post',
  engagement: { likes: 0, comments: 10, shares: 0, views: null },
  links: [],
  media: [],
  publishedAt: new Date('2026-10-01T00:00:00Z'),
});

const commentsRepo = (candidates: RadarCommentCandidate[]) =>
  ({
    findCandidate: jest.fn(async (id: string) => candidates.find((c) => c.id === id) ?? null),
    findBySource: jest.fn(async () => candidates),
    saveComments: jest.fn(async () => undefined),
    markFailed: jest.fn(async () => undefined),
  }) as unknown as jest.Mocked<IRadarCommentsRepository>;

describe('FetchItemCommentsHandler', () => {
  it('should mark the item FAILED and throw COMMENTS_FETCH_FAILED when the job cannot start', async () => {
    const repo = commentsRepo([target(ITEM_ID, 'https://www.facebook.com/p/posts/1')]);
    const provider = {
      isConfigured: () => true,
      start: jest.fn(async () => {
        throw new Error('Apify 402: not enough credit');
      }),
    } as unknown as ICommentsProvider;

    await expect(
      new FetchItemCommentsHandler(provider, repo).execute(new FetchItemCommentsCommand(ITEM_ID))
    ).rejects.toMatchObject({ errorCode: RadarErrorCode.COMMENTS_FETCH_FAILED });
    expect(repo.markFailed).toHaveBeenCalledWith([ITEM_ID], 'Apify 402: not enough credit');
  });
});

describe('CollectItemCommentsHandler', () => {
  const POST = 'https://www.facebook.com/p/posts/1';
  const collect = (poll: () => Promise<CommentsJobStatus>, jobRef = 'job1') => {
    const repo = commentsRepo([target(ITEM_ID, POST)]);
    const provider = {
      poll: jest.fn(poll),
      fetchPage: jest.fn(async () => [{ id: 'c1', inputUrl: POST, text: 'Chạy ổn', threadingDepth: 0 }]),
      normalize: normalizeApifyComments,
    } as unknown as ICommentsProvider;
    const run = () =>
      new CollectItemCommentsHandler(provider, repo).execute(new CollectItemCommentsCommand(ITEM_ID, jobRef));
    return { repo, provider, run };
  };

  it('should answer running and store nothing while the job runs', async () => {
    const { repo, run } = collect(async () => ({ state: 'running' }));

    await expect(run()).resolves.toEqual({ state: 'running', jobRef: 'job1' });
    expect(repo.saveComments).not.toHaveBeenCalled();
  });

  it('should replace the comments once the job finished', async () => {
    const { repo, run } = collect(async () => ({ state: 'finished', datasetRef: 'ds', itemCount: 1, stopped: false }));

    await expect(run()).resolves.toEqual({ state: 'done', jobRef: 'job1', status: 'FETCHED', fetchedCount: 1 });
    expect(repo.saveComments).toHaveBeenCalledWith(expect.objectContaining({ itemId: ITEM_ID, status: 'FETCHED' }));
  });

  it('should mark the item FAILED when the job failed, and reject a job ref that is not an id', async () => {
    const failed = collect(async () => ({ state: 'failed', message: 'Apify run FAILED' }));
    await expect(failed.run()).rejects.toMatchObject({ errorCode: RadarErrorCode.COMMENTS_FETCH_FAILED });
    expect(failed.repo.markFailed).toHaveBeenCalledWith([ITEM_ID], 'Apify run FAILED');

    const forged = collect(async () => ({ state: 'running' }), '../acts');
    await expect(forged.run()).rejects.toMatchObject({ errorCode: RadarErrorCode.INVALID_INPUT });
    expect(forged.provider.poll).not.toHaveBeenCalled();
  });
});

describe('UploadCommentsHandler', () => {
  it('should replace comments only on posts the file contains and count the rest as unmatched', async () => {
    const matched = 'https://www.facebook.com/p/posts/1';
    const repo = commentsRepo([target(ITEM_ID, matched), target(OTHER_ID, 'https://www.facebook.com/p/posts/2')]);
    const sources = { findById: jest.fn(async () => ({ id: SOURCE_ID })) } as unknown as IRadarSourceRepository;
    const provider = { normalize: normalizeApifyComments } as unknown as ICommentsProvider;
    const handler = new UploadCommentsHandler(sources, repo, provider);
    const content = [
      { id: 'c1', inputUrl: `${matched}?x=1`, text: 'Bản này chạy ổn trên máy mình', threadingDepth: 0 },
      { id: 'c2', inputUrl: 'https://www.facebook.com/p/posts/9', text: 'Không thuộc source này' },
    ];
    const file: MulterFile = {
      buffer: Buffer.from(JSON.stringify(content)),
      originalname: 'c.json',
      mimetype: 'application/json',
    };

    const result = await handler.execute(new UploadCommentsCommand(SOURCE_ID, file));

    expect(repo.saveComments).toHaveBeenCalledTimes(1);
    expect(repo.saveComments).toHaveBeenCalledWith(expect.objectContaining({ itemId: ITEM_ID, status: 'FETCHED' }));
    expect(result).toEqual({ posts: 1, comments: 1, unmatched: 1, failed: 0, failures: [] });
  });
});
