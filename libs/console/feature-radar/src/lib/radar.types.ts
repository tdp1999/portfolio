import type { RadarContentType, RadarFeedSortKey, RadarProviderTag } from '@portfolio/shared/types';

export type { RadarFeedSortKey };

export type RadarWorkStatus = 'PENDING' | 'CLAIMED' | 'DONE';

export interface RadarItemSource {
  id: string;
  displayName: string;
  isActive: boolean;
}

export interface RadarEnrichmentSummary {
  tldr: string;
  providerTags: RadarProviderTag[];
  contentType: RadarContentType;
  signalScore: number;
  isPromo: boolean;
  isRelevant: boolean;
}

export interface RadarEnrichmentDetail extends RadarEnrichmentSummary {
  imageNotes: string | null;
  linkSummaries: { url: string; summary: string }[];
  commentDigest: string | null;
  factCheck: string | null;
  applyNote: string | null;
  producerAdapter: string;
  producerModel: string;
  updatedAt: string;
}

export interface RadarFeedItem {
  id: string;
  source: RadarItemSource;
  kind: 'POST' | 'REEL' | 'VIDEO' | 'SHARE';
  permalink: string;
  authorName: string;
  publishedAt: string;
  /** The first 200 characters of the post text. */
  preview: string;
  workStatus: RadarWorkStatus;
  enrichment: RadarEnrichmentSummary | null;
}

export interface RadarFeedPage {
  data: RadarFeedItem[];
  total: number;
  page: number;
  limit: number;
}

export interface RadarFeedParams {
  page: number;
  limit: number;
  search?: string;
  providerTag?: string;
  contentType?: string;
  minScore?: number;
  includePromo?: boolean;
  sortBy?: RadarFeedSortKey;
  sortDir?: 'asc' | 'desc';
}

/** The Feed's filters, sort and page as the URL carries them, shared by the Feed and Detail (prev/next). */
export interface RadarFeedState {
  search: string;
  providerTag: string;
  contentType: string;
  /** Kept as the select's string value; '' means no minimum. */
  minScore: string;
  includePromo: boolean;
  sortBy: RadarFeedSortKey;
  sortDir: 'asc' | 'desc';
  pageIndex: number;
}

/** A prev/next target in the Feed, with the page it sits on so the walk can continue from there. */
export interface RadarNeighbour {
  id: string;
  pageIndex: number;
}

export interface RadarWorkflowProfile {
  body: string;
  updatedAt: string | null;
}

export interface RadarItemImage {
  type: 'photo' | 'video';
  url: string;
  storageStatus: 'pending' | 'stored' | 'failed';
  width: number | null;
  height: number | null;
  ocrText: string | null;
}

export interface RadarItemDetail extends Omit<RadarFeedItem, 'preview' | 'enrichment'> {
  text: string;
  images: RadarItemImage[];
  links: { url: string; origin: 'post' | 'shared-post' }[];
  sharedPost: {
    authorName: string | null;
    permalink: string | null;
    publishedAt: string | null;
    text: string;
    images: RadarItemImage[];
  } | null;
  engagement: { likes: number; comments: number; shares: number; views: number | null };
  enrichment: RadarEnrichmentDetail | null;
}

export interface RadarQueueStats {
  pending: number;
  stuck: number;
  paused: number;
}

export interface RadarSource {
  id: string;
  platform: 'FACEBOOK';
  url: string;
  displayName: string;
  isActive: boolean;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRadarSourceInput {
  url: string;
  displayName: string;
}

export interface RadarUploadResult {
  runId: string;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  failures: { index: number; reason: string }[];
}
