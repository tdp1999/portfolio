import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { AI_CLIENT, type IAiClient } from '../../../ai';
import { RADAR_ANALYSIS_CONFIG, RadarAnalysisConfig } from '../radar-analysis.config';
import { RadarAiSettingsDto } from '../radar.dto';

/** Whether an AUTO run can start, and the budget the New run dialog proposes. */
export class GetAiSettingsQuery {}

@QueryHandler(GetAiSettingsQuery)
export class GetAiSettingsHandler implements IQueryHandler<GetAiSettingsQuery> {
  constructor(
    @Inject(AI_CLIENT) private readonly ai: IAiClient,
    @Inject(RADAR_ANALYSIS_CONFIG) private readonly analysis: RadarAnalysisConfig
  ) {}

  async execute(): Promise<RadarAiSettingsDto> {
    return {
      configured: this.ai.configured,
      billing: this.ai.billing,
      defaultBudgetMicroUsd: this.analysis.defaultBudgetMicroUsd,
    };
  }
}
