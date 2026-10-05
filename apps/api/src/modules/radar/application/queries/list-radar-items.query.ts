import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { ErrorLayer, RadarErrorCode, ValidationError } from '@portfolio/shared/errors';

import { IRadarItemRepository } from '../ports/radar-item.repository.port';
import { ListRadarItemsSchema, MAX_CLAIM_ATTEMPTS, RadarFeedPageDto } from '../radar.dto';
import { RadarPresenter } from '../radar.presenter';
import { RADAR_ITEM_REPOSITORY } from '../radar.token';

export class ListRadarItemsQuery {
  constructor(readonly params: unknown) {}
}

@QueryHandler(ListRadarItemsQuery)
export class ListRadarItemsHandler implements IQueryHandler<ListRadarItemsQuery> {
  constructor(@Inject(RADAR_ITEM_REPOSITORY) private readonly repo: IRadarItemRepository) {}

  async execute(query: ListRadarItemsQuery): Promise<RadarFeedPageDto> {
    const { success, data, error } = ListRadarItemsSchema.safeParse(query.params ?? {});
    if (!success) {
      throw ValidationError(error, {
        errorCode: RadarErrorCode.INVALID_INPUT,
        layer: ErrorLayer.APPLICATION,
        remarks: 'List radar items query validation failed',
      });
    }

    const { data: rows, total } = await this.repo.list(data, new Date(), MAX_CLAIM_ATTEMPTS);
    return { data: rows.map(RadarPresenter.toFeedItem), total, page: data.page, limit: data.limit };
  }
}
