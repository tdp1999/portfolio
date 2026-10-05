import { NormalizedRadarItem } from '../../domain/radar.types';

export interface SaveCaptureInput {
  runId: string;
  sourceId: string;
  captureAdapter: string;
  llmAdapter: string;
  startedAt: Date;
  items: NormalizedRadarItem[];
  failedCount: number;
}

export interface SaveCaptureResult {
  created: number;
  updated: number;
  /** Stored images the re-captured posts no longer contain; their files must be deleted. */
  orphanedImageIds: string[];
}

export interface SaveCapturePageInput {
  /** A run that already exists (Hybrid, or a Manual run created through the runs API). */
  runId: string;
  sourceId: string;
  items: NormalizedRadarItem[];
  failedCount: number;
}

export interface IRadarCaptureRepository {
  /**
   * Records a finished MANUAL run and upserts its items in one transaction (RAD-001: one row per
   * source + externalId). New items start PENDING for the analyze step; refreshed items keep
   * their work status.
   */
  saveCapture(input: SaveCaptureInput): Promise<SaveCaptureResult>;
  /**
   * Upserts one page of items into an existing run and adds the page's counts to the run's
   * totals. Same item rules as {@link saveCapture}; called once per dataset page so a large
   * capture never sits in one transaction or in memory whole.
   */
  saveCapturePage(input: SaveCapturePageInput): Promise<SaveCaptureResult>;
}
