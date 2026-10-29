import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { HealthProfileDto } from '@portfolio/shared/types';
import { MedicineCabinetPresenter } from '../medicine-cabinet.presenter';
import { IHealthProfileRepository } from '../ports/health-profile.repository.port';
import { HEALTH_PROFILE_REPOSITORY } from '../medicine-cabinet.token';

export class ListHealthProfilesQuery {}

/** People A→Z in Vietnamese order ("Bố", "Mẹ", "Owner"), each with the count of items not deleted (R11.12). */
@QueryHandler(ListHealthProfilesQuery)
export class ListHealthProfilesHandler implements IQueryHandler<ListHealthProfilesQuery> {
  constructor(@Inject(HEALTH_PROFILE_REPOSITORY) private readonly profiles: IHealthProfileRepository) {}

  async execute(_query: ListHealthProfilesQuery): Promise<HealthProfileDto[]> {
    const rows = await this.profiles.findAllWithItemCount();
    return rows
      .map(({ profile, itemCount }) => MedicineCabinetPresenter.toProfile(profile, itemCount))
      .sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  }
}
