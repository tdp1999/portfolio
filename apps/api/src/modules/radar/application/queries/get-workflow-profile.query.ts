import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { IRadarProfileRepository } from '../ports/radar-profile.repository.port';
import { RadarWorkflowProfileDto } from '../radar.dto';
import { RADAR_PROFILE_REPOSITORY } from '../radar.token';

export class GetWorkflowProfileQuery {}

@QueryHandler(GetWorkflowProfileQuery)
export class GetWorkflowProfileHandler implements IQueryHandler<GetWorkflowProfileQuery> {
  constructor(@Inject(RADAR_PROFILE_REPOSITORY) private readonly repo: IRadarProfileRepository) {}

  async execute(): Promise<RadarWorkflowProfileDto> {
    return (await this.repo.find()) ?? { body: '', updatedAt: null };
  }
}
