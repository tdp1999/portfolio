import { CommandBus } from '@nestjs/cqrs';
import { RadarRunFlow, RadarStatus, RadarStep } from '@prisma/client';

import { IStorageService } from '../../../media/application/ports/storage.service.port';
import { ApifyFacebookNormalizer } from '../../infrastructure/capture/apify-facebook.normalizer';
import { ExternalWorkerAdapter } from '../../infrastructure/llm/external-worker.adapter';
import { CaptureJobStatus, ICaptureProvider } from '../ports/capture-provider.port';
import { ILlmProvider, LlmStepOutcome } from '../ports/llm-provider.port';
import { IRadarCaptureRepository } from '../ports/radar-capture.repository.port';
import { RadarRun } from '../../domain/entities/radar-run.entity';
import { RadarRunProps, RadarStepRunProps } from '../../domain/radar-run.types';
import { RadarCommentsProgress } from '../../domain/value-objects/radar-comments-progress';
import { IRadarRunRepository, RadarRunItemCounts } from '../ports/radar-run.repository.port';
import { AdvanceRunCommand, AdvanceRunHandler, DATASET_PAGE_SIZE } from './run.advance.command';
import { RunCommentsPhase } from './run.comments.phase';
import { RunTranscriptsPhase } from './run.transcripts.phase';

const { CAPTURE_DEADLINE_MS, MAX_STEP_ERRORS } = RadarRun;

const RUN_ID = '01a10b5b-9d90-753e-a6a3-000000000001';
const NOW = new Date('2026-10-05T10:00:00Z');

const step = (s: RadarStep, status: RadarStatus, extra: Partial<RadarStepRunProps> = {}): RadarStepRunProps => ({
  step: s,
  status,
  adapter: 'x',
  providerJobRef: null,
  meta: {},
  error: null,
  startedAt: null,
  finishedAt: null,
  ...extra,
});

const makeRun = (flow: RadarRunFlow, steps: Partial<Record<RadarStep, Partial<RadarStepRunProps>>>): RadarRunProps => ({
  id: RUN_ID,
  sourceId: 'src',
  sourceUrl: 'https://www.facebook.com/mrgoonie',
  sourceName: 'mrgoonie',
  flow,
  status: RadarStatus.RUNNING,
  windowFrom: null,
  windowTo: null,
  itemCap: 300,
  captureAdapter: flow === RadarRunFlow.HYBRID ? 'apify' : 'upload',
  llmAdapter: 'external-worker',
  itemsCaptured: 0,
  itemsCreated: 0,
  itemsUpdated: 0,
  itemsFailed: 0,
  fetchComments: false,
  budgetMicroUsd: null,
  error: null,
  warning: null,
  createdAt: NOW,
  startedAt: NOW,
  finishedAt: null,
  steps: [RadarStep.CAPTURE, RadarStep.NORMALIZE, RadarStep.ENRICH, RadarStep.ANALYZE].map((s) =>
    step(s, RadarStatus.PENDING, steps[s])
  ),
});

/**
 * In-memory run store: the handler re-reads the run between steps, so saves must stick. Like the
 * Prisma repository, a save applies only while the run is active and each changed step still has
 * the status it was read with.
 */
class FakeRuns implements IRadarRunRepository {
  counts: RadarRunItemCounts = { total: 0, notAnalyzed: 0, withPendingImages: 0 };
  constructor(public run: RadarRunProps) {}

  stepOf(s: RadarStep) {
    return this.run.steps.find((x) => x.step === s)!;
  }
  add = jest.fn();
  list = jest.fn();
  findActiveIds = jest.fn();
  hasActiveRun = jest.fn();
  findById = jest.fn(async () => RadarRun.load(structuredClone(this.run)));
  save = jest.fn(async (next: RadarRun) => {
    if (!RadarRun.ACTIVE.includes(this.run.status)) return null;
    const loaded = next.loadedProps!;
    const stale = next
      .toProps()
      .steps.some(
        (s, i) =>
          JSON.stringify(s) !== JSON.stringify(loaded.steps[i]) && this.stepOf(s.step).status !== loaded.steps[i].status
      );
    if (stale) return null;
    this.run = { ...next.toProps(), itemsCaptured: this.run.itemsCaptured };
    return RadarRun.load(structuredClone(this.run));
  });
  countItems = jest.fn(async () => this.counts);
}

const post = (id: number) => ({
  postId: String(id),
  url: `https://www.facebook.com/x/posts/${id}`,
  time: NOW.toISOString(),
  text: 'hi',
});

