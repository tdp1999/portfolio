import { RadarCommentsStatus, RadarItemKind } from '@prisma/client';

import { RadarItem } from '../../domain/entities/radar-item.entity';
import { RadarAnalysisDepth } from '../../domain/radar-analysis.types';
import { RadarComment } from '../../domain/radar-comment.types';
import { RadarEngagement, RadarLink, RadarMedia, RadarSharedPost } from '../../domain/radar.types';
import { RadarEnrichmentInput } from '../radar-enrichment.schema';

/** What an analysis reads about one item. */
export interface RadarWorkSnapshot {
  id: string;
  kind: RadarItemKind;
  permalink: string;
  authorName: string;
  publishedAt: Date;
  text: string;
  media: RadarMedia[];
  links: RadarLink[];
  sharedPost: RadarSharedPost | null;
  engagement: RadarEngagement;
  comments: RadarComment[];
  commentsStatus: RadarCommentsStatus;
}

export interface ClaimedRadarItem extends RadarWorkSnapshot {
  leaseExpiresAt: Date;
}

export interface IRadarWorkRepository {
  /**
   * Atomically claims up to `limit` items that are pending or whose lease expired before `now`
   * (RAD-005), newest first, and leases them until `leaseExpiresAt`. Two concurrent claims never
   * receive the same item. Items already claimed `maxAttempts` times, or whose source is
   * inactive, are skipped. Lease length and attempt cap come from `RadarLeasePolicy`. With
   * `runId`, only items whose last run is that run are claimed (the server analysis of one run).
   */
  claim(
    limit: number,
    leaseExpiresAt: Date,
    now: Date,
    maxAttempts: number,
    runId?: string
  ): Promise<ClaimedRadarItem[]>;
  findById(itemId: string): Promise<RadarItem | null>;
  /**
   * Replaces the item's enrichment and writes its work state, in one transaction. False when the
   * item no longer exists. `depth` is set by the server analysis only; null for the worker.
   */
  saveEnrichment(
    item: RadarItem,
    enrichment: RadarEnrichmentInput,
    depth?: RadarAnalysisDepth | null
  ): Promise<boolean>;
  /**
   * The run's items whose light analysis scored at least `minScore` and that have no deep
   * analysis yet nor a recorded error, best score first, at most `limit`.
   */
  findDeepCandidates(runId: string, minScore: number, limit: number): Promise<RadarWorkSnapshot[]>;
  /** How many of the run's items have a deep analysis. */
  countDeep(runId: string): Promise<number>;
  /** Keeps why an analysis failed without changing the item's state (its light analysis stays). */
  noteError(itemId: string, reason: string): Promise<void>;
  /**
   * Gives claimed items back to the queue at once. `countAttempt: false` also takes back the
   * claim it counted (the provider was busy, the item did nothing wrong), so it never turns stuck.
   */
  release(itemIds: string[], countAttempt: boolean): Promise<void>;
  /** The server analysis gave up on the item: it turns stuck (until requeued) and keeps the reason. */
  markFailed(itemId: string, reason: string, maxAttempts: number): Promise<void>;
}
