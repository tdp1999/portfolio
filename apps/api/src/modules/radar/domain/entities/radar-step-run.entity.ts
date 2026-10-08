import { RadarStatus, RadarStep } from '@prisma/client';

import { RadarStepMeta, RadarStepRunProps } from '../radar-run.types';
import { RadarCommentsProgress } from '../value-objects/radar-comments-progress';
import { RadarDatasetCursor } from '../value-objects/radar-dataset-cursor';
import { RadarRunFailureLog } from '../value-objects/radar-run-failure-log';

/** One step of a run. Changed only through its {@link RadarRun}, which keeps run and steps consistent. */
export class RadarStepRun {
  // --- Constants ---

  /** Longest error text stored on a run or a step. */
  static readonly MAX_ERROR = 2000;

  private constructor(private readonly props: RadarStepRunProps) {}

  // --- Factory Methods ---

  static create(step: RadarStep, status: RadarStatus, adapter: string): RadarStepRun {
    return new RadarStepRun({
      step,
      status,
      adapter,
      providerJobRef: null,
      meta: {},
      error: null,
      startedAt: null,
      finishedAt: null,
    });
  }

  static load(props: RadarStepRunProps): RadarStepRun {
    return new RadarStepRun(props);
  }

  // --- Getters ---

  get step(): RadarStep {
    return this.props.step;
  }

  get status(): RadarStatus {
    return this.props.status;
  }

  get adapter(): string {
    return this.props.adapter;
  }

  get providerJobRef(): string | null {
    return this.props.providerJobRef;
  }

  get meta(): Readonly<RadarStepMeta> {
    return this.props.meta;
  }

  get error(): string | null {
    return this.props.error;
  }

  get startedAt(): Date | null {
    return this.props.startedAt;
  }

  get finishedAt(): Date | null {
    return this.props.finishedAt;
  }

  get isDone(): boolean {
    return this.props.status === RadarStatus.DONE;
  }

  get isPending(): boolean {
    return this.props.status === RadarStatus.PENDING;
  }

  get errors(): number {
    return Number(this.props.meta.errors ?? 0);
  }

  get cursor(): RadarDatasetCursor | null {
    return RadarDatasetCursor.fromMeta(this.props.meta);
  }

  get failureLog(): RadarRunFailureLog {
    return RadarRunFailureLog.fromMeta(this.props.meta);
  }

  /** CAPTURE: what was sent to the provider; null on runs captured before it was recorded, or by upload. */
  get captureInput(): Readonly<Record<string, unknown>> | null {
    return this.props.meta.input ?? null;
  }

  get comments(): RadarCommentsProgress | null {
    return this.props.meta.comments ? RadarCommentsProgress.load(this.props.meta.comments) : null;
  }

  // --- Rules ---

  start(now: Date): RadarStepRun {
    return this.with({ status: RadarStatus.RUNNING, startedAt: now });
  }

  awaitExternal(now: Date): RadarStepRun {
    return this.with({ status: RadarStatus.AWAITING_EXTERNAL, startedAt: now });
  }

  /** Clears the error a retried attempt left behind. */
  finish(now: Date): RadarStepRun {
    return this.with({ status: RadarStatus.DONE, finishedAt: now, error: null });
  }

  fail(message: string, now: Date): RadarStepRun {
    return this.with({ status: RadarStatus.FAILED, error: RadarStepRun.cut(message), finishedAt: now });
  }

  /** A thrown error the next tick retries: counted in the meta, shown as the step's error. */
  countError(message: string): RadarStepRun {
    return this.with({ meta: { ...this.props.meta, errors: this.errors + 1 }, error: RadarStepRun.cut(message) });
  }

  with(patch: Partial<Omit<RadarStepRunProps, 'step' | 'adapter'>>): RadarStepRun {
    return new RadarStepRun({ ...this.props, ...patch });
  }

  toProps(): RadarStepRunProps {
    return { ...this.props, meta: { ...this.props.meta } };
  }

  // --- Private ---

  private static cut(message: string): string {
    return message.slice(0, RadarStepRun.MAX_ERROR);
  }
}
