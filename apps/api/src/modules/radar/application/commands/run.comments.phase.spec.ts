import { RadarCommentsStatus } from '@prisma/client';

import { COMMENT_TIER_INPUT, RadarComment } from '../../domain/radar-comments';
import { CommentsJobStatus, ICommentsProvider } from '../ports/comments-provider.port';
import { IRadarCommentsRepository, RadarCommentCandidate } from '../ports/radar-comments.repository.port';
import { IRadarRunRepository, RadarRunSnapshot } from '../ports/radar-run.repository.port';
import { RadarCaptureConfig } from '../radar-capture.config';
import { CHARGE_CAP_SLACK_USD, worstCaseUsd } from '../radar-comments.apply';
import {
  COMMENTS_DEADLINE_MS,
  CommentsPhaseMeta,
  MAX_COMMENTS_ERRORS,
  RunCommentsPhase,
  splitCap,
} from './run.comments.phase';

const NOW = new Date('2026-10-06T10:00:00Z');
const RUN = { id: 'run-1', steps: [] } as unknown as RadarRunSnapshot;
const POST = 'https://www.facebook.com/page/posts/1';

const candidate: RadarCommentCandidate = {
  id: 'item-1',
  permalink: POST,
  authorExternalId: 'author',
  text: 'Mình tổng hợp lại cách dùng Claude Code với MCP cho dự án frontend, có so sánh vài setup.',
  engagement: { likes: 0, comments: 30, shares: 0, views: null },
  links: [],
  media: [],
  publishedAt: NOW,
};

/** A `full` job already started on a previous tick, waiting to be collected. */
const startedMeta = (over: Partial<CommentsPhaseMeta> = {}): CommentsPhaseMeta => ({
  startedAt: NOW.toISOString(),
  jobs: [{ tier: 'full', itemIds: [candidate.id], maxChargeUsd: 0.5, jobRef: 'job-1', done: false }],
  errors: 0,
  done: false,
  ...over,
});

