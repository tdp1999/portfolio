import { RadarRunFlow, RadarRunKind, RadarStatus, RadarStep } from '@prisma/client';

import {
  BadRequestError,
  CommonErrorCode,
  ErrorLayer,
  InternalServerError,
  RadarErrorCode,
} from '@portfolio/shared/errors';
import { IdentifierValue, RADAR_RUN_CANCELLED_MESSAGE, TemporalValue } from '@portfolio/shared/types';

import { RadarNormalizeFailure } from '../radar.types';
import { CreateRadarRunPayload, CreateReanalyzeRunPayload, RadarRunProps, RadarRunSource } from '../radar-run.types';
import { RadarCommentsProgress } from '../value-objects/radar-comments-progress';
import { RadarDatasetCursor } from '../value-objects/radar-dataset-cursor';
import { RadarStepRun } from './radar-step-run.entity';

type RadarRunState = Omit<RadarRunProps, 'steps'> & { steps: readonly RadarStepRun[] };

/**
 * One capture-to-analysis pass over a source (a CAPTURE run), or a second analysis of items the
 * Owner picked (a REANALYZE run, ANALYZE step only, no source), and its steps. Owns every status change of the run
 * and its steps; the repository saves it only while the run is still active, so a run cancelled
 * mid-tick stays cancelled.
 */
export class RadarRun {
  // --- Constants ---

  /** Steps a run walks, in order. SYNTHESIZE belongs to the brief (412), not to a run. */
  static readonly PIPELINE: readonly RadarStep[] = [
    RadarStep.CAPTURE,
    RadarStep.NORMALIZE,
    RadarStep.ENRICH,
    RadarStep.ANALYZE,
  ];
  static readonly ACTIVE: readonly RadarStatus[] = [
    RadarStatus.PENDING,
    RadarStatus.RUNNING,
    RadarStatus.AWAITING_EXTERNAL,
  ];
  /** On top of Apify's own 50-minute run timeout, so a job stuck on the provider side still ends. */
  static readonly CAPTURE_DEADLINE_MS = 60 * 60 * 1000;
  /** Errors thrown inside one step (network, provider 5xx) are retried on later ticks up to this. */
  static readonly MAX_STEP_ERRORS = 5;
  static readonly MAX_WARNING = 500;
  /** The capture adapter a REANALYZE run records: it captures nothing. */
  static readonly NO_CAPTURE_ADAPTER = 'none';

  private constructor(
    private readonly props: RadarRunState,
    private readonly loaded: RadarRunProps | null
  ) {}

  // --- Factory Methods ---

  /**
   * A run starts only because the Owner asked for one (RAD-006). A Hybrid or Auto run's capture
   * is PENDING, so the next tick starts the provider job; a Manual run's capture waits in
   * AWAITING_EXTERNAL for the upload. SYNTHESIZE gets no step: the brief (412) is per window.
   */
  static create(data: CreateRadarRunPayload): RadarRun {
    if (!data.sourceId) {
      throw BadRequestError('A capture run needs a source', {
        errorCode: RadarErrorCode.INVALID_INPUT,
        layer: ErrorLayer.DOMAIN,
      });
    }
    const waiting = data.flow === RadarRunFlow.MANUAL ? RadarStatus.AWAITING_EXTERNAL : RadarStatus.PENDING;
    const { adapters, ...run } = data;
    return new RadarRun(
      {
        ...run,
        id: IdentifierValue.v7(),
        kind: RadarRunKind.CAPTURE,
        status: waiting,
        captureAdapter: adapters.capture,
        llmAdapter: adapters.analyze,
        itemsCaptured: 0,
        itemsCreated: 0,
        itemsUpdated: 0,
        itemsFailed: 0,
        error: null,
        warning: null,
        createdAt: TemporalValue.now(),
        startedAt: null,
        finishedAt: null,
        steps: [
          RadarStepRun.create(RadarStep.CAPTURE, waiting, adapters.capture),
          RadarStepRun.create(RadarStep.NORMALIZE, RadarStatus.PENDING, adapters.normalize),
          RadarStepRun.create(RadarStep.ENRICH, RadarStatus.PENDING, adapters.enrich),
          RadarStepRun.create(RadarStep.ANALYZE, RadarStatus.PENDING, adapters.analyze),
        ],
      },
      null
    );
  }

