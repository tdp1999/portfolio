import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { RadarCommentTierPolicy } from '../../domain/policies/radar-comment-tier.policy';
import {
  DEFAULT_ITEM_COMMENTS_MAX_CHARGE_USD,
  RADAR_CAPTURE_CONFIG,
  RadarCaptureConfig,
} from '../radar-capture.config';
import { RadarCommentsSettingsDto } from '../radar.dto';

/** The comment limits the console quotes before a billed fetch, read from the server's config. */
export class GetCommentsSettingsQuery {}

@QueryHandler(GetCommentsSettingsQuery)
export class GetCommentsSettingsHandler implements IQueryHandler<GetCommentsSettingsQuery> {
  constructor(@Inject(RADAR_CAPTURE_CONFIG) private readonly config: RadarCaptureConfig) {}

  async execute(): Promise<RadarCommentsSettingsDto> {
    return {
      runMaxChargeUsd: this.config.commentsMaxChargeUsd,
      itemMaxChargeUsd: DEFAULT_ITEM_COMMENTS_MAX_CHARGE_USD,
      itemTopLevelLimit: RadarCommentTierPolicy.input('full').resultsLimit,
    };
  }
}
