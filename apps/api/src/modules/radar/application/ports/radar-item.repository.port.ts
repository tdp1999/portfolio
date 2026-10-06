import { RadarCommentsStatus, RadarItemKind, RadarWorkStatus } from '@prisma/client';

import { PaginatedResult, RadarContentType, RadarFeedStatus, RadarProviderTag } from '@portfolio/shared/types';

import { RadarComment } from '../../domain/radar-comment.types';
import { RadarEngagement, RadarLink, RadarMedia, RadarSharedPost } from '../../domain/radar.types';

export interface RadarItemListFilter {
  page: number;
  limit: number;
  /** Case-insensitive match on the post text or the TL;DR. */
  search?: string;
  providerTag?: RadarProviderTag;
  contentType?: RadarContentType;
  minScore?: number;
  /** False hides items whose enrichment is flagged promo; unenriched items always stay. */
  includePromo: boolean;
  sourceId?: string;
  /** One queue bucket, counted the same way as `RadarQueueStats`. */
  status?: RadarFeedStatus;
  /** Unanalyzed items have no score; they sort after every scored item in both directions. */
  sortBy: 'publishedAt' | 'signalScore' | 'source';
  sortDir: 'asc' | 'desc';
}

export interface RadarEnrichmentSummary {
  tldr: string;
  providerTags: string[];
  contentType: string;
  signalScore: number;
  isPromo: boolean;
  isRelevant: boolean;
  /** The analysis thinks the unfetched comments are worth reading. */
  wantsComments: boolean;
}

export interface RadarEnrichmentDetail extends RadarEnrichmentSummary {
  imageNotes: string | null;
  linkSummaries: { url: string; summary: string }[];
  commentDigest: string | null;
  factCheck: string | null;
  applyNote: string | null;
  /** Null on v1 enrichments, written before the field existed. */
  context: string | null;
  scoreReason: string | null;
  producerAdapter: string;
  producerModel: string;
  updatedAt: Date;
}

interface RadarItemBase {
  id: string;
  source: { id: string; displayName: string; isActive: boolean };
  kind: RadarItemKind;
  permalink: string;
  authorName: string;
  publishedAt: Date;
  text: string;
  workStatus: RadarWorkStatus;
  engagement: RadarEngagement;
  commentsStatus: RadarCommentsStatus;
  commentsFetchedCount: number;
  commentsFetchedAt: Date | null;
  commentsError: string | null;
}

export interface RadarFeedRow extends RadarItemBase {
  enrichment: RadarEnrichmentSummary | null;
}

export interface RadarItemDetail extends RadarItemBase {
  media: RadarMedia[];
  links: RadarLink[];
  sharedPost: RadarSharedPost | null;
  comments: RadarComment[];
  enrichment: RadarEnrichmentDetail | null;
}

export interface RadarQueueStats {
  /** Not analyzed yet and still claimable (active source, under the attempt cap or leased). */
  pending: number;
  /** Claimed `maxAttempts` times, lease over, no stored result: the worker gave up on them. */
  stuck: number;
  /** Not analyzed and their source is inactive, so claim skips them until it is reactivated. */
  paused: number;
  /** Done (`workStatus` DONE). Re-queued items keep their old enrichment but count as pending. */
  analyzed: number;
}

export interface IRadarItemRepository {
  /** Newest first. `now` and `maxAttempts` decide the `pending` / `stuck` split of `filter.status`. */
  list(filter: RadarItemListFilter, now: Date, maxAttempts: number): Promise<PaginatedResult<RadarFeedRow>>;
  findById(id: string): Promise<RadarItemDetail | null>;
  stats(now: Date, maxAttempts: number): Promise<RadarQueueStats>;
  /** Resets every stuck item (see `RadarQueueStats.stuck`) to pending with no claims. Returns how many. */
  requeueStuck(now: Date, maxAttempts: number): Promise<number>;
}
