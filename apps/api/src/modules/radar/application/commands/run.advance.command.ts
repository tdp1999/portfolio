import { Inject, Logger } from '@nestjs/common';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RadarRunFlow, RadarStep } from '@prisma/client';

import { RadarLeasePolicy } from '../../domain/policies/radar-lease.policy';
import { STORAGE_SERVICE } from '../../../media/application/media.token';
import { IStorageService } from '../../../media/application/ports/storage.service.port';
import { RadarRun } from '../../domain/entities/radar-run.entity';
import { RadarStepRun } from '../../domain/entities/radar-step-run.entity';
import { RadarDatasetCursor } from '../../domain/value-objects/radar-dataset-cursor';
import { ICaptureNormalizer } from '../ports/capture-normalizer.port';
import { ICaptureProvider } from '../ports/capture-provider.port';
import { ILlmProvider } from '../ports/llm-provider.port';
import { IRadarCaptureRepository } from '../ports/radar-capture.repository.port';
import { IRadarRunRepository } from '../ports/radar-run.repository.port';
import { deleteStoredImages } from '../radar-image.cleanup';
import {
  CAPTURE_NORMALIZERS,
  CAPTURE_PROVIDERS,
  LLM_PROVIDERS,
  RADAR_CAPTURE_REPOSITORY,
  RADAR_RUN_REPOSITORY,
} from '../radar.token';
import { PersistItemImagesCommand } from './persist-item-images.command';
import { RunCommentsPhase } from './run.comments.phase';

/** One page in memory at a time; a tick reads a few pages, so 1,000 posts take about 2 ticks. */
export const DATASET_PAGE_SIZE = 100;
const PAGES_PER_TICK = 5;
const IMAGE_ITEMS_PER_TICK = 10;

/** `advanced`: the step finished and the next one starts in the same tick. */
type Outcome = { state: 'advanced'; run: RadarRun } | { state: 'wait' | 'failed' };
const WAIT: Outcome = { state: 'wait' };