  /**
   * An AUTO analysis with no capture: the requeued items point at this run, and the tick analyzes
   * them as it does any AUTO run's items (light, then deep), under this run's budget.
   */
  static reanalyze(data: CreateReanalyzeRunPayload): RadarRun {
    return new RadarRun(
      {
        id: IdentifierValue.v7(),
        kind: RadarRunKind.REANALYZE,
        sourceId: null,
        sourceUrl: null,
        sourceName: null,
        flow: RadarRunFlow.AUTO,
        status: RadarStatus.PENDING,
        windowFrom: null,
        windowTo: null,
        itemCap: data.itemCount,
        captureAdapter: RadarRun.NO_CAPTURE_ADAPTER,
        llmAdapter: data.analyzeAdapter,
        itemsCaptured: 0,
        itemsCreated: 0,
        itemsUpdated: 0,
        itemsFailed: 0,
        fetchComments: false,
        budgetMicroUsd: data.budgetMicroUsd,
        error: null,
        warning: null,
        createdAt: TemporalValue.now(),
        startedAt: null,
        finishedAt: null,
        steps: [RadarStepRun.create(RadarStep.ANALYZE, RadarStatus.PENDING, data.analyzeAdapter)],
      },
      null
    );
  }

  static load(props: RadarRunProps): RadarRun {
    return new RadarRun({ ...props, steps: props.steps.map((s) => RadarStepRun.load(s)) }, props);
  }

  // --- Getters ---

  get id(): string {
    return this.props.id;
  }

  get kind(): RadarRunKind {
    return this.props.kind;
  }

  get sourceId(): string | null {
    return this.props.sourceId;
  }

  get sourceName(): string | null {
    return this.props.sourceName;
  }

  /** The source a capture step reads; only a CAPTURE run has one. */
  get captureSource(): RadarRunSource {
    const { sourceId, sourceUrl, sourceName } = this.props;
    if (!sourceId || sourceUrl === null || sourceName === null) {
      throw InternalServerError(`Radar run ${this.props.id} has no source to capture`, {
        errorCode: CommonErrorCode.INTERNAL_ERROR,
        layer: ErrorLayer.DOMAIN,
      });
    }
    return { id: sourceId, url: sourceUrl, name: sourceName };
  }

  get flow(): RadarRunFlow {
    return this.props.flow;
  }

  get status(): RadarStatus {
    return this.props.status;
  }

  get windowFrom(): Date | null {
    return this.props.windowFrom;
  }

  get windowTo(): Date | null {
    return this.props.windowTo;
  }

  get itemCap(): number {
    return this.props.itemCap;
  }

  get captureAdapter(): string {
    return this.props.captureAdapter;
  }

  get llmAdapter(): string {
    return this.props.llmAdapter;
  }

  get itemsCaptured(): number {
    return this.props.itemsCaptured;
  }

  get itemsCreated(): number {
    return this.props.itemsCreated;
  }

  get itemsUpdated(): number {
    return this.props.itemsUpdated;
  }

  get itemsFailed(): number {
    return this.props.itemsFailed;
  }

  get fetchComments(): boolean {
    return this.props.fetchComments;
  }

  get budgetMicroUsd(): number | null {
    return this.props.budgetMicroUsd;
  }

  get error(): string | null {
    return this.props.error;
  }

