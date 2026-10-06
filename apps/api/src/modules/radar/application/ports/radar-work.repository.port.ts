import { RadarCommentsStatus, RadarItemKind } from '@prisma/client';

import { RadarItem } from '../../domain/entities/radar-item.entity';
import { RadarComment } from '../../domain/radar-comment.types';
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
  comments: RadarComment[];
  commentsStatus: RadarCommentsStatus;
  leaseExpiresAt: Date;
}

export interface IRadarWorkRepository {
  /**
   * Atomically claims up to `limit` items that are pending or whose lease expired before `now`
   * (RAD-005), newest first, and leases them until `leaseExpiresAt`. Two concurrent claims never
   * receive the same item. Items already claimed `maxAttempts` times, or whose source is
   * inactive, are skipped. Lease length and attempt cap come from `RadarLeasePolicy`.
   */
  claim(limit: number, leaseExpiresAt: Date, now: Date, maxAttempts: number): Promise<ClaimedRadarItem[]>;
  findById(itemId: string): Promise<RadarItem | null>;
  /**
   * Replaces the item's enrichment and writes its work state, in one transaction. False when the
   * item no longer exists.
   */
  saveEnrichment(item: RadarItem, enrichment: RadarEnrichmentInput): Promise<boolean>;
}
