import { RadarItemKind } from '@prisma/client';

export type RadarMediaStorageStatus = 'pending' | 'stored' | 'failed';

export interface RadarMedia {
  type: 'photo' | 'video';
  /** Original provider CDN URL. Facebook re-signs it on every scrape and it expires within days. */
  url: string;
  thumbnailUrl: string | null;
  width: number | null;
  height: number | null;
  /** Provider's alt-text style OCR caption, kept verbatim. */
  ocrText: string | null;
  externalId: string | null;
  /** Copy in our storage (Cloudinary `radar/`), for videos the thumbnail. Null until stored. */
  storedUrl: string | null;
  storedExternalId: string | null;
  storageStatus: RadarMediaStorageStatus;
  storageError: string | null;
}

export interface RadarLink {
  url: string;
  origin: 'post' | 'shared-post';
}

export interface RadarSharedPost {
  authorName: string | null;
  authorExternalId: string | null;
  permalink: string | null;
  publishedAt: string | null;
  text: string;
  media: RadarMedia[];
}

export interface RadarEngagement {
  likes: number;
  comments: number;
  shares: number;
  views: number | null;
}

/** One post in the shape every capture adapter produces, before it is persisted. */
export interface NormalizedRadarItem {
  externalId: string;
  provider: string;
  kind: RadarItemKind;
  permalink: string;
  authorName: string;
  authorExternalId: string | null;
  publishedAt: Date;
  text: string;
  media: RadarMedia[];
  links: RadarLink[];
  sharedPost: RadarSharedPost | null;
  engagement: RadarEngagement;
  rawPayload: unknown;
}

export interface RadarNormalizeFailure {
  /** Zero-based position in the uploaded array. */
  index: number;
  reason: string;
}

export interface RadarNormalizeResult {
  items: NormalizedRadarItem[];
  /** Posts that repeat an externalId already seen earlier in the same batch. */
  skipped: number;
  failures: RadarNormalizeFailure[];
}