  get warning(): string | null {
    return this.props.warning;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get startedAt(): Date | null {
    return this.props.startedAt;
  }

  get finishedAt(): Date | null {
    return this.props.finishedAt;
  }

  get steps(): readonly RadarStepRun[] {
    return this.props.steps;
  }

  /** The state the database held when this run was read; null for a run not added yet. */
  get loadedProps(): RadarRunProps | null {
    return this.loaded;
  }

  get isActive(): boolean {
    return RadarRun.ACTIVE.includes(this.props.status);
  }

  /** The first pipeline step not done yet; null once all are. */
  get currentStep(): RadarStepRun | null {
    return this.props.steps.find((s) => RadarRun.PIPELINE.includes(s.step) && !s.isDone) ?? null;
  }

  get commentsProgress(): RadarCommentsProgress | null {
    return this.step(RadarStep.ENRICH).comments;
  }

  step(step: RadarStep): RadarStepRun {
    const found = this.props.steps.find((s) => s.step === step);
    if (!found) {
      throw InternalServerError(`Radar run ${this.props.id} has no ${step} step`, {
        errorCode: CommonErrorCode.INTERNAL_ERROR,
        layer: ErrorLayer.DOMAIN,
      });
    }
    return found;
  }

  // --- Rules ---

  /** A pending run starts on its first tick. */
  start(now: Date): RadarRun {
    if (this.props.status !== RadarStatus.PENDING) return this;
    return this.with({ status: RadarStatus.RUNNING, startedAt: now });
  }

  exceedsItemCap(itemCount: number): boolean {
    return itemCount > this.props.itemCap;
  }

  /** The provider job started: it is billed from here, so its reference must be kept. */
  startCapture(jobRef: string, input: Record<string, unknown>, now: Date): RadarRun {
    return this.withStep(RadarStep.CAPTURE, (s) =>
      s.with({ status: RadarStatus.RUNNING, providerJobRef: jobRef, startedAt: now, meta: { ...s.meta, input } })
    );
  }

  captureOverdue(now: Date): boolean {
    const startedAt = this.step(RadarStep.CAPTURE).startedAt ?? this.props.startedAt ?? now;
    return now.getTime() - startedAt.getTime() > RadarRun.CAPTURE_DEADLINE_MS;
  }

  /** The provider's dataset is ready: NORMALIZE reads it from the start. */
  completeCapture(cursor: RadarDatasetCursor, now: Date): RadarRun {
    return this.withStep(RadarStep.CAPTURE, (s) =>
      s.finish(now).with({ meta: { ...s.meta, ...cursor.toMeta() } })
    ).withStep(RadarStep.NORMALIZE, (s) => s.start(now).with({ meta: cursor.toMeta() }));
  }

  moveCursor(cursor: RadarDatasetCursor): RadarRun {
    return this.withStep(RadarStep.NORMALIZE, (s) => s.with({ meta: { ...s.meta, offset: cursor.offset } }));
  }

  /** Keeps the posts NORMALIZE could not read, up to the failure log's cap. */
  noteFailures(failures: readonly RadarNormalizeFailure[]): RadarRun {
    if (failures.length === 0) return this;
    return this.withStep(RadarStep.NORMALIZE, (s) =>
      s.with({ meta: { ...s.meta, ...s.failureLog.add(failures).toMeta() } })
    );
  }

  completeNormalize(now: Date): RadarRun {
    return this.withStep(RadarStep.NORMALIZE, (s) => s.finish(now)).withStep(RadarStep.ENRICH, (s) => s.start(now));
  }

  startEnrich(now: Date): RadarRun {
    if (!this.step(RadarStep.ENRICH).isPending) return this;
    return this.withStep(RadarStep.ENRICH, (s) => s.start(now));
  }

  withCommentsProgress(progress: RadarCommentsProgress): RadarRun {
    return this.withStep(RadarStep.ENRICH, (s) => s.with({ meta: { ...s.meta, comments: progress.toProps() } }));
  }

  completeEnrich(now: Date): RadarRun {
    return this.withStep(RadarStep.ENRICH, (s) => s.finish(now));
  }

  /** A server-side analysis works the step itself, tick by tick. */
  startAnalysis(now: Date): RadarRun {
    if (!this.step(RadarStep.ANALYZE).isPending) return this;
    return this.withStep(RadarStep.ANALYZE, (s) => s.start(now));
  }

  /** The analysis adapter took the step; the run waits on the worker. */
  awaitAnalysis(now: Date): RadarRun {
    return this.withStep(RadarStep.ANALYZE, (s) => s.awaitExternal(now)).with({
      status: RadarStatus.AWAITING_EXTERNAL,
    });
  }

  finish(now: Date): RadarRun {
    const analyze = this.step(RadarStep.ANALYZE);
    const run = analyze.isDone ? this : this.withStep(RadarStep.ANALYZE, (s) => s.finish(now));
    return run.with({ status: RadarStatus.DONE, finishedAt: now });
  }

  /** The step and the run fail with the same message. */
  fail(step: RadarStep, message: string, now: Date): RadarRun {
    const failed = this.withStep(step, (s) => s.fail(message, now));
    return failed.with({ status: RadarStatus.FAILED, error: failed.step(step).error, finishedAt: now });
  }

  /**
   * The way out of the one-active-run rule: a Manual run nobody uploads to, or a run waiting on
   * analysis the Owner no longer wants, would otherwise block its source for good. The current
   * step and the run fail; items already captured stay.
   */
  cancel(now: Date): RadarRun {
    const current = this.props.steps.find((s) => !s.isDone);
    if (!this.isActive || !current) {
      throw BadRequestError('This run has already finished', {
        errorCode: RadarErrorCode.RUN_FINISHED,
        layer: ErrorLayer.DOMAIN,
      });
    }
    return this.fail(current.step, RADAR_RUN_CANCELLED_MESSAGE, now);
  }

  /** A thrown error is treated as transient until it repeats {@link MAX_STEP_ERRORS} times. */
  recordStepError(step: RadarStep, message: string, now: Date): RadarRun {
    if (this.step(step).errors + 1 >= RadarRun.MAX_STEP_ERRORS) return this.fail(step, message, now);
    return this.withStep(step, (s) => s.countError(message));
  }

  /** A side step went wrong; the run goes on. The last warning wins. */
  warn(message: string): RadarRun {
    return this.with({ warning: message.slice(0, RadarRun.MAX_WARNING) });
  }

  /** Only a Manual run of this source whose capture waits for the file takes an upload. */
  ensureAwaitsUploadFor(sourceId: string): void {
    if (
      this.props.sourceId !== sourceId ||
      this.props.flow !== RadarRunFlow.MANUAL ||
      this.step(RadarStep.CAPTURE).status !== RadarStatus.AWAITING_EXTERNAL
    ) {
      throw BadRequestError('This run is not waiting for an upload for this source', {
        errorCode: RadarErrorCode.RUN_NOT_AWAITING_UPLOAD,
        layer: ErrorLayer.DOMAIN,
      });
    }
  }

  /** The upload normalized the file itself, so CAPTURE and NORMALIZE finish together. */
  completeUpload(startedAt: Date, now: Date): RadarRun {
    return this.withStep(RadarStep.CAPTURE, (s) => s.finish(now).with({ startedAt }))
      .withStep(RadarStep.NORMALIZE, (s) => s.finish(now).with({ startedAt }))
      .withStep(RadarStep.ENRICH, (s) => s.start(now))
      .with({ status: RadarStatus.RUNNING, startedAt });
  }

  toProps(): RadarRunProps {
    return { ...this.props, steps: this.props.steps.map((s) => s.toProps()) };
  }

  // --- Private ---

  private with(patch: Partial<Omit<RadarRunState, 'id' | 'steps'>>): RadarRun {
    return new RadarRun({ ...this.props, ...patch }, this.loaded);
  }

  private withStep(step: RadarStep, change: (s: RadarStepRun) => RadarStepRun): RadarRun {
    this.step(step);
    return new RadarRun(
      { ...this.props, steps: this.props.steps.map((s) => (s.step === step ? change(s) : s)) },
      this.loaded
    );
  }
}
