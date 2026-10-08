import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { ErrorLayer, RadarErrorCode, ValidationError } from '@portfolio/shared/errors';

import { RadarLeasePolicy } from '../../domain/policies/radar-lease.policy';
import { IRadarItemRepository } from '../ports/radar-item.repository.port';
import { ListRadarItemsSchema, RadarFeedPageDto } from '../radar.dto';
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

    const now = new Date();
    const [{ data: rows, total }, triageCounts, producerModels] = await Promise.all([
      this.repo.list(data, now, RadarLeasePolicy.MAX_CLAIM_ATTEMPTS),
      this.repo.countByTriage(data, now, RadarLeasePolicy.MAX_CLAIM_ATTEMPTS),
      this.repo.listProducerModels(),
    ]);
    return {
      data: rows.map((row) => RadarPresenter.toFeedItem(row, now)),
      total,
      page: data.page,
      limit: data.limit,
      triageCounts,
      producerModels,
    };
  }
}
