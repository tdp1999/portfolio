import { RadarComment, RadarCommentTierInput } from '../../domain/radar-comments';
import { RadarNormalizeFailure } from '../../domain/radar.types';

/** The post a batch of comments may belong to. */
export interface RadarCommentTarget {
  permalink: string;
  authorExternalId: string | null;
}

export interface RadarCommentsReceived {
  topLevel: number;
  /** Top-level comments plus replies, the same unit as the post's own comment count. */
  total: number;
}

export interface RadarCommentsNormalizeResult {
  /** Labelled and trimmed comments per target permalink; a target with no comment is absent. */
  byPermalink: Map<string, RadarComment[]>;
  /** What the provider returned per permalink, before trimming: tells a cut-short post apart. */
  received: Map<string, RadarCommentsReceived>;
  /** Comments whose post is none of the targets. */
  unmatched: number;
  failures: RadarNormalizeFailure[];
}

export interface CommentsJobRequest {
  /** Post permalinks; every post of one request shares the same tier input. */
  postUrls: string[];
  tier: RadarCommentTierInput;
  /** Apify stops the job once its billing reaches this. */
  maxChargeUsd: number;
}

export type CommentsJobStatus =
  | { state: 'running' }
  /**
   * The job ended with a dataset to read. `stopped` is true when it did not finish on its own
   * (aborted, timed out, charge cap): what is there is real but may be incomplete.
   */
  | { state: 'finished'; datasetRef: string; itemCount: number; stopped: boolean }
  | { state: 'failed'; message: string };

/** Fetches Facebook comments on the provider side as a job, for a run or for one post (Detail). */
export interface ICommentsProvider {
  readonly name: string;
  /** The comments normalizer format the dataset is in. */
  readonly format: string;
  isConfigured(): boolean;
  start(request: CommentsJobRequest): Promise<string>;
  poll(jobRef: string): Promise<CommentsJobStatus>;
  fetchPage(datasetRef: string, offset: number, limit: number): Promise<unknown[]>;
  /** Stops a job nobody will read, so it bills no further. A job that already ended is left alone. */
  abort(jobRef: string): Promise<void>;
  /** Maps raw dataset items (from a job or an uploaded export) to comments per target. */
  normalize(raw: readonly unknown[], targets: readonly RadarCommentTarget[]): RadarCommentsNormalizeResult;
}
