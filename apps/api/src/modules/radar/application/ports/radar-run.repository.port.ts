import { RadarRunFlow, RadarStatus, RadarStep } from '@prisma/client';

export interface RadarStepSnapshot {
  step: RadarStep;
  status: RadarStatus;
  adapter: string;
  providerJobRef: string | null;
  meta: Record<string, unknown>;
  error: string | null;
  startedAt: Date | null;
  finishedAt: Date | null;
}

export interface RadarRunSnapshot {
  id: string;
  sourceId: string;
  sourceUrl: string;
  sourceName: string;
  flow: RadarRunFlow;
  status: RadarStatus;
  windowFrom: Date | null;
  windowTo: Date | null;
  itemCap: number;
  captureAdapter: string;
  llmAdapter: string;
  itemsCaptured: number;
  itemsCreated: number;
  itemsUpdated: number;
  itemsFailed: number;
  /** ENRICH also fetches comments for the selected posts. */
  fetchComments: boolean;
  error: string | null;
  /** A side step (comments) failed but the run went on. */
  warning: string | null;
  createdAt: Date;
  startedAt: Date | null;
  finishedAt: Date | null;
  /** In pipeline order. */
  steps: RadarStepSnapshot[];
}

export interface CreateRunData {
  id: string;
  sourceId: string;
  flow: RadarRunFlow;
  status: RadarStatus;
  windowFrom: Date | null;
  windowTo: Date | null;
  itemCap: number;
  captureAdapter: string;
  llmAdapter: string;
  fetchComments: boolean;
  steps: { step: RadarStep; status: RadarStatus; adapter: string }[];
}

export type StepPatch = Partial<
  Pick<RadarStepSnapshot, 'status' | 'providerJobRef' | 'meta' | 'error' | 'startedAt' | 'finishedAt'>
>;
export type RunPatch = Partial<Pick<RadarRunSnapshot, 'status' | 'error' | 'warning' | 'startedAt' | 'finishedAt'>>;

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
  create(data: CreateRunData): Promise<RadarRunSnapshot | null>;
  findById(id: string): Promise<RadarRunSnapshot | null>;
  /** Newest first. */
  list(limit: number): Promise<RadarRunSnapshot[]>;
  /** The idle tick's only query: ids of runs that are neither DONE nor FAILED. */
  findActiveIds(): Promise<string[]>;
  hasActiveRun(sourceId: string): Promise<boolean>;
  /**
   * The writes below apply only while the run is still active (PENDING, RUNNING or
   * AWAITING_EXTERNAL) and return false otherwise: a run cancelled mid-tick stays FAILED.
   */
  updateRun(runId: string, patch: RunPatch): Promise<boolean>;
  updateStep(runId: string, step: RadarStep, patch: StepPatch): Promise<boolean>;
  /**
   * Finishes a Manual run's CAPTURE and NORMALIZE steps and starts ENRICH, in one transaction.
   * False, with nothing written, when the run was cancelled or another upload finished it first.
   */
  completeUpload(runId: string, startedAt: Date, at: Date): Promise<boolean>;
  /** Marks the step and the run FAILED with the same message, in one transaction. */
  fail(runId: string, step: RadarStep, message: string, at: Date): Promise<boolean>;
  /** `now` and `maxAttempts` decide which open items count as stuck, as in the Feed's queue stats. */
  countItems(runId: string, now: Date, maxAttempts: number): Promise<RadarRunItemCounts>;
}
