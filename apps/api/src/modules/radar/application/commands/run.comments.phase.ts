import { Inject, Injectable, Logger } from '@nestjs/common';

import { COMMENT_TIER_INPUT, RadarCommentTier, selectCommentTier } from '../../domain/radar-comments';
import { ICommentsProvider } from '../ports/comments-provider.port';
import { IRadarCommentsRepository, RadarCommentCandidate } from '../ports/radar-comments.repository.port';
import { IRadarRunRepository, RadarRunSnapshot } from '../ports/radar-run.repository.port';
import { RADAR_CAPTURE_CONFIG, RadarCaptureConfig } from '../radar-capture.config';
import {
  applyComments,
  CHARGE_CAP_SLACK_USD,
  reachedChargeCap,
  toCommentPost,
  worstCaseUsd,
} from '../radar-comments.apply';
import { COMMENTS_PROVIDER, RADAR_COMMENTS_REPOSITORY, RADAR_RUN_REPOSITORY } from '../radar.token';

type FetchTier = Exclude<RadarCommentTier, 'skip'>;

export interface CommentsJob {
  tier: FetchTier;
  itemIds: string[];
  maxChargeUsd: number;
  jobRef: string | null;
  done: boolean;
}

/** Kept in the ENRICH step's `meta.comments`, so the phase resumes on the next tick. */
export interface CommentsPhaseMeta {
  startedAt: string;
  jobs: CommentsJob[];
  errors: number;
  done: boolean;
}

/** A comments job that is not done by then is given up (its posts become FAILED), not waited on. */
export const COMMENTS_DEADLINE_MS = 45 * 60 * 1000;
export const MAX_COMMENTS_ERRORS = 5;
const PAGE_SIZE = 1000;
/** Share of the run's cap the bounded tiers may take, leaving the rest for the reply-heavy one. */
const BOUNDED_SHARE = 0.8;

/**
 * The comments side of ENRICH (task 411). Never fails the run: anything that goes wrong marks the
 * affected posts FAILED, sets the run's warning and lets analysis go on without their comments.
 */
@Injectable()
export class RunCommentsPhase {
  private readonly logger = new Logger(RunCommentsPhase.name);

  constructor(
    @Inject(RADAR_CAPTURE_CONFIG) private readonly config: RadarCaptureConfig,
    @Inject(COMMENTS_PROVIDER) private readonly provider: ICommentsProvider,
    @Inject(RADAR_COMMENTS_REPOSITORY) private readonly comments: IRadarCommentsRepository,
    @Inject(RADAR_RUN_REPOSITORY) private readonly runs: IRadarRunRepository
  ) {}

