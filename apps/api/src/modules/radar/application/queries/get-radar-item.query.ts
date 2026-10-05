import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { ErrorLayer, NotFoundError, RadarErrorCode } from '@portfolio/shared/errors';
import { IdentifierValue } from '@portfolio/shared/types';

import { IRadarItemRepository } from '../ports/radar-item.repository.port';
import { RadarItemDetailDto } from '../radar.dto';
import { RadarPresenter } from '../radar.presenter';
import { RADAR_ITEM_REPOSITORY } from '../radar.token';

export class GetRadarItemQuery {
  constructor(readonly itemId: string) {}
}

@QueryHandler(GetRadarItemQuery)
export class GetRadarItemHandler implements IQueryHandler<GetRadarItemQuery> {
  constructor(@Inject(RADAR_ITEM_REPOSITORY) private readonly repo: IRadarItemRepository) {}

  async execute(query: GetRadarItemQuery): Promise<RadarItemDetailDto> {
    IdentifierValue.from(query.itemId);

    const item = await this.repo.findById(query.itemId);
    if (!item) {
      throw NotFoundError('Radar item not found', {
        errorCode: RadarErrorCode.ITEM_NOT_FOUND,
        layer: ErrorLayer.APPLICATION,
      });
    }
    return RadarPresenter.toItemDetail(item);
  }
}
