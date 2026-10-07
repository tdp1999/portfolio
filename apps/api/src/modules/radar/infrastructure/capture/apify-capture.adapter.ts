import { RadarPlatform } from '@prisma/client';

import { CaptureJobRequest, CaptureJobStatus, ICaptureProvider } from '../../application/ports/capture-provider.port';
import { RadarCaptureConfig } from '../../application/radar-capture.config';
import { actorPath, ApifyClient, dataOf } from './apify.client';

/** Apify's own run timeout, under the state machine's 60-minute capture deadline. */
const ACTOR_TIMEOUT_SECS = 50 * 60;

const FAILED_STATES = new Set(['FAILED', 'TIMED-OUT', 'ABORTED']);
const RUNNING_STATES = new Set(['READY', 'RUNNING', 'TIMING-OUT', 'ABORTING']);

const ymd = (d: Date) => d.toISOString().slice(0, 10);

/** Hybrid capture through the Apify REST API (start actor run, get run, list dataset items). */
export class ApifyCaptureAdapter implements ICaptureProvider {
  readonly name = 'apify';
  readonly format = 'apify-facebook-posts';
  readonly platform = RadarPlatform.FACEBOOK;
  readonly credentialName = 'APIFY_TOKEN';

  private readonly client: ApifyClient;

  constructor(
    private readonly config: RadarCaptureConfig,
    http?: typeof fetch
  ) {
    this.client = new ApifyClient(config.apifyToken, http);
  }

  isConfigured(): boolean {
    return this.client.isConfigured;
  }

  async start(request: CaptureJobRequest): Promise<string> {
    // Input from the task 400 probe. The date filter is billed per post, so it is sent only
    // when the run has a window; a backfill relies on `resultsLimit` alone.
    const input: Record<string, unknown> = {
      startUrls: [{ url: request.sourceUrl }],
      resultsLimit: request.itemCap,
      captionText: false,
    };
    if (request.windowFrom) input['onlyPostsNewerThan'] = ymd(request.windowFrom);
    // The window end is the last millisecond of a UTC day and the actor's bound is a whole day it
    // excludes, so the bound is the next day; the window's last day itself would read as empty.
    if (request.windowTo) input['onlyPostsOlderThan'] = ymd(new Date(request.windowTo.getTime() + 1));

    const body = await this.client.call(
      `/acts/${actorPath(this.config.apifyPostsActor)}/runs?timeout=${ACTOR_TIMEOUT_SECS}`,
      {
        method: 'POST',
        body: JSON.stringify(input),
      }
    );
    const id = dataOf(body)['id'];
    if (typeof id !== 'string') throw new Error('Apify did not return a run id');
    return id;
  }

  async poll(jobRef: string): Promise<CaptureJobStatus> {
    const run = dataOf(await this.client.call(`/actor-runs/${encodeURIComponent(jobRef)}`));
    const status = String(run['status']);

    if (RUNNING_STATES.has(status)) return { state: 'running' };
    if (FAILED_STATES.has(status)) {
      const message = typeof run['statusMessage'] === 'string' ? run['statusMessage'] : '';
      return { state: 'failed', message: `Apify run ${status}${message ? `: ${message}` : ''}` };
    }
    if (status !== 'SUCCEEDED') return { state: 'failed', message: `Apify run in unknown state ${status}` };

    const datasetRef = run['defaultDatasetId'];
    if (typeof datasetRef !== 'string') throw new Error('Apify run has no dataset');
    const dataset = dataOf(await this.client.call(`/datasets/${encodeURIComponent(datasetRef)}`));
    const itemCount = Number(dataset['itemCount'] ?? 0);
    return { state: 'succeeded', datasetRef, itemCount };
  }

  async fetchPage(datasetRef: string, offset: number, limit: number): Promise<unknown[]> {
    const body = await this.client.call(
      `/datasets/${encodeURIComponent(datasetRef)}/items?format=json&clean=true&offset=${offset}&limit=${limit}`
    );
    if (!Array.isArray(body)) throw new Error('Apify dataset page is not an array');
    return body;
  }
}
