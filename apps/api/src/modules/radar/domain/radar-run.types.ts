import { RadarRunFlow, RadarRunKind, RadarStatus, RadarStep } from '@prisma/client';

import { RadarFetchTier } from './radar-comment.types';

// --- Step meta ---

/** One comments job of a run: the posts of one tier and its share of the run's charge cap. */
export interface RadarCommentsJob {
  tier: RadarFetchTier;
  itemIds: string[];
  maxChargeUsd: number;
  jobRef: string | null;
  done: boolean;
}

/** The comments side of ENRICH, kept in the step's `meta.comments` so it resumes on the next tick. */
export interface RadarCommentsProgressProps {
  startedAt: string;
  jobs: RadarCommentsJob[];
  errors: number;
  done: boolean;
}

/** Where NORMALIZE is in the provider's dataset. */
export interface RadarDatasetCursorProps {
  datasetRef: string;
  itemCount: number;
  offset: number;
}

/** A step's bookkeeping, stored as JSON: each step uses the keys it needs. */
/** One post NORMALIZE could not read: its URL or id when the row had one, and why. */
export interface RadarRunFailure {
  ref: string | null;
  reason: string;
}

export interface RadarRunFailureLogProps {
  failures: RadarRunFailure[];
  /** Failures past the kept ones, counted only. */
  failuresDropped: number;
}

export interface RadarStepMeta extends Partial<RadarDatasetCursorProps>, Partial<RadarRunFailureLogProps> {
  /** Errors thrown inside the step so far; the run fails at the limit. */
  errors?: number;
  comments?: RadarCommentsProgressProps;
  /** CAPTURE: the input sent to the provider when the job started. */
  input?: Record<string, unknown>;
}

// --- Run ---

export interface RadarStepRunProps {
  step: RadarStep;
  status: RadarStatus;
  adapter: string;
  providerJobRef: string | null;
  meta: RadarStepMeta;
  error: string | null;
  startedAt: Date | null;
  finishedAt: Date | null;
}

/** The source a capture run reads. */
export interface RadarRunSource {
  id: string;
  url: string;
  name: string;
}

export interface RadarRunProps {
  id: string;
  kind: RadarRunKind;
  /** Null only on a REANALYZE run, whose items can come from several sources. */
  sourceId: string | null;
  sourceUrl: string | null;
  sourceName: string | null;
  flow: RadarRunFlow;
  status: RadarStatus;
  windowFrom: Date | null;
  windowTo: Date | null;
  itemCap: number;
  captureAdapter: string;
  llmAdapter: string;
  /** Counters the capture writes as it saves pages; the run never changes them itself. */
  itemsCaptured: number;
  itemsCreated: number;
  itemsUpdated: number;
  itemsFailed: number;
  /** ENRICH also fetches comments for the selected posts. */
  fetchComments: boolean;
  /** AUTO only: the AI spend cap; the analysis stops starting calls once the run's recorded spend reaches it. */
  budgetMicroUsd: number | null;
  /** AUTO only: posts whose quick score reaches the threshold also get the deep analysis. Off by default (ADR-036). */
  deepAnalysis: boolean;
  error: string | null;
  /** A side step (comments) failed but the run went on. */
  warning: string | null;
  createdAt: Date;
  startedAt: Date | null;
  finishedAt: Date | null;
  /** In pipeline order. */
  steps: RadarStepRunProps[];
}

/** The adapter each step runs with, picked by the caller from what is configured. */
export interface RadarRunAdapters {
  capture: string;
  normalize: string;
  enrich: string;
  analyze: string;
}

export interface CreateRadarRunPayload {
  sourceId: string;
  sourceUrl: string;
  sourceName: string;
  flow: RadarRunFlow;
  windowFrom: Date | null;
  windowTo: Date | null;
  itemCap: number;
  fetchComments: boolean;
  budgetMicroUsd: number | null;
  deepAnalysis: boolean;
  adapters: RadarRunAdapters;
}

/** A REANALYZE run: the AUTO analysis of items the Owner picked again, with its own budget. */
export interface CreateReanalyzeRunPayload {
  itemCount: number;
  budgetMicroUsd: number;
  deepAnalysis: boolean;
  analyzeAdapter: string;
}
