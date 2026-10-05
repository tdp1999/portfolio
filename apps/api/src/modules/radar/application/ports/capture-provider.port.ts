export interface CaptureJobRequest {
  /** The source profile URL. */
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

/**
 * A capture provider that runs a job on its side (Hybrid flow). The run state machine starts it
 * once, polls it on every tick, and reads the finished dataset page by page so a large backfill
 * never sits in memory whole. A synchronous provider is a job that succeeds on the first poll.
 */
export interface ICaptureProvider {
  /** Adapter name stored on the run and step rows, e.g. `apify`. */
  readonly name: string;
  /** The {@link ICaptureNormalizer} format the fetched pages are in. */
  readonly format: string;
  /** False when the provider's credentials are missing, so a Hybrid run cannot start. */
  isConfigured(): boolean;
  /** Starts the job and returns the provider's job reference. */
  start(request: CaptureJobRequest): Promise<string>;
  poll(jobRef: string): Promise<CaptureJobStatus>;
  fetchPage(datasetRef: string, offset: number, limit: number): Promise<unknown[]>;
}
