import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { IAboutFailureRepository } from '../ports/about-failure.repository.port';
import { ABOUT_FAILURE_REPOSITORY } from '../about-failure.token';
import { AboutFailureListResponse } from '../about-failure.dto';
import { AboutFailurePresenter } from '../about-failure.presenter';

export class ListAboutFailuresQuery {
  constructor(readonly options: { onlyPublished?: boolean } = {}) {}
}

@QueryHandler(ListAboutFailuresQuery)
export class ListAboutFailuresHandler implements IQueryHandler<ListAboutFailuresQuery> {
  constructor(@Inject(ABOUT_FAILURE_REPOSITORY) private readonly repo: IAboutFailureRepository) {}

  async execute(query: ListAboutFailuresQuery): Promise<AboutFailureListResponse> {
    const failures = await this.repo.findAll({ onlyPublished: query.options.onlyPublished });
    return { items: failures.map(AboutFailurePresenter.toResponse) };
  }
}
