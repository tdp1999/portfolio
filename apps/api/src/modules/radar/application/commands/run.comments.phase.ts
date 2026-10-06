import { Inject, Injectable, Logger } from '@nestjs/common';

import { RadarCommentTierPolicy } from '../../domain/policies/radar-comment-tier.policy';
import { RadarCommentsCostPolicy } from '../../domain/policies/radar-comments-cost.policy';
import { RadarItem } from '../../domain/entities/radar-item.entity';
import { RadarRun } from '../../domain/entities/radar-run.entity';
import { RadarFetchTier } from '../../domain/radar-comment.types';
import { RadarCommentsJob } from '../../domain/radar-run.types';
import { RadarCommentsProgress } from '../../domain/value-objects/radar-comments-progress';
import { ICommentsProvider } from '../ports/comments-provider.port';
import { IRadarCommentsRepository } from '../ports/radar-comments.repository.port';
import { IRadarRunRepository } from '../ports/radar-run.repository.port';
import { RADAR_CAPTURE_CONFIG, RadarCaptureConfig } from '../radar-capture.config';
import { applyComments, markCommentsFailed } from '../radar-comments.apply';
import { COMMENTS_PROVIDER, RADAR_COMMENTS_REPOSITORY, RADAR_RUN_REPOSITORY } from '../radar.token';

const PAGE_SIZE = 1000;

/** What one tick did to a job: settled or not, and the warning it leaves on the run. */
interface Collected {
  settled: boolean;
  warning?: string;
}

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

  /**
   * Moves the phase one tick forward. Returns the run with the phase's new state and any warning,
   * for the caller to save; `commentsProgress.done` lets ENRICH finish. Null when the run was
   * cancelled while a job was starting.
   */
  async advance(loaded: RadarRun, now: Date): Promise<RadarRun | null> {
    let run = loaded;
    let progress = run.commentsProgress ?? (await this.plan(run, now));
    if (progress.done) return run.withCommentsProgress(progress);

    try {
      for (const [index, job] of progress.jobs.entries()) {
        if (job.done) continue;
        if (!job.jobRef) {
          const jobRef = await this.provider.start({
            postUrls: await this.urlsOf(job.itemIds),
            tier: RadarCommentTierPolicy.input(job.tier),
            maxChargeUsd: job.maxChargeUsd,
          });
          progress = progress.withJobStarted(index, jobRef);
          // Billed from here on: keep the reference before anything else can throw.
          const saved = await this.runs.save(run.withCommentsProgress(progress));
          if (!saved) return null;
          run = saved;
          continue;
        }
        const { settled, warning } = await this.collect(job, now);
        if (settled) progress = progress.withJobSettled(index);
        if (warning) run = run.warn(warning);
      }
    } catch (error) {
      progress = progress.withError();
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Radar run ${run.id} comments error ${progress.errors}/${RadarCommentsProgress.MAX_ERRORS}: ${message}`
      );
      if (progress.reachedErrorLimit) return this.giveUp(run, progress, message);
    }

    progress = progress.settle();
    if (!progress.done && progress.isOverdue(now)) {
      return this.giveUp(run, progress, 'Comments did not finish within 45 minutes');
    }
    return run.withCommentsProgress(progress);
  }

  /** Picks the posts and splits them into one job per tier, each with its share of the run's cap. */
  private async plan(run: RadarRun, now: Date): Promise<RadarCommentsProgress> {
    const byTier = new Map<RadarFetchTier, RadarItem[]>();
    for (const item of await this.comments.findCandidates(run.id)) {
      const tier = RadarCommentTierPolicy.select(item.commentPost);
      if (tier === 'skip') continue;
      byTier.set(tier, [...(byTier.get(tier) ?? []), item]);
    }

    const caps = RadarCommentsCostPolicy.splitCap(byTier, this.config.commentsMaxChargeUsd);
    const jobs = [...byTier].map(([tier, items]) => ({
      tier,
      itemIds: items.map((i) => i.id),
      maxChargeUsd: caps.get(tier) ?? 0,
    }));
    return RadarCommentsProgress.plan(jobs, now);
  }

  /** Settled once the job's comments are stored, or its posts are marked FAILED. */
  private async collect(job: Readonly<RadarCommentsJob>, now: Date): Promise<Collected> {
    const status = await this.provider.poll(job.jobRef as string);
    if (status.state === 'running') return { settled: false };

    if (status.state === 'failed') {
      await markCommentsFailed(this.comments, job.itemIds, status.message);
      return { settled: true, warning: `Comments for ${job.itemIds.length} posts failed: ${status.message}` };
    }

    const raw: unknown[] = [];
    for (let offset = 0; offset < status.itemCount; offset += PAGE_SIZE) {
      raw.push(...(await this.provider.fetchPage(status.datasetRef, offset, PAGE_SIZE)));
    }
    const targets = await this.comments.findByIds(job.itemIds);
    const result = this.provider.normalize(raw, targets);
    const tier = RadarCommentTierPolicy.input(job.tier);
    const capHit =
      status.stopped ||
      RadarCommentsCostPolicy.reachedChargeCap(
        status.itemCount,
        job.maxChargeUsd,
        RadarCommentsCostPolicy.worstCaseUsd(tier, job.itemIds.length)
      );
    const { partial } = await applyComments(this.comments, result, targets, {
      capHit,
      resultsLimit: tier.resultsLimit,
      onlyMatched: false,
      now,
    });
    return {
      settled: true,
      warning: partial > 0 ? `Comments hit the $${job.maxChargeUsd} cap; ${partial} posts are partial` : undefined,
    };
  }

  private async giveUp(run: RadarRun, progress: RadarCommentsProgress, message: string): Promise<RadarRun> {
    const open = progress.openJobs;
    await markCommentsFailed(
      this.comments,
      open.flatMap((j) => j.itemIds),
      message
    );
    await abortCommentJobs(this.provider, open, this.logger, run.id);
    return run.withCommentsProgress(progress.giveUp()).warn(`Comments skipped: ${message}`);
  }

  private async urlsOf(itemIds: readonly string[]): Promise<string[]> {
    return (await this.comments.findByIds(itemIds)).map((t) => t.permalink);
  }
}

/**
 * Stops jobs nobody will read (the phase gave up, or the run was cancelled), so they bill no
 * further. Best effort: a failed abort is logged with the job ref, so it can be stopped by hand.
 */
export async function abortCommentJobs(
  provider: ICommentsProvider,
  jobs: readonly Pick<RadarCommentsJob, 'jobRef'>[],
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
