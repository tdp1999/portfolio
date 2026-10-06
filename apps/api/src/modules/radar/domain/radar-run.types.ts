import { RadarRunFlow, RadarStatus, RadarStep } from '@prisma/client';

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
export interface RadarStepMeta extends Partial<RadarDatasetCursorProps> {
  /** Errors thrown inside the step so far; the run fails at the limit. */
  errors?: number;
  comments?: RadarCommentsProgressProps;
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

export interface RadarRunProps {
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
  /** Counters the capture writes as it saves pages; the run never changes them itself. */
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
  adapters: RadarRunAdapters;
}
