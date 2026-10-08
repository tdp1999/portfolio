import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { ErrorLayer, RadarErrorCode, ValidationError } from '@portfolio/shared/errors';

import { AI_CLIENT, type IAiClient } from '../../../ai';
import { RadarRun } from '../../domain/entities/radar-run.entity';
import { SERVER_AI_ADAPTER } from '../ports/llm-provider.port';
import { IRadarItemRepository } from '../ports/radar-item.repository.port';
import { RADAR_ANALYSIS_CONFIG, RadarAnalysisConfig } from '../radar-analysis.config';
import { RadarAutoRun } from '../radar-auto-run';
import { ReanalyzeItemsResponseDto, ReanalyzeItemsSchema } from '../radar.dto';
import { RADAR_ITEM_REPOSITORY } from '../radar.token';

/**
 * The Owner asks for items to be analyzed again. `AUTO` (the default) puts them in a REANALYZE run
 * the tick analyzes right away under its own budget; `WORKER` only puts them back in the queue for
 * the next `/radar work`. Each item keeps its enrichment until the next analysis replaces it.
 */
export class ReanalyzeItemsCommand {
  constructor(readonly body: unknown) {}
}

@CommandHandler(ReanalyzeItemsCommand)
export class ReanalyzeItemsHandler implements ICommandHandler<ReanalyzeItemsCommand> {
  constructor(
    @Inject(RADAR_ITEM_REPOSITORY) private readonly items: IRadarItemRepository,
    @Inject(AI_CLIENT) private readonly ai: IAiClient,
    @Inject(RADAR_ANALYSIS_CONFIG) private readonly analysis: RadarAnalysisConfig
  ) {}

  async execute(command: ReanalyzeItemsCommand): Promise<ReanalyzeItemsResponseDto> {
    const { success, data, error } = ReanalyzeItemsSchema.safeParse(command.body ?? {});
    if (!success) {
      throw ValidationError(error, {
        errorCode: RadarErrorCode.INVALID_INPUT,
        layer: ErrorLayer.APPLICATION,
        remarks: 'Reanalyze radar items validation failed',
      });
    }
    const ids = [...new Set(data.ids)];
    const auto = data.mode === 'AUTO';
    if (auto) RadarAutoRun.ensureConfigured(this.ai);
    const budgetMicroUsd = RadarAutoRun.budgetMicroUsd(this.analysis, data.budgetUsd);

    const { requeued, run } = await this.items.requeueForAnalysis(
      ids,
      new Date(),
      auto
        ? (count) => RadarRun.reanalyze({ itemCount: count, budgetMicroUsd, analyzeAdapter: SERVER_AI_ADAPTER })
        : null
    );
    return { requeued, skipped: ids.length - requeued, runId: run?.id ?? null };
  }
}
