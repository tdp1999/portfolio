import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { IRadarSourceRepository } from '../ports/radar-source.repository.port';
import { RadarSourceResponseDto } from '../radar.dto';
import { RadarPresenter } from '../radar.presenter';
import { RADAR_SOURCE_REPOSITORY } from '../radar.token';

/** Sources are a handful of followed profiles, so the list is unpaginated. */
export class ListSourcesQuery {}

@QueryHandler(ListSourcesQuery)
export class ListSourcesHandler implements IQueryHandler<ListSourcesQuery> {
  constructor(@Inject(RADAR_SOURCE_REPOSITORY) private readonly repo: IRadarSourceRepository) {}

  async execute(): Promise<RadarSourceResponseDto[]> {
    return (await this.repo.findAll()).map(RadarPresenter.toSource);
  }
}
