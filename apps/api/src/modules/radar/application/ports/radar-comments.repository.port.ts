import { RadarCommentsStatus } from '@prisma/client';

import { RadarComment } from '../../domain/radar-comments';
import { RadarEngagement, RadarLink, RadarMedia } from '../../domain/radar.types';

/** What the tier rule and the comments normalizer need from an item. */
export interface RadarCommentCandidate {
  id: string;
  permalink: string;
  authorExternalId: string | null;
  text: string;
  engagement: RadarEngagement;
  links: RadarLink[];
  media: RadarMedia[];
  publishedAt: Date;
}

export interface SaveCommentsInput {
  itemId: string;
  /** Replaces the item's whole list (re-capture never duplicates). */
  comments: RadarComment[];
  status: Extract<RadarCommentsStatus, 'FETCHED' | 'PARTIAL'>;
  fetchedAt: Date;
}

export interface IRadarCommentsRepository {
  /** Items whose last capture was this run and whose comments were never fetched, newest first. */
  findCandidates(runId: string): Promise<RadarCommentCandidate[]>;
  findCandidate(itemId: string): Promise<RadarCommentCandidate | null>;
  /** Every item of a source, for matching an uploaded comments export by post URL. */
  findBySource(sourceId: string): Promise<RadarCommentCandidate[]>;
  saveComments(input: SaveCommentsInput): Promise<void>;
  /** Keeps any comments already stored; only the status and error change. */
  markFailed(itemIds: string[], error: string): Promise<void>;
}
