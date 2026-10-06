import { Inject, Logger } from '@nestjs/common';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RadarRunFlow, RadarStatus, RadarStep } from '@prisma/client';

import { STORAGE_SERVICE } from '../../../media/application/media.token';
import { IStorageService } from '../../../media/application/ports/storage.service.port';
import { ICaptureNormalizer } from '../ports/capture-normalizer.port';
import { ICaptureProvider } from '../ports/capture-provider.port';
import { ILlmProvider } from '../ports/llm-provider.port';
import { IRadarCaptureRepository } from '../ports/radar-capture.repository.port';
import { IRadarRunRepository, RadarRunSnapshot, RadarStepSnapshot } from '../ports/radar-run.repository.port';
import { deleteStoredImages } from '../radar-image.cleanup';
import {
  CAPTURE_NORMALIZERS,
  CAPTURE_PROVIDERS,
  LLM_PROVIDERS,
  RADAR_CAPTURE_REPOSITORY,
  RADAR_RUN_REPOSITORY,
} from '../radar.token';
import { MAX_CLAIM_ATTEMPTS } from '../radar.dto';
import { PersistItemImagesCommand } from './persist-item-images.command';
import { CommentsPhaseMeta, RunCommentsPhase } from './run.comments.phase';

/** Steps a run walks, in order. SYNTHESIZE belongs to the brief (412), not to a run. */
const PIPELINE: RadarStep[] = [RadarStep.CAPTURE, RadarStep.NORMALIZE, RadarStep.ENRICH, RadarStep.ANALYZE];
const ACTIVE = new Set<RadarStatus>([RadarStatus.PENDING, RadarStatus.RUNNING, RadarStatus.AWAITING_EXTERNAL]);

/** On top of Apify's own 50-minute run timeout, so a job stuck on the provider side still ends. */
export const CAPTURE_DEADLINE_MS = 60 * 60 * 1000;
/**
 * One page in memory at a time; a tick reads a few pages, so 1,000 posts take about 2 ticks. The
 * offset moves by the page size, not by what came back: a cleaned dataset page can hold fewer.
 */
export const DATASET_PAGE_SIZE = 100;
const PAGES_PER_TICK = 5;
const IMAGE_ITEMS_PER_TICK = 10;
/** Errors thrown inside one step (network, provider 5xx) are retried on later ticks up to this. */
export const MAX_STEP_ERRORS = 5;

type Outcome = 'advanced' | 'wait' | 'failed';

/**
 * Moves one run as far as it can go in one tick: each step either finishes (and the next one
 * starts in the same call), waits for the provider or the worker, or fails the run. Called only
 * by the tick job, which never overlaps itself, so a run is never advanced twice at once. A cancel
 * can still land mid-tick: every run and step write is conditional on the run being active, and
 * the loop stops as soon as the reloaded run is not.
 */
export class AdvanceRunCommand {
  constructor(
    readonly runId: string,
    readonly now: Date = new Date()
  ) {}
}

@CommandHandler(AdvanceRunCommand)
export class AdvanceRunHandler implements ICommandHandler<AdvanceRunCommand> {
  private readonly logger = new Logger(AdvanceRunHandler.name);

  constructor(
    private readonly commandBus: CommandBus,
    @Inject(RADAR_RUN_REPOSITORY) private readonly runs: IRadarRunRepository,
    @Inject(RADAR_CAPTURE_REPOSITORY) private readonly captures: IRadarCaptureRepository,
    @Inject(CAPTURE_PROVIDERS) private readonly captureProviders: ICaptureProvider[],
    @Inject(CAPTURE_NORMALIZERS) private readonly normalizers: ICaptureNormalizer[],
    @Inject(LLM_PROVIDERS) private readonly llmProviders: ILlmProvider[],
    @Inject(STORAGE_SERVICE) private readonly storage: IStorageService,
    private readonly commentsPhase: RunCommentsPhase
  ) {}

  async execute({ runId, now }: AdvanceRunCommand): Promise<void> {
    let run = await this.runs.findById(runId);
    if (!run || !ACTIVE.has(run.status)) return;

    if (run.status === RadarStatus.PENDING) {
      if (!(await this.runs.updateRun(run.id, { status: RadarStatus.RUNNING, startedAt: now }))) return;
    }

    for (let pass = 0; pass < PIPELINE.length && run && ACTIVE.has(run.status); pass++) {
      const step = run.steps.find((s) => PIPELINE.includes(s.step) && s.status !== RadarStatus.DONE);
      if (!step) {
        await this.runs.updateRun(run.id, { status: RadarStatus.DONE, finishedAt: now });
        return;
      }

      let outcome: Outcome;
      try {
        outcome = await this.handle(run, step, now);
      } catch (error) {
        await this.recordError(run, step, error, now);
        return;
      }
      if (outcome !== 'advanced') return;
      run = await this.runs.findById(run.id);
    }
  }

