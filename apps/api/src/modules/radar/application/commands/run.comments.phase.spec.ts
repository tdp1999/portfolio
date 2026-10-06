import { RadarCommentsStatus, RadarRunFlow, RadarStatus, RadarStep } from '@prisma/client';

import { RadarCommentTierPolicy } from '../../domain/policies/radar-comment-tier.policy';
import { RadarCommentsCostPolicy } from '../../domain/policies/radar-comments-cost.policy';
import { RadarComment } from '../../domain/radar-comment.types';
import { RadarCommentThread } from '../../domain/value-objects/radar-comment-thread';
import { CommentsJobStatus, ICommentsProvider } from '../ports/comments-provider.port';
import { radarItem } from '../../domain/__fixtures__/radar-item.fixture';
import { IRadarCommentsRepository } from '../ports/radar-comments.repository.port';
import { RadarRun } from '../../domain/entities/radar-run.entity';
import { RadarCommentsProgressProps } from '../../domain/radar-run.types';
import { RadarCommentsProgress } from '../../domain/value-objects/radar-comments-progress';
import { IRadarRunRepository } from '../ports/radar-run.repository.port';
import { RadarCaptureConfig } from '../radar-capture.config';
import { RunCommentsPhase } from './run.comments.phase';

const { DEADLINE_MS: COMMENTS_DEADLINE_MS, MAX_ERRORS: MAX_COMMENTS_ERRORS } = RadarCommentsProgress;
type CommentsPhaseMeta = RadarCommentsProgressProps;

const NOW = new Date('2026-10-06T10:00:00Z');

/** A run in ENRICH, carrying the phase state of earlier ticks (none on the first). */
const runAt = (comments?: CommentsPhaseMeta) =>
  RadarRun.load({
    id: 'run-1',
    sourceId: 'src',
    sourceUrl: 'https://www.facebook.com/page',
    sourceName: 'page',
    flow: RadarRunFlow.HYBRID,
    status: RadarStatus.RUNNING,
    windowFrom: null,
    windowTo: null,
    itemCap: 300,
    captureAdapter: 'apify',
    llmAdapter: 'external-worker',
    itemsCaptured: 0,
    itemsCreated: 0,
    itemsUpdated: 0,
    itemsFailed: 0,
    fetchComments: true,
    error: null,
    warning: null,
    createdAt: NOW,
    startedAt: NOW,
    finishedAt: null,
    steps: [
      {
        step: RadarStep.ENRICH,
        status: RadarStatus.RUNNING,
        adapter: 'storage',
        providerJobRef: null,
        meta: comments ? { comments } : {},
        error: null,
        startedAt: NOW,
        finishedAt: null,
      },
    ],
  });
const POST = 'https://www.facebook.com/page/posts/1';

const candidate = radarItem({
  id: 'item-1',
  permalink: POST,
  text: 'Mình tổng hợp lại cách dùng Claude Code với MCP cho dự án frontend, có so sánh vài setup.',
  engagement: { likes: 0, comments: 30, shares: 0, views: null },
  publishedAt: NOW,
});

/** A `full` job already started on a previous tick, waiting to be collected. */
const startedMeta = (over: Partial<CommentsPhaseMeta> = {}): CommentsPhaseMeta => ({
  startedAt: NOW.toISOString(),
  jobs: [{ tier: 'full', itemIds: [candidate.id], maxChargeUsd: 0.5, jobRef: 'job-1', done: false }],
  errors: 0,
  done: false,
  ...over,
});