  /** Moves the phase one tick forward and returns its new state; `done` lets ENRICH finish. */
  async advance(run: RadarRunSnapshot, current: CommentsPhaseMeta | undefined, now: Date): Promise<CommentsPhaseMeta> {
    if (current?.done) return current;
    let meta = current ?? (await this.plan(run, now));

    try {
      for (const job of meta.jobs.filter((j) => !j.done)) {
        if (!job.jobRef) {
          job.jobRef = await this.provider.start({
            postUrls: await this.urlsOf(job.itemIds),
            tier: COMMENT_TIER_INPUT[job.tier],
            maxChargeUsd: job.maxChargeUsd,
          });
          // Billed from here on: keep the reference before anything else can throw.
          await this.save(run, meta);
          continue;
        }
        job.done = await this.collect(run, job, now);
      }
    } catch (error) {
      meta = { ...meta, errors: meta.errors + 1 };
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Radar run ${run.id} comments error ${meta.errors}/${MAX_COMMENTS_ERRORS}: ${message}`);
      if (meta.errors >= MAX_COMMENTS_ERRORS) return this.giveUp(run, meta, message);
    }

    if (meta.jobs.every((j) => j.done)) return { ...meta, done: true };
    if (now.getTime() - new Date(meta.startedAt).getTime() > COMMENTS_DEADLINE_MS) {
      return this.giveUp(run, meta, 'Comments did not finish within 45 minutes');
    }
    return meta;
  }

  /** Picks the posts and splits them into one job per tier, each with its share of the run's cap. */
  private async plan(run: RadarRunSnapshot, now: Date): Promise<CommentsPhaseMeta> {
    const byTier = new Map<FetchTier, RadarCommentCandidate[]>();
    for (const item of await this.comments.findCandidates(run.id)) {
      const tier = selectCommentTier(toCommentPost(item));
      if (tier === 'skip') continue;
      byTier.set(tier, [...(byTier.get(tier) ?? []), item]);
    }

    const caps = splitCap(byTier, this.config.commentsMaxChargeUsd);
    const jobs = [...byTier].map(([tier, items]) => ({
      tier,
      itemIds: items.map((i) => i.id),
      maxChargeUsd: caps.get(tier) ?? 0,
      jobRef: null,
      done: false,
    }));
    return { startedAt: now.toISOString(), jobs, errors: 0, done: jobs.length === 0 };
  }

  /** True once the job is settled: its comments are stored, or its posts are marked FAILED. */
  private async collect(run: RadarRunSnapshot, job: CommentsJob, now: Date): Promise<boolean> {
    const status = await this.provider.poll(job.jobRef as string);
    if (status.state === 'running') return false;

    const targets = await this.targetsOf(job.itemIds);
    if (status.state === 'failed') {
      await this.comments.markFailed(job.itemIds, status.message);
      await this.warn(run, `Comments for ${job.itemIds.length} posts failed: ${status.message}`);
      return true;
    }

    const raw: unknown[] = [];
    for (let offset = 0; offset < status.itemCount; offset += PAGE_SIZE) {
      raw.push(...(await this.provider.fetchPage(status.datasetRef, offset, PAGE_SIZE)));
    }
    const result = this.provider.normalize(raw, targets);
    const tier = COMMENT_TIER_INPUT[job.tier];
    const capHit =
      status.stopped || reachedChargeCap(status.itemCount, job.maxChargeUsd, worstCaseUsd(tier, job.itemIds.length));
    const { partial } = await applyComments(this.comments, result, targets, {
      capHit,
      resultsLimit: tier.resultsLimit,
      onlyMatched: false,
      now,
    });
    if (partial > 0) await this.warn(run, `Comments hit the $${job.maxChargeUsd} cap; ${partial} posts are partial`);
    return true;
  }

  private async giveUp(run: RadarRunSnapshot, meta: CommentsPhaseMeta, message: string): Promise<CommentsPhaseMeta> {
    const open = meta.jobs.filter((j) => !j.done);
    await this.comments.markFailed(
      open.flatMap((j) => j.itemIds),
      message
    );
    await abortCommentJobs(this.provider, open, this.logger, run.id);
    await this.warn(run, `Comments skipped: ${message}`);
    return { ...meta, jobs: meta.jobs.map((j) => ({ ...j, done: true })), done: true };
  }

  private async warn(run: RadarRunSnapshot, message: string) {
    await this.runs.updateRun(run.id, { warning: message.slice(0, 500) });
  }

  private async save(run: RadarRunSnapshot, meta: CommentsPhaseMeta) {
    const step = run.steps.find((s) => s.step === 'ENRICH');
    await this.runs.updateStep(run.id, 'ENRICH', { meta: { ...step?.meta, comments: meta } });
  }

  private async targetsOf(itemIds: string[]): Promise<RadarCommentCandidate[]> {
    const found = await Promise.all(itemIds.map((id) => this.comments.findCandidate(id)));
    return found.filter((c): c is RadarCommentCandidate => c !== null);
  }

  private async urlsOf(itemIds: string[]): Promise<string[]> {
    return (await this.targetsOf(itemIds)).map((t) => t.permalink);
  }
}

/**
 * Bounded tiers (no replies) get their worst case plus a little slack, so a full answer never
 * reads as a cap hit; the reply-heavy `full` tier gets what is left. If the bounded tiers alone
 * would pass {@link BOUNDED_SHARE} of the cap, they are scaled down.
 */
export function splitCap(byTier: ReadonlyMap<FetchTier, readonly unknown[]>, totalUsd: number): Map<FetchTier, number> {
  const bound = (tier: FetchTier) =>
    worstCaseUsd(COMMENT_TIER_INPUT[tier], byTier.get(tier)?.length ?? 0) + CHARGE_CAP_SLACK_USD;
  const bounded = (['light', 'full-flat'] as const).filter((t) => byTier.has(t));
  const boundedSum = bounded.reduce((sum, t) => sum + bound(t), 0);
  const scale = boundedSum > totalUsd * BOUNDED_SHARE ? (totalUsd * BOUNDED_SHARE) / boundedSum : 1;

  const caps = new Map<FetchTier, number>(bounded.map((t) => [t, round(bound(t) * scale)]));
  if (byTier.has('full')) caps.set('full', round(totalUsd - boundedSum * scale));
  return caps;
}

const round = (usd: number) => Math.floor(usd * 1000) / 1000;

/**
 * Stops jobs nobody will read (the phase gave up, or the run was cancelled), so they bill no
 * further. Best effort: a failed abort is logged with the job ref, so it can be stopped by hand.
 */
export async function abortCommentJobs(
  provider: ICommentsProvider,
  jobs: readonly Pick<CommentsJob, 'jobRef'>[],
  logger: Logger,
  runId: string
): Promise<void> {
  for (const { jobRef } of jobs) {
    if (!jobRef) continue;
    try {
      await provider.abort(jobRef);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.warn(`Radar run ${runId}: could not abort comments job ${jobRef}: ${message}`);
    }
  }
}
