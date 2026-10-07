import { RadarCommentsStatus, RadarItemKind, RadarPlatform, RadarTriageStatus, RadarWorkStatus } from '@prisma/client';

import { PaginatedResult, RadarContentType, RadarFeedStatus, RadarProviderTag } from '@portfolio/shared/types';

import { RadarComment } from '../../domain/radar-comment.types';
import { RadarEngagement, RadarLink, RadarMedia, RadarSharedPost } from '../../domain/radar.types';
import { RadarItemVideo, RadarTranscriptStatus } from '../../domain/radar-transcript.types';

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
  triageStatus?: RadarTriageStatus;
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
  /** `major` flags a post that misleads on its main claim; `minor` and null show nothing. */
  factCheckSeverity: string | null;
  /** `light` (quick pass) or `deep` (researched) for a server analysis; null for a worker analysis. */
  analysisDepth: string | null;
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
  /** Null before v3. */
  overview: string | null;
  /** Pages the analysis used as evidence; empty when it named none or predates the field. */
  sources: { url: string; title: string | null }[];
  producerAdapter: string;
  producerModel: string;
  updatedAt: Date;
}

interface RadarItemBase {
  id: string;
  source: { id: string; displayName: string; isActive: boolean; platform: RadarPlatform };
  kind: RadarItemKind;
  permalink: string;
  authorName: string;
  publishedAt: Date;
  text: string;
  workStatus: RadarWorkStatus;
  claimCount: number;
  leaseExpiresAt: Date | null;
  triageStatus: RadarTriageStatus;
  engagement: RadarEngagement;
  commentsStatus: RadarCommentsStatus;
  commentsFetchedCount: number;
  commentsFetchedAt: Date | null;
  commentsError: string | null;
  /** Why the last analysis failed (a stuck item, or a deep pass that kept the quick result). */
  workError: string | null;
}

export interface RadarFeedRow extends RadarItemBase {
  enrichment: RadarEnrichmentSummary | null;
  /** The post's own media, so the list can count its images. */
  media: RadarMedia[];
  /** Null when the capture carried no playable video file. */
  videoUrl: string | null;
  videoDurationSec: number | null;
  transcriptStatus: RadarTranscriptStatus;
}

export type RadarTriageCounts = Record<RadarTriageStatus, number>;

export interface RadarItemDetail extends RadarItemBase {
  media: RadarMedia[];
  links: RadarLink[];
  sharedPost: RadarSharedPost | null;
  comments: RadarComment[];
  enrichment: RadarEnrichmentDetail | null;
  /** Null for an item without a playable video. */
  video: RadarItemVideo | null;
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
  /** Items per triage status under the same filter as `list`, ignoring its `triageStatus` and page. */
  countByTriage(filter: RadarItemListFilter, now: Date, maxAttempts: number): Promise<RadarTriageCounts>;
  /** Sets one triage status on every listed item that exists; returns how many were updated. */
  setTriage(ids: readonly string[], status: RadarTriageStatus, now: Date): Promise<number>;
  findById(id: string): Promise<RadarItemDetail | null>;
  stats(now: Date, maxAttempts: number): Promise<RadarQueueStats>;
  /** Resets every stuck item (see `RadarQueueStats.stuck`) to pending with no claims. Returns how many. */
  requeueStuck(now: Date, maxAttempts: number): Promise<number>;
}