  private handle(run: RadarRunSnapshot, step: RadarStepSnapshot, now: Date): Promise<Outcome> {
    switch (step.step) {
      case RadarStep.CAPTURE:
        return this.capture(run, step, now);
      case RadarStep.NORMALIZE:
        return this.normalize(run, step, now);
      case RadarStep.ENRICH:
        return this.enrich(run, step, now);
      default:
        return this.analyze(run, step, now);
    }
  }

  /** Hybrid: start the provider job once, then poll it. Manual: the upload finishes this step. */
  private async capture(run: RadarRunSnapshot, step: RadarStepSnapshot, now: Date): Promise<Outcome> {
    if (run.flow === RadarRunFlow.MANUAL) return 'wait';
    const provider = this.captureProvider(run);

    if (step.status === RadarStatus.PENDING || !step.providerJobRef) {
      const jobRef = await provider.start({
        sourceUrl: run.sourceUrl,
        windowFrom: run.windowFrom,
        windowTo: run.windowTo,
        itemCap: run.itemCap,
      });
      // The job is billed from here on. If its reference cannot be kept (a cancel landed, or the
      // write failed), name it in the log so it can be found and aborted on Apify by hand.
      const kept = await this.runs
        .updateStep(run.id, RadarStep.CAPTURE, { status: RadarStatus.RUNNING, providerJobRef: jobRef, startedAt: now })
        .catch((error: unknown) => {
          this.logger.error(`Radar run ${run.id}: provider job ${jobRef} started but its reference was not saved`);
          throw error;
        });
      if (!kept) this.logger.warn(`Radar run ${run.id} ended while provider job ${jobRef} started; it runs on unread`);
      return 'wait';
    }

    const startedAt = step.startedAt ?? run.startedAt ?? now;
    if (now.getTime() - startedAt.getTime() > CAPTURE_DEADLINE_MS) {
      return this.fail(run, step, 'Capture did not finish within 60 minutes', now);
    }

    const status = await provider.poll(step.providerJobRef);
    if (status.state === 'running') return 'wait';
    if (status.state === 'failed') return this.fail(run, step, status.message, now);
    if (status.itemCount > run.itemCap) {
      return this.fail(
        run,
        step,
        `The provider returned ${status.itemCount} items, more than the run's cap of ${run.itemCap}`,
        now
      );
    }

    const meta = { datasetRef: status.datasetRef, itemCount: status.itemCount, offset: 0 };
    await this.runs.updateStep(run.id, RadarStep.CAPTURE, {
      status: RadarStatus.DONE,
      finishedAt: now,
      meta,
      error: null,
    });
    await this.runs.updateStep(run.id, RadarStep.NORMALIZE, { status: RadarStatus.RUNNING, startedAt: now, meta });
    return 'advanced';
  }

  /** Reads the finished dataset a page at a time and upserts each page before the next. */
  private async normalize(run: RadarRunSnapshot, step: RadarStepSnapshot, now: Date): Promise<Outcome> {
    const provider = this.captureProvider(run);
    const normalizer = this.normalizers.find((n) => n.format === provider.format);
    if (!normalizer) return this.fail(run, step, `No normalizer for format "${provider.format}"`, now);

    const datasetRef = String(step.meta['datasetRef']);
    const itemCount = Number(step.meta['itemCount'] ?? 0);
    let offset = Number(step.meta['offset'] ?? 0);
    let exhausted = offset >= itemCount;

    for (let page = 0; page < PAGES_PER_TICK && !exhausted; page++) {
      const raw = await provider.fetchPage(datasetRef, offset, DATASET_PAGE_SIZE);
      if (raw.length > 0) {
        const { items, failures } = normalizer.normalize(raw);
        const saved = await this.captures.saveCapturePage({
          runId: run.id,
          sourceId: run.sourceId,
          items,
          failedCount: failures.length,
        });
        await deleteStoredImages(this.storage, saved.orphanedImageIds, this.logger);
      }
      offset += DATASET_PAGE_SIZE;
      exhausted = offset >= itemCount;
      // False once the run was cancelled: stop reading pages nobody will finish.
      if (!(await this.runs.updateStep(run.id, RadarStep.NORMALIZE, { meta: { ...step.meta, offset } }))) return 'wait';
    }

    if (!exhausted) return 'wait';
    await this.runs.updateStep(run.id, RadarStep.NORMALIZE, { status: RadarStatus.DONE, finishedAt: now, error: null });
    await this.runs.updateStep(run.id, RadarStep.ENRICH, { status: RadarStatus.RUNNING, startedAt: now });
    return 'advanced';
  }