function setup(poll: () => Promise<CommentsJobStatus>, kept: RadarComment[] = []) {
  const topLevel = kept.filter((c) => c.depth === 0).length;
  const provider = {
    start: jest.fn().mockResolvedValue('job-1'),
    poll: jest.fn(poll),
    fetchPage: jest.fn().mockResolvedValue([]),
    abort: jest.fn().mockResolvedValue(undefined),
    normalize: jest.fn().mockReturnValue({
      byPermalink: new Map([[POST, kept]]),
      received: new Map([[POST, { topLevel, total: kept.length }]]),
      unmatched: 0,
      failures: [],
    }),
  } as unknown as jest.Mocked<ICommentsProvider>;
  const comments = {
    findCandidates: jest.fn().mockResolvedValue([candidate]),
    findCandidate: jest.fn().mockResolvedValue(candidate),
    saveComments: jest.fn().mockResolvedValue(undefined),
    markFailed: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<IRadarCommentsRepository>;
  const runs = {
    updateRun: jest.fn().mockResolvedValue(undefined),
    updateStep: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<IRadarRunRepository>;
  const config = { commentsMaxChargeUsd: 0.5 } as RadarCaptureConfig;
  const phase = new RunCommentsPhase(config, provider, comments, runs);
  const warning = () => (runs.updateRun.mock.calls.at(-1)?.[1] as { warning?: string } | undefined)?.warning;
  return { phase, provider, comments, runs, warning };
}

describe('splitCap', () => {
  const worstCase = (tier: 'light' | 'full-flat', posts: number) =>
    worstCaseUsd(COMMENT_TIER_INPUT[tier], posts) + CHARGE_CAP_SLACK_USD;

  it('should give bounded tiers their worst case plus slack and the reply-heavy tier the rest', () => {
    const caps = splitCap(
      new Map([
        ['light', [1, 2, 3, 4]],
        ['full-flat', [1, 2]],
        ['full', [1]],
      ]),
      0.5
    );

    expect(caps.get('light')).toBeCloseTo(worstCase('light', 4), 3);
    expect(caps.get('full-flat')).toBeCloseTo(worstCase('full-flat', 2), 3);
    expect(caps.get('full')).toBeCloseTo(0.5 - worstCase('light', 4) - worstCase('full-flat', 2), 2);
  });

  it('should scale bounded tiers down to 80% of the cap when their worst case is larger', () => {
    const caps = splitCap(
      new Map([
        ['full-flat', Array.from({ length: 20 })],
        ['full', [1]],
      ]),
      0.5
    );

    expect(caps.get('full-flat')).toBeCloseTo(0.4, 2);
    // Rounded down to $0.001, so the split never adds up past the run's cap.
    expect(caps.get('full')).toBeCloseTo(0.1, 2);
    expect((caps.get('full-flat') ?? 0) + (caps.get('full') ?? 0)).toBeLessThanOrEqual(0.5);
  });
});

describe('RunCommentsPhase.advance', () => {
  it('should plan one job per tier and start it on the first tick, keeping the job ref before anything else', async () => {
    const { phase, provider, runs } = setup(async () => ({ state: 'running' }));

    const meta = await phase.advance(RUN, undefined, NOW);

    expect(provider.start).toHaveBeenCalledWith({
      postUrls: [POST],
      tier: COMMENT_TIER_INPUT.full,
      maxChargeUsd: 0.5,
    });
    expect(runs.updateStep).toHaveBeenCalledTimes(1);
    expect(meta).toMatchObject({ done: false, jobs: [{ tier: 'full', jobRef: 'job-1', done: false }] });
  });

  it('should mark the posts FAILED and warn, not fail, when the provider job fails', async () => {
    const { phase, comments, warning } = setup(async () => ({ state: 'failed', message: 'Actor crashed' }));

    const meta = await phase.advance(RUN, startedMeta(), NOW);

    expect(comments.markFailed).toHaveBeenCalledWith([candidate.id], 'Actor crashed');
    expect(warning()).toContain('Actor crashed');
    expect(meta.done).toBe(true);
  });

  it('should store a cut-short post as PARTIAL and warn when the job stopped at its cap', async () => {
    const two = [{ depth: 0 }, { depth: 0 }] as RadarComment[];
    const { phase, comments, warning } = setup(
      async () => ({ state: 'finished', datasetRef: 'ds', itemCount: 2, stopped: true }),
      two
    );

    const meta = await phase.advance(RUN, startedMeta(), NOW);

    expect(comments.saveComments).toHaveBeenCalledWith(
      expect.objectContaining({ itemId: candidate.id, status: RadarCommentsStatus.PARTIAL })
    );
    expect(warning()).toContain('1 posts are partial');
    expect(meta.done).toBe(true);
  });

  it('should keep a post FETCHED when its replies make up the count, even at the cap', async () => {
    // 10 top-level + 20 replies = the post's 30 comments: nothing is missing.
    const thread = [
      ...Array.from({ length: 10 }, () => ({ depth: 0 })),
      ...Array.from({ length: 20 }, () => ({ depth: 1 })),
    ] as RadarComment[];
    const { phase, comments, warning } = setup(
      async () => ({ state: 'finished', datasetRef: 'ds', itemCount: 30, stopped: true }),
      thread
    );

    await phase.advance(RUN, startedMeta(), NOW);

    expect(comments.saveComments).toHaveBeenCalledWith(
      expect.objectContaining({ status: RadarCommentsStatus.FETCHED })
    );
    expect(warning()).toBeUndefined();
  });

  it('should not read a full answer from a bounded tier as a cap hit', async () => {
    // A light job answering with its worst case (5 per post) used its whole budget, by design.
    const kept = Array.from({ length: 2 }, () => ({ depth: 0 })) as RadarComment[];
    const light = { tier: 'light' as const, itemIds: [candidate.id], jobRef: 'job-1', done: false };
    const cap = worstCaseUsd(COMMENT_TIER_INPUT.light, 1) + CHARGE_CAP_SLACK_USD;
    const { phase, comments } = setup(
      async () => ({ state: 'finished', datasetRef: 'ds', itemCount: 5, stopped: false }),
      kept
    );

    await phase.advance(RUN, startedMeta({ jobs: [{ ...light, maxChargeUsd: cap }] }), NOW);

    expect(comments.saveComments).toHaveBeenCalledWith(
      expect.objectContaining({ status: RadarCommentsStatus.FETCHED })
    );
  });

  it('should give up after the deadline: open posts FAILED, job aborted, run warned, phase done', async () => {
    const { phase, provider, comments, warning } = setup(async () => ({ state: 'running' }));
    const started = new Date(NOW.getTime() - COMMENTS_DEADLINE_MS - 1).toISOString();

    const meta = await phase.advance(RUN, startedMeta({ startedAt: started }), NOW);

    expect(comments.markFailed).toHaveBeenCalledWith([candidate.id], expect.stringContaining('45 minutes'));
    expect(provider.abort).toHaveBeenCalledWith('job-1');
    expect(warning()).toMatch(/^Comments skipped/);
    expect(meta).toMatchObject({ done: true, jobs: [{ done: true }] });
  });

  it('should retry a provider error on the next tick, and give up at the error limit', async () => {
    const { phase, comments } = setup(async () => {
      throw new Error('socket hang up');
    });

    const retry = await phase.advance(RUN, startedMeta(), NOW);
    expect(retry).toMatchObject({ errors: 1, done: false });
    expect(comments.markFailed).not.toHaveBeenCalled();

    const last = await phase.advance(RUN, startedMeta({ errors: MAX_COMMENTS_ERRORS - 1 }), NOW);
    expect(last.done).toBe(true);
    expect(comments.markFailed).toHaveBeenCalledWith([candidate.id], 'socket hang up');
  });
});
