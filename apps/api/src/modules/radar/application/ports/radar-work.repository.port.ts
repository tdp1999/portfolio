import { RadarItemKind } from '@prisma/client';

import { RadarEngagement, RadarLink, RadarMedia, RadarSharedPost } from '../../domain/radar.types';
import { RadarEnrichmentInput } from '../radar-enrichment.schema';

export interface ClaimedRadarItem {
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
  leaseExpiresAt: Date;
}

export interface IRadarWorkRepository {
  /**
   * Atomically claims up to `limit` items that are pending or whose lease expired before `now`
   * (RAD-005), newest first, and leases them until `now + leaseMs`. Two concurrent claims never
   * receive the same item. Items already claimed `maxAttempts` times are skipped.
   */
  claim(limit: number, leaseMs: number, now: Date, maxAttempts: number): Promise<ClaimedRadarItem[]>;
  /** Replaces the item's enrichment and marks it done. False when the item no longer exists. */
  saveEnrichment(itemId: string, enrichment: RadarEnrichmentInput): Promise<boolean>;
}
