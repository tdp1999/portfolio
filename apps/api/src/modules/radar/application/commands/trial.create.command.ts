import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { BadRequestError, ErrorLayer, RadarErrorCode, ValidationError } from '@portfolio/shared/errors';
import { IdentifierValue } from '@portfolio/shared/types';

import { AI_CLIENT, AiCallError, AiCostPolicy, type IAiClient } from '../../../ai';
import { RadarAnalysisDepth } from '../../domain/radar-analysis.types';
import { IRadarProfileRepository } from '../ports/radar-profile.repository.port';
import { IRadarTrialRepository, RadarTrialStart } from '../ports/radar-trial.repository.port';
import { IRadarWorkRepository, RadarWorkSnapshot } from '../ports/radar-work.repository.port';
import { RadarAnalysisPrompt } from '../prompts/radar-analysis.prompt';
import { RadarAnalyzer } from '../radar-analyzer';
import { RADAR_ANALYSIS_CONFIG, RadarAnalysisConfig } from '../radar-analysis.config';
import { CreateTrialsResponseDto, CreateTrialsSchema } from '../radar.dto';
import { RadarPresenter } from '../radar.presenter';
import { RADAR_PROFILE_REPOSITORY, RADAR_TRIAL_REPOSITORY, RADAR_WORK_REPOSITORY } from '../radar.token';

/**
 * Quality trials (task 419): analyzes already-analyzed items again with the server AI and stores
 * each answer next to the item's enrichment, never in its place, so the Owner can compare them.
 * The request returns at once; the trials run in the background one after another (a deep one takes
 * close to a minute), and the Detail page polls `GET /radar/items/:id/trials`.
 */
export class CreateTrialsCommand {
  constructor(readonly body: unknown) {}
}

@CommandHandler(CreateTrialsCommand)
export class CreateTrialsHandler implements ICommandHandler<CreateTrialsCommand> {
  // --- Constants ---

  private static readonly NOTHING_TO_COMPARE = 'No current analysis to compare with';
  private static readonly CAPPED = 'The daily AI spend cap is reached';

  private readonly logger = new Logger(CreateTrialsHandler.name);
  private readonly analyzer: RadarAnalyzer;
  /** Trials of every request share one line, so two requests never call the provider at once. */
  private queue: Promise<void> = Promise.resolve();

  constructor(
    @Inject(AI_CLIENT) private readonly ai: IAiClient,
    @Inject(RADAR_WORK_REPOSITORY) private readonly work: IRadarWorkRepository,
    @Inject(RADAR_PROFILE_REPOSITORY) private readonly profiles: IRadarProfileRepository,
    @Inject(RADAR_TRIAL_REPOSITORY) private readonly trials: IRadarTrialRepository,
    @Inject(RADAR_ANALYSIS_CONFIG) config: RadarAnalysisConfig
  ) {
    this.analyzer = new RadarAnalyzer(ai, config);
  }

  async execute(command: CreateTrialsCommand): Promise<CreateTrialsResponseDto> {
    const { success, data, error } = CreateTrialsSchema.safeParse(command.body);
    if (!success) {
      throw ValidationError(error, { errorCode: RadarErrorCode.INVALID_INPUT, layer: ErrorLayer.APPLICATION });
    }
    if (!this.ai.configured) {
      throw BadRequestError('Auto analysis is not configured (the server has no AI provider key)', {
        errorCode: RadarErrorCode.AI_NOT_CONFIGURED,
        layer: ErrorLayer.APPLICATION,
      });
    }

    if (data.model && !AiCostPolicy.isPriced(data.model)) {
      throw BadRequestError(
        `Unknown model "${data.model}": only models with a price can run, so the daily cap counts them`,
        {
          errorCode: RadarErrorCode.INVALID_INPUT,
          layer: ErrorLayer.APPLICATION,
        }
      );
    }

    const itemIds = [...new Set(data.itemIds)];
    const items = await this.work.findAnalyzed(itemIds);
    const found = new Set(items.map((item) => item.id));
    const skipped = itemIds
      .filter((id) => !found.has(id))
      .map((itemId) => ({ itemId, reason: CreateTrialsHandler.NOTHING_TO_COMPARE }));
    if (items.length === 0) return { started: [], skipped };

    const starts: RadarTrialStart[] = items.map((item) => ({
      id: IdentifierValue.v7(),
      itemId: item.id,
      depth: data.depth,
      requestedModel: data.model ?? null,
    }));
    await this.trials.start(starts);

    const pairs = starts.map((start, i) => ({ trialId: start.id, item: items[i] }));
    this.queue = this.queue.then(() => this.runAll(pairs, data.depth, data.model ?? null));

    return { started: starts.map(({ id, itemId }) => ({ id, itemId })), skipped };
  }

  // --- Private ---

  /** Never rejects: every trial ends DONE or FAILED, so the shared queue keeps going. */
  private async runAll(
    pairs: { trialId: string; item: RadarWorkSnapshot }[],
    depth: RadarAnalysisDepth,
    model: string | null
  ): Promise<void> {
    let stopReason: string | null = null;
    let next = 0;
    try {
      const system = RadarAnalysisPrompt.system((await this.profiles.find())?.body ?? null);
      for (; next < pairs.length; next++) {
        const { trialId, item } = pairs[next];
        if (stopReason) await this.trials.fail(trialId, stopReason, new Date());
        else stopReason = await this.runOne(trialId, item, depth, model, system);
      }
    } catch (error) {
      // Only a repository failure lands here; mark what is left so nothing stays RUNNING.
      this.logger.error(`Radar trials stopped: ${(error as Error).message}`);
      for (const { trialId } of pairs.slice(next)) {
        await this.trials.fail(trialId, 'Interrupted', new Date()).catch(() => undefined);
      }
    }
  }

  /** Runs one trial; returns a reason when the trials after it cannot succeed either. */
  private async runOne(
    trialId: string,
    item: RadarWorkSnapshot,
    depth: RadarAnalysisDepth,
    model: string | null,
    system: string
  ): Promise<string | null> {
    try {
      const outcome = await this.analyzer.analyze(RadarPresenter.toWorkItem(item), depth, system, {
        feature: 'radar.trial',
        models: model ? [model] : undefined,
      });
      switch (outcome.kind) {
        case 'answered': {
          const { usage, costMicroUsd, searchQueries, latencyMs } = outcome.call;
          await this.trials.finish(
            trialId,
            {
              payload: outcome.enrichment,
              inputTokens: usage.inputTokens + usage.toolTokens,
              outputTokens: usage.outputTokens + usage.thinkingTokens,
              costMicroUsd,
              searchQueries,
              latencyMs,
            },
            new Date()
          );
          return null;
        }
        case 'refused':
        case 'failed':
          await this.trials.fail(trialId, outcome.reason, new Date());
          return null;
        case 'busy':
          await this.trials.fail(trialId, 'Every model was busy (rate-limited or down)', new Date());
          return null;
        case 'capped':
          await this.trials.fail(trialId, CreateTrialsHandler.CAPPED, new Date());
          return CreateTrialsHandler.CAPPED;
      }
    } catch (error) {
      // An auth or missing-key error: no later trial can succeed until it is fixed.
      if (!(error instanceof AiCallError)) throw error;
      await this.trials.fail(trialId, error.message, new Date());
      return error.message;
    }
  }
}