function setup(poll: () => Promise<CommentsJobStatus>, kept: RadarComment[] = []) {
  const provider = {
    start: jest.fn().mockResolvedValue('job-1'),
    poll: jest.fn(poll),
    fetchPage: jest.fn().mockResolvedValue([]),
    abort: jest.fn().mockResolvedValue(undefined),
    normalize: jest.fn().mockReturnValue({
      threads: new Map([[POST, RadarCommentThread.stored(kept)]]),
      unmatched: 0,
      failures: [],
    }),
  } as unknown as jest.Mocked<ICommentsProvider>;
  const comments = {
    findCandidates: jest.fn().mockResolvedValue([candidate]),
    findById: jest.fn().mockResolvedValue(candidate),
    findByIds: jest.fn().mockResolvedValue([candidate]),
    saveComments: jest.fn().mockResolvedValue(undefined),
    saveCommentsFailure: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<IRadarCommentsRepository>;
  const runs = {
    save: jest.fn(async (run: RadarRun) => RadarRun.load(run.toProps())),
  } as unknown as jest.Mocked<IRadarRunRepository>;
  const config = { commentsMaxChargeUsd: 0.5 } as RadarCaptureConfig;
  const phase = new RunCommentsPhase(config, provider, comments, runs);
  let last: RadarRun | null = null;
  /** One tick from the given phase state; returns the new state, for the caller to save. */
  const advance = async (meta: CommentsPhaseMeta | undefined, now = NOW) => {
    last = await phase.advance(runAt(meta), now);
    return last!.commentsProgress!.toProps();
  };
  const warning = () => last?.warning ?? undefined;
  /** The items saved as FAILED, with their error. */
  const failed = () =>
    comments.saveCommentsFailure.mock.calls
      .flatMap(([items]) => items)
      .map((item) => ({ id: item.id, error: item.commentsError }));
  return { advance, provider, comments, runs, warning, failed };
}

describe('RunCommentsPhase.advance', () => {
  it('should plan one job per tier and start it on the first tick, keeping the job ref before anything else', async () => {
    const { advance, provider, runs } = setup(async () => ({ state: 'running' }));

    const meta = await advance(undefined);

    expect(provider.start).toHaveBeenCalledWith({
      postUrls: [POST],
      tier: RadarCommentTierPolicy.input('full'),
      maxChargeUsd: 0.5,
    });
    expect(runs.save).toHaveBeenCalledTimes(1);
    expect(meta).toMatchObject({ done: false, jobs: [{ tier: 'full', jobRef: 'job-1', done: false }] });
  });

  it('should mark the posts FAILED and warn, not fail, when the provider job fails', async () => {
    const { advance, failed, warning } = setup(async () => ({ state: 'failed', message: 'Actor crashed' }));

    const meta = await advance(startedMeta());

    expect(failed()).toEqual([{ id: candidate.id, error: 'Actor crashed' }]);
    expect(warning()).toContain('Actor crashed');
    expect(meta.done).toBe(true);
  });

  it('should store a cut-short post as PARTIAL and warn when the job stopped at its cap', async () => {
    const two = [{ depth: 0 }, { depth: 0 }] as RadarComment[];
    const { advance, comments, warning } = setup(
      async () => ({ state: 'finished', datasetRef: 'ds', itemCount: 2, stopped: true }),
      two
    );

    const meta = await advance(startedMeta());

    expect(comments.saveComments.mock.calls.map(([item]) => [item.id, item.commentsStatus])).toEqual([
      [candidate.id, RadarCommentsStatus.PARTIAL],
    ]);
    expect(warning()).toContain('1 posts are partial');
    expect(meta.done).toBe(true);
  });

  it('should give up after the deadline: open posts FAILED, job aborted, run warned, phase done', async () => {
    const { advance, provider, failed, warning } = setup(async () => ({ state: 'running' }));
    const started = new Date(NOW.getTime() - COMMENTS_DEADLINE_MS - 1).toISOString();

    const meta = await advance(startedMeta({ startedAt: started }));

    expect(failed()).toEqual([{ id: candidate.id, error: expect.stringContaining('45 minutes') }]);
    expect(provider.abort).toHaveBeenCalledWith('job-1');
    expect(warning()).toMatch(/^Comments skipped/);
    expect(meta).toMatchObject({ done: true, jobs: [{ done: true }] });
  });

  it('should retry a provider error on the next tick, and give up at the error limit', async () => {
    const { advance, failed } = setup(async () => {
      throw new Error('socket hang up');
    });

    const retry = await advance(startedMeta());
    expect(retry).toMatchObject({ errors: 1, done: false });
    expect(failed()).toEqual([]);

    const last = await advance(startedMeta({ errors: MAX_COMMENTS_ERRORS - 1 }));
    expect(last.done).toBe(true);
    expect(failed()).toEqual([{ id: candidate.id, error: 'socket hang up' }]);
  });
});