  /**
   * Copies images in small batches per tick and, when the run asks for it, fetches comments for
   * the selected posts. Done when no image is pending and the comments phase is settled; a
   * comments failure only warns (see {@link RunCommentsPhase}).
   */
  private async enrich(run: RadarRunSnapshot, step: RadarStepSnapshot, now: Date): Promise<Outcome> {
    if (step.status === RadarStatus.PENDING) {
      await this.runs.updateStep(run.id, RadarStep.ENRICH, { status: RadarStatus.RUNNING, startedAt: now });
    }
    await this.commandBus.execute(new PersistItemImagesCommand(IMAGE_ITEMS_PER_TICK));

    let commentsDone = true;
    if (run.fetchComments) {
      const comments = await this.commentsPhase.advance(
        run,
        step.meta['comments'] as CommentsPhaseMeta | undefined,
        now
      );
      commentsDone = comments.done;
      if (!(await this.runs.updateStep(run.id, RadarStep.ENRICH, { meta: { ...step.meta, comments } }))) return 'wait';
    }

    const { withPendingImages } = await this.runs.countItems(run.id, now, MAX_CLAIM_ATTEMPTS);
    if (withPendingImages > 0 || !commentsDone) return 'wait';
    await this.runs.updateStep(run.id, RadarStep.ENRICH, { status: RadarStatus.DONE, finishedAt: now, error: null });
    return 'advanced';
  }

  /**
   * Hands the step to the run's analysis adapter; done once no item of the run is left for the
   * worker. Stuck items and items of a paused source do not hold the run open.
   */
  private async analyze(run: RadarRunSnapshot, step: RadarStepSnapshot, now: Date): Promise<Outcome> {
    if (step.status === RadarStatus.PENDING) {
      const llm = this.llmProviders.find((p) => p.name === run.llmAdapter);
      if (!llm) return this.fail(run, step, `Unknown analysis adapter "${run.llmAdapter}"`, now);

      const outcome = await llm.process({ step: RadarStep.ANALYZE, runId: run.id });
      if (outcome.state === 'done') return this.finish(run, now);
      await this.runs.updateStep(run.id, RadarStep.ANALYZE, {
        status: RadarStatus.AWAITING_EXTERNAL,
        startedAt: now,
      });
      await this.runs.updateRun(run.id, { status: RadarStatus.AWAITING_EXTERNAL });
    }

    const { notAnalyzed } = await this.runs.countItems(run.id, now, MAX_CLAIM_ATTEMPTS);
    if (notAnalyzed > 0) return 'wait';
    return this.finish(run, now);
  }

  private async finish(run: RadarRunSnapshot, now: Date): Promise<Outcome> {
    await this.runs.updateStep(run.id, RadarStep.ANALYZE, { status: RadarStatus.DONE, finishedAt: now, error: null });
    await this.runs.updateRun(run.id, { status: RadarStatus.DONE, finishedAt: now });
    // Nothing left after ANALYZE; the caller's loop ends on the reloaded DONE run.
    return 'wait';
  }

  private async fail(run: RadarRunSnapshot, step: RadarStepSnapshot, message: string, now: Date): Promise<Outcome> {
    this.logger.warn(`Radar run ${run.id} failed at ${step.step}: ${message}`);
    await this.runs.fail(run.id, step.step, message, now);
    return 'failed';
  }

  /**
   * A thrown error is treated as transient until it repeats MAX_STEP_ERRORS times. The step is
   * re-read first: the step may have saved progress (the NORMALIZE offset) before it threw.
   */
  private async recordError(run: RadarRunSnapshot, stale: RadarStepSnapshot, error: unknown, now: Date) {
    const message = error instanceof Error ? error.message : String(error);
    const fresh = await this.runs.findById(run.id);
    if (!fresh || !ACTIVE.has(fresh.status)) return;
    const step = fresh.steps.find((s) => s.step === stale.step) ?? stale;
    const errors = Number(step.meta['errors'] ?? 0) + 1;
    if (errors >= MAX_STEP_ERRORS) {
      await this.fail(run, step, message, now);
      return;
    }
    this.logger.warn(`Radar run ${run.id} ${step.step} error ${errors}/${MAX_STEP_ERRORS}: ${message}`);
    await this.runs.updateStep(run.id, step.step, { meta: { ...step.meta, errors }, error: message.slice(0, 2000) });
  }

  private captureProvider(run: RadarRunSnapshot): ICaptureProvider {
    const provider = this.captureProviders.find((p) => p.name === run.captureAdapter);
    if (!provider) throw new Error(`Unknown capture adapter "${run.captureAdapter}"`);
    return provider;
  }
}
