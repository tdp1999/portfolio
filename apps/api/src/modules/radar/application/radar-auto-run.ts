import { BadRequestError, ErrorLayer, RadarErrorCode } from '@portfolio/shared/errors';

import type { IAiClient } from '../../ai';
import { RadarAnalysisConfig } from './radar-analysis.config';

/** The checks every AUTO run shares, whether it captures (a new run) or not (a re-analysis). */
export class RadarAutoRun {
  /** An AUTO run cannot start without a provider key: it would only fail on its first item. */
  static ensureConfigured(ai: IAiClient): void {
    if (ai.configured) return;
    throw BadRequestError('Auto analysis is not configured (the server has no AI provider key)', {
      errorCode: RadarErrorCode.AI_NOT_CONFIGURED,
      layer: ErrorLayer.APPLICATION,
    });
  }

  /** The Owner's cap in USD, or the configured default. */
  static budgetMicroUsd(analysis: RadarAnalysisConfig, budgetUsd: number | undefined): number {
    return budgetUsd === undefined ? analysis.defaultBudgetMicroUsd : Math.round(budgetUsd * 1_000_000);
  }
}
