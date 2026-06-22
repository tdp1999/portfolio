import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { IDashboardRepository } from '../ports/dashboard.repository.port';
import { DASHBOARD_REPOSITORY } from '../dashboard.token';
import { DashboardStatsDto } from '../dashboard.dto';

export class GetDashboardStatsQuery {}

@QueryHandler(GetDashboardStatsQuery)
export class GetDashboardStatsHandler implements IQueryHandler<GetDashboardStatsQuery> {
  constructor(@Inject(DASHBOARD_REPOSITORY) private readonly repo: IDashboardRepository) {}

  async execute(): Promise<DashboardStatsDto> {
    return await this.repo.getStats();
  }
}
