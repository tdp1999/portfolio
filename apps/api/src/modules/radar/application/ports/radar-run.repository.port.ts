import { RadarRun } from '../../domain/entities/radar-run.entity';

export interface RadarRunItemCounts {
  /** Items whose last capture was this run. */
  total: number;
  /**
   * Of those, items the worker can still pick up: not analyzed, on an active source and not
   * stuck. Stuck items and paused sources are left to the Feed's queue buckets.
   */
  notAnalyzed: number;
  /** Of those, items that still have an image waiting to be copied. */
  withPendingImages: number;
}

export interface IRadarRunRepository {
  /** Null when the source already has an active run: the check and the insert are one transaction. */
  add(run: RadarRun): Promise<RadarRun | null>;
  findById(id: string): Promise<RadarRun | null>;
  /** Newest first. */
  list(limit: number): Promise<RadarRun[]>;
  /** The idle tick's only query: ids of runs that are neither DONE nor FAILED. */
  findActiveIds(): Promise<string[]>;
  /** An active capture run of the source, or an active re-analysis holding some of its posts. */
  hasActiveRun(sourceId: string): Promise<boolean>;
  /**
   * Writes what changed since the run was read, in one transaction, and returns the run as now
   * stored. Null, with nothing written, when the run is no longer active (a run cancelled
   * mid-tick stays FAILED) or a changed step no longer has the status it was read with (a second
   * upload, or a write from a stale copy). The item counters are never written here.
   */
  save(run: RadarRun): Promise<RadarRun | null>;
  /** `now` and `maxAttempts` decide which open items count as stuck, as in the Feed's queue stats. */
  countItems(runId: string, now: Date, maxAttempts: number): Promise<RadarRunItemCounts>;
}
