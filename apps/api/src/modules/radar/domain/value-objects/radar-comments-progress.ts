import { RadarCommentsJob, RadarCommentsProgressProps } from '../radar-run.types';

/**
 * How far a run's comments phase got: one job per tier, each started once and settled once. The
 * phase never fails the run; past the deadline or the error limit it gives up on what is open.
 */
export class RadarCommentsProgress {
  // --- Constants ---

  /** A job that is not done by then is given up (its posts become FAILED), not waited on. */
  static readonly DEADLINE_MS = 45 * 60 * 1000;
  static readonly MAX_ERRORS = 5;

  private constructor(private readonly props: RadarCommentsProgressProps) {
    Object.freeze(this);
  }

  // --- Factory Methods ---

  /** A new phase; with no job to run it is done at once. */
  static plan(jobs: readonly Omit<RadarCommentsJob, 'jobRef' | 'done'>[], now: Date): RadarCommentsProgress {
    return new RadarCommentsProgress({
      startedAt: now.toISOString(),
      jobs: jobs.map((j) => ({ ...j, itemIds: [...j.itemIds], jobRef: null, done: false })),
      errors: 0,
      done: jobs.length === 0,
    });
  }

  static load(props: RadarCommentsProgressProps): RadarCommentsProgress {
    return new RadarCommentsProgress(props);
  }

  // --- Getters ---

  get jobs(): readonly Readonly<RadarCommentsJob>[] {
    return this.props.jobs;
  }

  get errors(): number {
    return this.props.errors;
  }

  get done(): boolean {
    return this.props.done;
  }

  /** Jobs not settled yet, started or not. */
  get openJobs(): readonly Readonly<RadarCommentsJob>[] {
    return this.props.jobs.filter((j) => !j.done);
  }

  get reachedErrorLimit(): boolean {
    return this.props.errors >= RadarCommentsProgress.MAX_ERRORS;
  }

  // --- Rules ---

  isOverdue(now: Date): boolean {
    return now.getTime() - new Date(this.props.startedAt).getTime() > RadarCommentsProgress.DEADLINE_MS;
  }

  withJobStarted(index: number, jobRef: string): RadarCommentsProgress {
    return this.withJob(index, { jobRef });
  }

  withJobSettled(index: number): RadarCommentsProgress {
    return this.withJob(index, { done: true });
  }

  withError(): RadarCommentsProgress {
    return new RadarCommentsProgress({ ...this.props, errors: this.props.errors + 1 });
  }

  /** Done once every job is settled; otherwise unchanged. */
  settle(): RadarCommentsProgress {
    if (!this.props.jobs.every((j) => j.done)) return this;
    return new RadarCommentsProgress({ ...this.props, done: true });
  }

  /** Every job settled, open ones included: the phase stops and ENRICH may finish. */
  giveUp(): RadarCommentsProgress {
    return new RadarCommentsProgress({
      ...this.props,
      jobs: this.props.jobs.map((j) => ({ ...j, done: true })),
      done: true,
    });
  }

  toProps(): RadarCommentsProgressProps {
    return { ...this.props, jobs: this.props.jobs.map((j) => ({ ...j, itemIds: [...j.itemIds] })) };
  }

  // --- Private ---

  private withJob(index: number, patch: Partial<RadarCommentsJob>): RadarCommentsProgress {
    return new RadarCommentsProgress({
      ...this.props,
      jobs: this.props.jobs.map((j, i) => (i === index ? { ...j, ...patch } : j)),
    });
  }
}
