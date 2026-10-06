import { RadarBrief } from '../../domain/entities/radar-brief.entity';
import { RadarBriefProps } from '../../domain/radar-brief.types';

/** Which analyzed posts a brief covers: a window, over one source or all of them. */
export interface RadarBriefScope {
  sourceId: string | null;
  windowFrom: Date;
  windowTo: Date;
}

/** A brief in the list: everything but the body, which can be long. */
export type RadarBriefSummary = Omit<RadarBriefProps, 'body' | 'itemIds'> & {
  itemCount: number;
  sourceName: string | null;
};

/** One analyzed post as the worker reads it to write a brief. */
export interface RadarBriefWorkItem {
  id: string;
  sourceName: string;
  permalink: string;
  authorName: string;
  publishedAt: Date;
  text: string;
  tldr: string;
  providerTags: string[];
  contentType: string;
  signalScore: number;
  isPromo: boolean;
  isRelevant: boolean;
  context: string | null;
  scoreReason: string | null;
  factCheck: string | null;
  applyNote: string | null;
  linkSummaries: { url: string; summary: string }[];
}

export interface IRadarBriefRepository {
  add(brief: RadarBrief): Promise<void>;
  findById(id: string): Promise<RadarBrief | null>;
  /** Newest first. */
  list(limit: number): Promise<RadarBriefSummary[]>;
  /** A brief not written yet (pending, or claimed under a lease) blocks a new request. */
  hasWaiting(): Promise<boolean>;
  /** The oldest pending brief, or one whose lease ran out, claimed under a new lease; null if none. */
  claim(leaseExpiresAt: Date, now: Date): Promise<RadarBrief | null>;
  /** Writes the submitted brief while it is still claimed; false once it is not. */
  saveResult(brief: RadarBrief): Promise<boolean>;
  windowItemIds(scope: RadarBriefScope): Promise<string[]>;
  /** Oldest first, so the worker reads the window as a timeline. */
  windowItems(
    scope: RadarBriefScope,
    offset: number,
    limit: number
  ): Promise<{ items: RadarBriefWorkItem[]; total: number }>;
}
