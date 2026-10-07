import { Inject, Injectable, Logger } from '@nestjs/common';

import { AI_CLIENT, AiCostPolicy, type IAiClient } from '../../../ai';
import { RadarTranscriptPolicy } from '../../domain/policies/radar-transcript.policy';
import { RadarRun } from '../../domain/entities/radar-run.entity';
import { RadarTranscriptJob, RadarTranscriptResult } from '../../domain/radar-transcript.types';
import { IMediaDownloader } from '../ports/media-downloader.port';
import { IRadarTranscriptRepository } from '../ports/radar-transcript.repository.port';
import { RADAR_ANALYSIS_CONFIG, RADAR_RUN_AI_GROUP, RadarAnalysisConfig } from '../radar-analysis.config';
import { RadarTranscriber } from '../radar-transcriber';
import { RADAR_TRANSCRIPT_REPOSITORY, VIDEO_DOWNLOADER } from '../radar.token';

/**
 * The transcript side of ENRICH in an AUTO run (task 421): a few videos per tick, one after
 * another, so only one file is ever in memory. Never fails the run: a video that cannot be read
 * ends FAILED with its reason and is analyzed from its text and images (RAD-008).
 */
@Injectable()
export class RunTranscriptsPhase {
  private readonly logger = new Logger(RunTranscriptsPhase.name);
  private readonly transcriber: RadarTranscriber;
  private readonly settings: RadarAnalysisConfig['transcript'];

  constructor(
    @Inject(AI_CLIENT) private readonly ai: IAiClient,
    @Inject(RADAR_TRANSCRIPT_REPOSITORY) private readonly transcripts: IRadarTranscriptRepository,
    @Inject(VIDEO_DOWNLOADER) downloader: IMediaDownloader,
    @Inject(RADAR_ANALYSIS_CONFIG) config: RadarAnalysisConfig
  ) {
    this.settings = config.transcript;
    this.transcriber = new RadarTranscriber(ai, config.transcript, downloader);
  }

  /** Works one tick's videos; true once none of the run's videos is waiting, so ENRICH may finish. */
  async advance(run: RadarRun): Promise<boolean> {
    const jobs = await this.transcripts.findWaiting(run.id, this.settings.perTick);
    if (jobs.length === 0) return true;

    for (const job of jobs) {
      const result = await this.next(run, job);
      await this.transcripts.save(job.itemId, result);
      if (result.status === 'FAILED') {
        this.logger.warn(`Radar item ${job.itemId}: no transcript (${result.error})`);
      }
    }
    return (await this.transcripts.countWaiting(run.id)) === 0;
  }

  // --- Private ---

  private async next(run: RadarRun, job: RadarTranscriptJob): Promise<RadarTranscriptResult> {
    const failed = (error: string): RadarTranscriptResult => ({ status: 'FAILED', error, attempts: job.attempts });
    const skip = RadarTranscriptPolicy.skipReason(
      job,
      RadarTranscriptPolicy.maxSecondsFor(job.videoUrl, this.settings)
    );
    if (skip) return failed(skip);
    if (!this.ai.configured) return failed('The server has no AI key');

    const group = { type: RADAR_RUN_AI_GROUP, id: run.id };
    // RAD-007: the run's budget is checked against the call's expected cost, not only after it.
    if (run.budgetMicroUsd !== null) {
      const estimate = this.estimateMicroUsd(job);
      const spent = await this.ai.spentMicroUsd(group);
      if (spent + estimate > run.budgetMicroUsd) {
        return failed(`Skipped: about $${(estimate / 1_000_000).toFixed(3)} would pass the run's budget`);
      }
    }
    return this.transcriber.transcribe(job, group);
  }

  /** Priced with the first model of the chain, the one that usually answers. */
  private estimateMicroUsd(job: RadarTranscriptJob): number {
    const { input, output } = RadarTranscriptPolicy.estimatedTokens(
      job.durationSec,
      RadarTranscriptPolicy.maxSecondsFor(job.videoUrl, this.settings),
      this.settings.maxOutputTokens
    );
    const usage = { inputTokens: input, outputTokens: output, thinkingTokens: 0, cachedTokens: 0, toolTokens: 0 };
    return AiCostPolicy.costMicroUsd(this.settings.models[0], usage) ?? 0;
  }
}
