import { RadarCommentsStatus, RadarWorkStatus } from '@prisma/client';

import { RadarComment } from './radar-comment.types';
import { RadarEngagement, RadarLink, RadarMedia } from './radar.types';

/**
 * The part of a captured post its own rules need: what the comment tier and the comments
 * normalizer read, the comment state and the work state. Feed and Detail read their own shapes.
 */
export interface RadarItemProps {
  id: string;
  permalink: string;
  authorExternalId: string | null;
  text: string;
  publishedAt: Date;
  engagement: RadarEngagement;
  links: RadarLink[];
  media: RadarMedia[];
  workStatus: RadarWorkStatus;
  leaseExpiresAt: Date | null;
  comments: RadarComment[];
  commentsStatus: RadarCommentsStatus;
  commentsFetchedAt: Date | null;
  commentsFetchedCount: number;
  commentsError: string | null;
}

/** What decides an item's place in the worker's queue (`RadarLeasePolicy.queueState`). */
export interface RadarQueueFacts {
  workStatus: RadarWorkStatus;
  claimCount: number;
  leaseExpiresAt: Date | null;
  sourceActive: boolean;
}