/**
 * Moves one run as far as it can go in one tick: each step either finishes (and the next one
 * starts in the same call), waits for the provider or the worker, or fails the run. Called only
 * by the tick job, which never overlaps itself, so a run is never advanced twice at once. A cancel
 * can still land mid-tick: every save is conditional on the run being active, and the tick stops
 * at the first save that finds it is not.
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
    const loaded = await this.runs.findById(runId);
    if (!loaded?.isActive) return;
    let run: RadarRun | null = loaded.start(now) === loaded ? loaded : await this.runs.save(loaded.start(now));

    for (let pass = 0; pass < RadarRun.PIPELINE.length && run?.isActive; pass++) {
      const step = run.currentStep;
      if (!step) {
        await this.runs.save(run.finish(now));
        return;
      }

      let outcome: Outcome;
      try {
        outcome = await this.handle(run, step, now);
      } catch (error) {
        await this.recordError(run.id, step.step, error, now);
        return;
      }
      if (outcome.state !== 'advanced') return;
      run = outcome.run;
    }
  }

  private handle(run: RadarRun, step: RadarStepRun, now: Date): Promise<Outcome> {
    switch (step.step) {
      case RadarStep.CAPTURE:
        return this.capture(run, step, now);
      case RadarStep.NORMALIZE:
        return this.normalize(run, step, now);
      case RadarStep.ENRICH:
        return this.enrich(run, now);
      default:
        return this.analyze(run, step, now);
    }
  }

  /** Hybrid: start the provider job once, then poll it. Manual: the upload finishes this step. */
  private async capture(run: RadarRun, step: RadarStepRun, now: Date): Promise<Outcome> {
    if (run.flow === RadarRunFlow.MANUAL) return WAIT;
    const provider = this.captureProvider(run);

    if (step.isPending || !step.providerJobRef) {
      const jobRef = await provider.start({
        sourceUrl: run.sourceUrl,
        windowFrom: run.windowFrom,
        windowTo: run.windowTo,
        itemCap: run.itemCap,
      });
      // The job is billed from here on. If its reference cannot be kept (a cancel landed, or the
      // write failed), name it in the log so it can be found and aborted on Apify by hand.
      const kept = await this.runs.save(run.startCapture(jobRef, now)).catch((error: unknown) => {
        this.logger.error(`Radar run ${run.id}: provider job ${jobRef} started but its reference was not saved`);
        throw error;
      });
      if (!kept) this.logger.warn(`Radar run ${run.id} ended while provider job ${jobRef} started; it runs on unread`);
      return WAIT;
    }

    if (run.captureOverdue(now)) return this.fail(run, step, 'Capture did not finish within 60 minutes', now);

    const status = await provider.poll(step.providerJobRef);
    if (status.state === 'running') return WAIT;
    if (status.state === 'failed') return this.fail(run, step, status.message, now);
    if (run.exceedsItemCap(status.itemCount)) {
      return this.fail(
        run,
        step,
        `The provider returned ${status.itemCount} items, more than the run's cap of ${run.itemCap}`,
        now
      );
    }

    return this.advanced(run.completeCapture(RadarDatasetCursor.start(status.datasetRef, status.itemCount), now));
  }

  /** Reads the finished dataset a page at a time and upserts each page before the next. */
  private async normalize(run: RadarRun, step: RadarStepRun, now: Date): Promise<Outcome> {
    const provider = this.captureProvider(run);
    const normalizer = this.normalizers.find((n) => n.format === provider.format);
    if (!normalizer) return this.fail(run, step, `No normalizer for format "${provider.format}"`, now);

    let cursor = step.cursor ?? RadarDatasetCursor.start('', 0);
    let current = run;
    for (let page = 0; page < PAGES_PER_TICK && !cursor.exhausted; page++) {
      const raw = await provider.fetchPage(cursor.datasetRef, cursor.offset, DATASET_PAGE_SIZE);
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
      cursor = cursor.next(DATASET_PAGE_SIZE);
      // Null once the run was cancelled: stop reading pages nobody will finish.
      const moved = await this.runs.save(current.moveCursor(cursor));
      if (!moved) return WAIT;
      current = moved;
    }

    if (!cursor.exhausted) return WAIT;
    return this.advanced(current.completeNormalize(now));
  }

  /**
   * Copies images in small batches per tick and, when the run asks for it, fetches comments for
   * the selected posts. Done when no image is pending and the comments phase is settled; a
   * comments failure only warns (see {@link RunCommentsPhase}).
   */
  private async enrich(run: RadarRun, now: Date): Promise<Outcome> {
    let current: RadarRun | null = run.startEnrich(now) === run ? run : await this.runs.save(run.startEnrich(now));
    if (!current) return WAIT;
    await this.commandBus.execute(new PersistItemImagesCommand(IMAGE_ITEMS_PER_TICK));

    if (current.fetchComments) {
      const advanced = await this.commentsPhase.advance(current, now);
      current = advanced && (await this.runs.save(advanced));
      if (!current) return WAIT;
    }

    const { withPendingImages } = await this.runs.countItems(run.id, now, RadarLeasePolicy.MAX_CLAIM_ATTEMPTS);
    const commentsDone = current.commentsProgress?.done ?? true;
    if (withPendingImages > 0 || !commentsDone) return WAIT;
    return this.advanced(current.completeEnrich(now));
  }

  /**
   * Hands the step to the run's analysis adapter; done once no item of the run is left. An
   * external adapter is asked once and the step waits on the worker; a server-side adapter works
   * a batch on every tick, and the step is checked for completion only on a tick where the adapter
   * found nothing to do (its last batch may have opened deep analyses). Stuck items and items of a
   * paused source do not hold the run open.
   */
  private async analyze(run: RadarRun, step: RadarStepRun, now: Date): Promise<Outcome> {
    const llm = this.llmProviders.find((p) => p.name === run.llmAdapter);
    if (!llm) return this.fail(run, step, `Unknown analysis adapter "${run.llmAdapter}"`, now);

    let current = run;
    if (llm.serverSide || step.isPending) {
      if (llm.serverSide && step.isPending) {
        const started = await this.runs.save(run.startAnalysis(now));
        if (!started) return WAIT;
        current = started;
      }
      const outcome = await llm.process({
        step: RadarStep.ANALYZE,
        runId: run.id,
        budgetMicroUsd: run.budgetMicroUsd,
      });
      if (outcome.state === 'done') return this.finish(current, now);
      // The budget is spent: the run ends, and what is left waits for a later run or `/radar work`.
      if (outcome.state === 'stopped') return this.finish(current.warn(outcome.reason), now);
      if (outcome.state === 'working') return WAIT;
      if (outcome.state === 'awaiting-external') {
        const awaiting = await this.runs.save(current.awaitAnalysis(now));
        if (!awaiting) return WAIT;
        current = awaiting;
      }
    }

    const { notAnalyzed } = await this.runs.countItems(run.id, now, RadarLeasePolicy.MAX_CLAIM_ATTEMPTS);
    if (notAnalyzed > 0) return WAIT;
    return this.finish(current, now);
  }

  /** Nothing left after ANALYZE, so the loop ends here. */
  private async finish(run: RadarRun, now: Date): Promise<Outcome> {
    await this.runs.save(run.finish(now));
    return WAIT;
  }

  private async advanced(next: RadarRun): Promise<Outcome> {
    const saved = await this.runs.save(next);
    return saved ? { state: 'advanced', run: saved } : WAIT;
  }

  private async fail(run: RadarRun, step: RadarStepRun, message: string, now: Date): Promise<Outcome> {
    this.logger.warn(`Radar run ${run.id} failed at ${step.step}: ${message}`);
    await this.runs.save(run.fail(step.step, message, now));
    return { state: 'failed' };
  }

  /**
   * The run is re-read first: the step may have saved progress (the NORMALIZE offset) before it
   * threw, and the copy the tick holds is older than that.
   */
  private async recordError(runId: string, step: RadarStep, error: unknown, now: Date) {
    const message = error instanceof Error ? error.message : String(error);
    const fresh = await this.runs.findById(runId);
    if (!fresh?.isActive) return;
    const next = fresh.recordStepError(step, message, now);
    if (next.status === fresh.status) {
      this.logger.warn(
        `Radar run ${runId} ${step} error ${next.step(step).errors}/${RadarRun.MAX_STEP_ERRORS}: ${message}`
      );
    } else {
      this.logger.warn(`Radar run ${runId} failed at ${step}: ${message}`);
    }
    await this.runs.save(next);
  }

  private captureProvider(run: RadarRun): ICaptureProvider {
    const provider = this.captureProviders.find((p) => p.name === run.captureAdapter);
    if (!provider) throw new Error(`Unknown capture adapter "${run.captureAdapter}"`);
    return provider;
  }
}