const setup = (
  run: RadarRunProps,
  opts: {
    poll?: CaptureJobStatus;
    pages?: unknown[][];
    commentsDone?: boolean[];
    transcriptsDone?: boolean[];
    llm?: ILlmProvider;
  } = {}
) => {
  const runs = new FakeRuns(run);
  const pages = [...(opts.pages ?? [])];
  const provider = {
    name: 'apify',
    format: 'apify-facebook-posts',
    platform: 'FACEBOOK' as const,
    credentialName: 'APIFY_TOKEN',
    isConfigured: () => true,
    start: jest.fn(async () => 'job-1'),
    poll: jest.fn(async () => opts.poll ?? { state: 'running' as const }),
    fetchPage: jest.fn(async (_ref: string, _offset: number, _limit: number) => pages.shift() ?? []),
  } satisfies ICaptureProvider;
  const captures = {
    saveCapture: jest.fn(),
    saveCapturePage: jest.fn(async () => ({ created: 1, updated: 0, orphanedImageIds: [] })),
  } satisfies IRadarCaptureRepository;
  const commandBus = { execute: jest.fn(async () => undefined) } as unknown as CommandBus;
  const storage = { delete: jest.fn() } as unknown as IStorageService;
  const done = [...(opts.commentsDone ?? [])];
  const transcriptsDone = [...(opts.transcriptsDone ?? [])];
  const transcriptsPhase = { advance: jest.fn(async () => transcriptsDone.shift() ?? true) };
  const commentsPhase = {
    advance: jest.fn(async (current: RadarRun) =>
      current.withCommentsProgress(
        RadarCommentsProgress.load({ startedAt: NOW.toISOString(), jobs: [], errors: 0, done: done.shift() ?? true })
      )
    ),
  };
  const handler = new AdvanceRunHandler(
    commandBus,
    runs,
    captures,
    [provider],
    [new ApifyFacebookNormalizer()],
    [new ExternalWorkerAdapter(), ...(opts.llm ? [opts.llm] : [])],
    storage,
    commentsPhase as unknown as RunCommentsPhase,
    transcriptsPhase as unknown as RunTranscriptsPhase
  );
  const advance = (now = NOW) => handler.execute(new AdvanceRunCommand(RUN_ID, now));
  return { runs, provider, captures, commentsPhase, transcriptsPhase, advance };
};

const runningCapture = { status: RadarStatus.RUNNING, providerJobRef: 'job-1', startedAt: NOW };

