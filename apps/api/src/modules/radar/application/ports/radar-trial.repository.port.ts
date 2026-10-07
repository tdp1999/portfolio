import { RadarTrialStatus } from '@prisma/client';

import { RadarAnalysisDepth } from '../../domain/radar-analysis.types';
import { RadarEnrichmentData } from '../radar-analyzer';

/** A trial as it is created: running, for one item, at one depth, on one model or the default chain. */
export interface RadarTrialStart {
  id: string;
  itemId: string;
  depth: RadarAnalysisDepth;
  requestedModel: string | null;
}

/** What a finished trial keeps from its call. */
export interface RadarTrialResult {
  payload: RadarEnrichmentData;
  inputTokens: number;
  outputTokens: number;
  costMicroUsd: number | null;
  searchQueries: number;
  latencyMs: number;
}

export interface RadarTrialRecord {
  id: string;
  itemId: string;
  depth: RadarAnalysisDepth;
  requestedModel: string | null;
  status: RadarTrialStatus;
  payload: RadarEnrichmentData | null;
  error: string | null;
  inputTokens: number;
  outputTokens: number;
  costMicroUsd: number | null;
  searchQueries: number;
  latencyMs: number | null;
  createdAt: Date;
  finishedAt: Date | null;
}

/** Quality trials (task 419): analyses stored next to an item's enrichment, never in its place. */
export interface IRadarTrialRepository {
  start(trials: readonly RadarTrialStart[]): Promise<void>;
  finish(id: string, result: RadarTrialResult, now: Date): Promise<void>;
  fail(id: string, reason: string, now: Date): Promise<void>;
  /** The item's trials, newest first. */
  listByItem(itemId: string): Promise<RadarTrialRecord[]>;
}
