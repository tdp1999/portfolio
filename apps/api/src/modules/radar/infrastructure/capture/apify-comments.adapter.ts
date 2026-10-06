import {
  CommentsJobRequest,
  CommentsJobStatus,
  ICommentsProvider,
  RadarCommentsNormalizeResult,
  RadarCommentTarget,
} from '../../application/ports/comments-provider.port';
import { RadarCaptureConfig } from '../../application/radar-capture.config';
import { actorPath, ApifyClient, dataOf } from './apify.client';
import { APIFY_FACEBOOK_COMMENTS_FORMAT, normalizeApifyComments } from './apify-comments.normalizer';

/** Comments of a few dozen posts take minutes; under the run's own capture deadline. */
const ACTOR_TIMEOUT_SECS = 30 * 60;

const FAILED_STATES = new Set(['FAILED']);
const STOPPED_STATES = new Set(['TIMED-OUT', 'ABORTED']);
const RUNNING_STATES = new Set(['READY', 'RUNNING', 'TIMING-OUT', 'ABORTING']);

/**
 * `apify/facebook-comments-scraper` through the REST API. Every start carries
 * `maxTotalChargeUsd`: replies are not bounded by `resultsLimit`, so the cap is the only hard
 * limit on spend. The date filter add-on is never sent (billed per post).
 */
export class ApifyCommentsAdapter implements ICommentsProvider {
  readonly name = 'apify';
  readonly format = APIFY_FACEBOOK_COMMENTS_FORMAT;
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

  async start(request: CommentsJobRequest): Promise<string> {
    const body = await this.client.call(this.runPath('runs', ACTOR_TIMEOUT_SECS, request.maxChargeUsd), {
      method: 'POST',
      body: JSON.stringify(toInput(request)),
    });
    const id = dataOf(body)['id'];
    if (typeof id !== 'string') throw new Error('Apify did not return a run id');
    return id;
  }

  async poll(jobRef: string): Promise<CommentsJobStatus> {
    const run = dataOf(await this.client.call(`/actor-runs/${encodeURIComponent(jobRef)}`));
    const status = String(run['status']);
    if (RUNNING_STATES.has(status)) return { state: 'running' };

    const message = typeof run['statusMessage'] === 'string' ? run['statusMessage'] : '';
    if (FAILED_STATES.has(status) || (!STOPPED_STATES.has(status) && status !== 'SUCCEEDED')) {
      return { state: 'failed', message: `Apify run ${status}${message ? `: ${message}` : ''}` };
    }

    const datasetRef = run['defaultDatasetId'];
    if (typeof datasetRef !== 'string') throw new Error('Apify run has no dataset');
    const dataset = dataOf(await this.client.call(`/datasets/${encodeURIComponent(datasetRef)}`));
    const itemCount = Number(dataset['itemCount'] ?? 0);
    return { state: 'finished', datasetRef, itemCount, stopped: STOPPED_STATES.has(status) };
  }

  async fetchPage(datasetRef: string, offset: number, limit: number): Promise<unknown[]> {
    const body = await this.client.call(
      `/datasets/${encodeURIComponent(datasetRef)}/items?format=json&clean=true&offset=${offset}&limit=${limit}`
    );
    if (!Array.isArray(body)) throw new Error('Apify dataset page is not an array');
    return body;
  }

  async abort(jobRef: string): Promise<void> {
    const run = dataOf(await this.client.call(`/actor-runs/${encodeURIComponent(jobRef)}`));
    if (!RUNNING_STATES.has(String(run['status']))) return;
    await this.client.call(`/actor-runs/${encodeURIComponent(jobRef)}/abort`, { method: 'POST' });
  }

  normalize(raw: readonly unknown[], targets: readonly RadarCommentTarget[]): RadarCommentsNormalizeResult {
    return normalizeApifyComments(raw, targets);
  }

  private runPath(endpoint: string, timeoutSecs: number, maxChargeUsd: number): string {
    const actor = actorPath(this.config.apifyCommentsActor);
    return `/acts/${actor}/${endpoint}?timeout=${timeoutSecs}&maxTotalChargeUsd=${maxChargeUsd}`;
  }
}

/** Input from the task 411 probe: `resultsLimit` is per post and counts top-level comments only. */
function toInput({ postUrls, tier }: CommentsJobRequest): Record<string, unknown> {
  return {
    startUrls: postUrls.map((url) => ({ url })),
    resultsLimit: tier.resultsLimit,
    includeNestedComments: tier.includeReplies,
    viewOption: 'RANKED_THREADED',
  };
}