describe('AdvanceRunHandler', () => {
  describe('capture', () => {
    it('should start the provider job for a pending Hybrid run and store the job reference', async () => {
      const { runs, provider, advance } = setup(makeRun(RadarRunFlow.HYBRID, {}));

      await advance();

      expect(provider.start).toHaveBeenCalledTimes(1);
      expect(runs.stepOf(RadarStep.CAPTURE)).toMatchObject({ status: RadarStatus.RUNNING, providerJobRef: 'job-1' });
    });

    it('should leave a Manual run waiting for its upload without calling any provider', async () => {
      const { runs, provider, advance } = setup(
        makeRun(RadarRunFlow.MANUAL, { [RadarStep.CAPTURE]: { status: RadarStatus.AWAITING_EXTERNAL } })
      );

      await advance();

      expect(provider.start).not.toHaveBeenCalled();
      expect(runs.save).not.toHaveBeenCalled();
    });

    it('should keep waiting while the provider job is still running', async () => {
      const { runs, advance } = setup(makeRun(RadarRunFlow.HYBRID, { [RadarStep.CAPTURE]: runningCapture }));

      await advance();

      expect(runs.save).not.toHaveBeenCalled();
    });

    it('should fail the step and the run with the provider message when the job fails', async () => {
      const { runs, advance } = setup(makeRun(RadarRunFlow.HYBRID, { [RadarStep.CAPTURE]: runningCapture }), {
        poll: { state: 'failed', message: 'Apify run TIMED-OUT: actor exceeded timeout' },
      });

      await advance();

      expect(runs.stepOf(RadarStep.CAPTURE)).toMatchObject({
        status: RadarStatus.FAILED,
        error: 'Apify run TIMED-OUT: actor exceeded timeout',
      });
      expect(runs.run.status).toBe(RadarStatus.FAILED);
    });

    it('should fail when the provider returns more items than the cap, before reading any page', async () => {
      const { runs, provider, advance } = setup(makeRun(RadarRunFlow.HYBRID, { [RadarStep.CAPTURE]: runningCapture }), {
        poll: { state: 'succeeded', datasetRef: 'ds', itemCount: 301 },
      });

      await advance();

      expect(runs.run.error).toBe("The provider returned 301 items, more than the run's cap of 300");
      expect(provider.fetchPage).not.toHaveBeenCalled();
    });

    it('should fail a capture that runs past the deadline without polling again', async () => {
      const { runs, provider, advance } = setup(makeRun(RadarRunFlow.HYBRID, { [RadarStep.CAPTURE]: runningCapture }));

      await advance(new Date(NOW.getTime() + CAPTURE_DEADLINE_MS + 1));

      expect(provider.poll).not.toHaveBeenCalled();
      expect(runs.run).toMatchObject({ status: RadarStatus.FAILED, error: 'Capture did not finish within 60 minutes' });
    });
  });

  describe('normalize', () => {
    it('should move from a finished job straight into reading the dataset page by page in the same tick', async () => {
      const { runs, captures, provider, advance } = setup(
        makeRun(RadarRunFlow.HYBRID, { [RadarStep.CAPTURE]: runningCapture }),
        { poll: { state: 'succeeded', datasetRef: 'ds', itemCount: 2 }, pages: [[post(1), post(2)]] }
      );
      runs.counts.withPendingImages = 1;

      await advance();

      expect(provider.fetchPage).toHaveBeenCalledWith('ds', 0, DATASET_PAGE_SIZE);
      expect(captures.saveCapturePage).toHaveBeenCalledWith(
        expect.objectContaining({ runId: RUN_ID, items: [expect.anything(), expect.anything()] })
      );
      expect(runs.stepOf(RadarStep.CAPTURE).status).toBe(RadarStatus.DONE);
      expect(runs.stepOf(RadarStep.NORMALIZE).status).toBe(RadarStatus.DONE);
      expect(runs.stepOf(RadarStep.ENRICH).status).toBe(RadarStatus.RUNNING);
    });

    it('should keep the reason on the run when the provider found no posts', async () => {
      const { runs, captures, advance } = setup(makeRun(RadarRunFlow.HYBRID, { [RadarStep.CAPTURE]: runningCapture }), {
        poll: { state: 'succeeded', datasetRef: 'ds', itemCount: 1 },
        pages: [[{ inputUrl: 'https://www.facebook.com/mrgoonie', error: 'no_items' }]],
      });

      await advance();

      expect(captures.saveCapturePage).toHaveBeenCalledWith(expect.objectContaining({ items: [], failedCount: 0 }));
      expect(runs.run.warning).toBe('Apify found no posts for this source and window');
    });

    it('should advance by the page size when a cleaned page comes back short, so no item is read twice', async () => {
      const { runs, provider, advance } = setup(
        makeRun(RadarRunFlow.HYBRID, {
          [RadarStep.CAPTURE]: { status: RadarStatus.DONE },
          [RadarStep.NORMALIZE]: { status: RadarStatus.RUNNING, meta: { datasetRef: 'ds', itemCount: 150, offset: 0 } },
        }),
        { pages: [[post(1), post(2)], [post(3)]] }
      );

      await advance();

      expect(provider.fetchPage.mock.calls.map(([, offset]) => offset)).toEqual([0, DATASET_PAGE_SIZE]);
      expect(runs.stepOf(RadarStep.NORMALIZE).status).toBe(RadarStatus.DONE);
    });

    it('should stop after a bounded number of pages and resume from the saved offset on the next tick', async () => {
      const full = () => Array.from({ length: DATASET_PAGE_SIZE }, (_, i) => post(i));
      const { runs, provider, advance } = setup(
        makeRun(RadarRunFlow.HYBRID, {
          [RadarStep.CAPTURE]: { status: RadarStatus.DONE },
          [RadarStep.NORMALIZE]: {
            status: RadarStatus.RUNNING,
            meta: { datasetRef: 'ds', itemCount: 1000, offset: 0 },
          },
        }),
        { pages: Array.from({ length: 10 }, full) }
      );

      await advance();
      expect(runs.stepOf(RadarStep.NORMALIZE)).toMatchObject({ status: RadarStatus.RUNNING, meta: { offset: 500 } });

      await advance();
      expect(provider.fetchPage).toHaveBeenLastCalledWith('ds', 900, DATASET_PAGE_SIZE);
      expect(runs.stepOf(RadarStep.NORMALIZE).status).toBe(RadarStatus.DONE);
    });
  });

  it('should keep a run cancelled mid-tick FAILED and stop reading the dataset', async () => {
    const full = () => Array.from({ length: DATASET_PAGE_SIZE }, (_, i) => post(i));
    const { runs, provider, captures, advance } = setup(
      makeRun(RadarRunFlow.HYBRID, {
        [RadarStep.CAPTURE]: { status: RadarStatus.DONE },
        [RadarStep.NORMALIZE]: { status: RadarStatus.RUNNING, meta: { datasetRef: 'ds', itemCount: 1000, offset: 0 } },
      }),
      { pages: Array.from({ length: 10 }, full) }
    );
    // The Owner cancels while the first page is being saved.
    captures.saveCapturePage.mockImplementationOnce(async () => {
      Object.assign(runs.run, { status: RadarStatus.FAILED, error: 'Cancelled by the Owner' });
      return { created: 1, updated: 0, orphanedImageIds: [] };
    });

    await advance();

    expect(provider.fetchPage).toHaveBeenCalledTimes(1);
    expect(runs.run).toMatchObject({ status: RadarStatus.FAILED, error: 'Cancelled by the Owner' });
    expect(runs.stepOf(RadarStep.NORMALIZE).status).toBe(RadarStatus.RUNNING);
  });

  describe('enrich and analyze', () => {
    it('should wait while run items have pending images, then park the analyze step for the external worker', async () => {
      const { runs, transcriptsPhase, advance } = setup(
        makeRun(RadarRunFlow.HYBRID, {
          [RadarStep.CAPTURE]: { status: RadarStatus.DONE },
          [RadarStep.NORMALIZE]: { status: RadarStatus.DONE },
          [RadarStep.ENRICH]: { status: RadarStatus.RUNNING },
        })
      );
      runs.counts = { total: 2, notAnalyzed: 2, withPendingImages: 1 };

      await advance();
      expect(runs.stepOf(RadarStep.ENRICH).status).toBe(RadarStatus.RUNNING);

      runs.counts.withPendingImages = 0;
      await advance();
      expect(runs.stepOf(RadarStep.ENRICH).status).toBe(RadarStatus.DONE);
      expect(runs.stepOf(RadarStep.ANALYZE).status).toBe(RadarStatus.AWAITING_EXTERNAL);
      expect(runs.run.status).toBe(RadarStatus.AWAITING_EXTERNAL);
      // Only an AUTO run makes transcripts.
      expect(transcriptsPhase.advance).not.toHaveBeenCalled();
    });

    it('should hold ENRICH of an AUTO run open until every video has its transcript settled', async () => {
      const run = makeRun(RadarRunFlow.AUTO, {
        [RadarStep.CAPTURE]: { status: RadarStatus.DONE },
        [RadarStep.NORMALIZE]: { status: RadarStatus.DONE },
        [RadarStep.ENRICH]: { status: RadarStatus.RUNNING },
      });
      const { runs, transcriptsPhase, advance } = setup(
        { ...run, llmAdapter: 'server-ai', budgetMicroUsd: 1_000_000 },
        {
          transcriptsDone: [false, true],
          llm: { name: 'server-ai', serverSide: true, process: jest.fn(async () => ({ state: 'working' }) as const) },
        }
      );
      runs.counts = { total: 2, notAnalyzed: 2, withPendingImages: 0 };

      await advance();
      expect(runs.stepOf(RadarStep.ENRICH).status).toBe(RadarStatus.RUNNING);

      await advance();
      expect(transcriptsPhase.advance).toHaveBeenCalledTimes(2);
      expect(runs.stepOf(RadarStep.ENRICH).status).toBe(RadarStatus.DONE);
    });

    it('should hold ENRICH open until the comments phase is done, keeping its state in the step meta', async () => {
      const run = makeRun(RadarRunFlow.HYBRID, {
        [RadarStep.CAPTURE]: { status: RadarStatus.DONE },
        [RadarStep.NORMALIZE]: { status: RadarStatus.DONE },
        [RadarStep.ENRICH]: { status: RadarStatus.RUNNING },
      });
      const { runs, commentsPhase, advance } = setup({ ...run, fetchComments: true }, { commentsDone: [false, true] });

      await advance();
      expect(runs.stepOf(RadarStep.ENRICH).status).toBe(RadarStatus.RUNNING);
      expect(runs.stepOf(RadarStep.ENRICH).meta.comments).toMatchObject({ done: false });

      await advance();
      expect(commentsPhase.advance).toHaveBeenCalledTimes(2);
      expect(runs.stepOf(RadarStep.ENRICH).status).toBe(RadarStatus.DONE);
    });

    it('should finish the analyze step and the run only once every run item is analyzed', async () => {
      const { runs, advance } = setup(
        makeRun(RadarRunFlow.HYBRID, {
          [RadarStep.CAPTURE]: { status: RadarStatus.DONE },
          [RadarStep.NORMALIZE]: { status: RadarStatus.DONE },
          [RadarStep.ENRICH]: { status: RadarStatus.DONE },
          [RadarStep.ANALYZE]: { status: RadarStatus.AWAITING_EXTERNAL },
        })
      );
      runs.run.status = RadarStatus.AWAITING_EXTERNAL;
      runs.counts = { total: 2, notAnalyzed: 1, withPendingImages: 0 };

      await advance();
      expect(runs.run.status).toBe(RadarStatus.AWAITING_EXTERNAL);

      runs.counts.notAnalyzed = 0;
      await advance();
      expect(runs.stepOf(RadarStep.ANALYZE).status).toBe(RadarStatus.DONE);
      expect(runs.run.status).toBe(RadarStatus.DONE);
    });
  });

  describe('server-side analysis (AUTO)', () => {
    const autoRun = () => ({
      ...makeRun(RadarRunFlow.AUTO, {
        [RadarStep.CAPTURE]: { status: RadarStatus.DONE },
        [RadarStep.NORMALIZE]: { status: RadarStatus.DONE },
        [RadarStep.ENRICH]: { status: RadarStatus.DONE },
      }),
      llmAdapter: 'server-ai',
      budgetMicroUsd: 1_000_000,
    });
    const serverAi = (...outcomes: LlmStepOutcome[]) => ({
      name: 'server-ai',
      serverSide: true,
      process: jest.fn(async () => outcomes.shift() ?? ({ state: 'idle' } as const)),
    });

    it('should start the step, wait while batches run, and finish only on an idle tick with no item left', async () => {
      const llm = serverAi({ state: 'working' }, { state: 'idle' }, { state: 'idle' });
      const { runs, advance } = setup(autoRun(), { llm });
      runs.counts = { total: 3, notAnalyzed: 0, withPendingImages: 0 };

      // A working tick never finishes the step, even with nothing counted: its batch may open deep work.
      await advance();
      expect(llm.process).toHaveBeenCalledWith({ step: RadarStep.ANALYZE, runId: RUN_ID, budgetMicroUsd: 1_000_000 });
      expect(runs.stepOf(RadarStep.ANALYZE).status).toBe(RadarStatus.RUNNING);

      runs.counts.notAnalyzed = 1;
      await advance();
      expect(runs.run.status).toBe(RadarStatus.RUNNING);

      runs.counts.notAnalyzed = 0;
      await advance();
      expect(llm.process).toHaveBeenCalledTimes(3);
      expect(runs.run.status).toBe(RadarStatus.DONE);
    });

    it('should end the run with the warning when the analysis stops on the budget', async () => {
      const llm = serverAi({ state: 'stopped', reason: 'budget reached' });
      const { runs, advance } = setup(autoRun(), { llm });
      runs.counts = { total: 3, notAnalyzed: 2, withPendingImages: 0 };

      await advance();

      expect(runs.run).toMatchObject({ status: RadarStatus.DONE, warning: 'budget reached' });
    });
  });

  it('should keep the offset already saved this tick when a later page throws', async () => {
    const full = () => Array.from({ length: DATASET_PAGE_SIZE }, (_, i) => post(i));
    const { runs, provider, advance } = setup(
      makeRun(RadarRunFlow.HYBRID, {
        [RadarStep.CAPTURE]: { status: RadarStatus.DONE },
        [RadarStep.NORMALIZE]: { status: RadarStatus.RUNNING, meta: { datasetRef: 'ds', itemCount: 1000, offset: 0 } },
      }),
      { pages: [full()] }
    );
    provider.fetchPage.mockImplementationOnce(async () => full()).mockRejectedValueOnce(new Error('Apify 502'));

    await advance();

    expect(runs.stepOf(RadarStep.NORMALIZE).meta).toMatchObject({ offset: DATASET_PAGE_SIZE, errors: 1 });
  });

  it('should retry a thrown error on later ticks and fail the run on the last allowed attempt', async () => {
    const { runs, provider, advance } = setup(makeRun(RadarRunFlow.HYBRID, { [RadarStep.CAPTURE]: runningCapture }));
    provider.poll.mockRejectedValue(new Error('fetch failed'));

    for (let i = 1; i < MAX_STEP_ERRORS; i++) await advance();
    expect(runs.run.status).toBe(RadarStatus.RUNNING);
    expect(runs.stepOf(RadarStep.CAPTURE).meta.errors).toBe(MAX_STEP_ERRORS - 1);

    await advance();
    expect(runs.run).toMatchObject({ status: RadarStatus.FAILED, error: 'fetch failed' });
  });
});
