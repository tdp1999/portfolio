import { RadarPlatform } from '@prisma/client';

export interface CaptureJobRequest {
  /** The source URL: a Facebook page, or a YouTube channel's canonical URL. */
  sourceUrl: string;
  windowFrom: Date | null;
  windowTo: Date | null;
  /** Upper bound on posts the provider may return; also what the provider is billed for. */
  itemCap: number;
}

export type CaptureJobStatus =
  | { state: 'running' }
  | { state: 'succeeded'; datasetRef: string; itemCount: number }
  /** Failed, timed out or aborted on the provider side; `message` is the provider's own. */
  | { state: 'failed'; message: string };

/** A source as the provider knows it: the URL to store and the name it goes by there. */
export interface ResolvedSource {
  url: string;
  name: string;
}

/**
 * A capture provider that runs a job on its side (Hybrid and Auto flows). One per platform. The run state machine starts it
 * once, polls it on every tick, and reads the finished dataset page by page so a large backfill
 * never sits in memory whole. A synchronous provider is a job that succeeds on the first poll.
 */
export interface ICaptureProvider {
  /** Adapter name stored on the run and step rows, e.g. `apify`. */
  readonly name: string;
  /** The {@link ICaptureNormalizer} format the fetched pages are in. */
  readonly format: string;
  /** The sources it captures; a run picks its provider by its source's platform. */
  readonly platform: RadarPlatform;
  /** The setting a run needs, named in the refusal when it is unset (e.g. `APIFY_TOKEN`). */
  readonly credentialName: string;
  /** False when the provider's credentials are missing, so a Hybrid run cannot start. */
  isConfigured(): boolean;
  /**
   * Checks a source URL when the source is added and returns the form to store, or null when the
   * provider does not know it. Absent when any URL is taken as pasted (Facebook).
   */
  resolveSource?(url: string): Promise<ResolvedSource | null>;
  /** Starts the job and returns the provider's job reference. */
  start(request: CaptureJobRequest): Promise<string>;
  poll(jobRef: string): Promise<CaptureJobStatus>;
  fetchPage(datasetRef: string, offset: number, limit: number): Promise<unknown[]>;
}
