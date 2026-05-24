import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { IAboutPrincipleRepository } from '../ports/about-principle.repository.port';
import { ABOUT_PRINCIPLE_REPOSITORY } from '../about-principle.token';
import { AboutPrincipleListResponse } from '../about-principle.dto';
import { AboutPrinciplePresenter } from '../about-principle.presenter';

export class ListAboutPrinciplesQuery {
  constructor(readonly options: { onlyPublished?: boolean } = {}) {}
}

@QueryHandler(ListAboutPrinciplesQuery)
export class ListAboutPrinciplesHandler implements IQueryHandler<ListAboutPrinciplesQuery> {
  constructor(@Inject(ABOUT_PRINCIPLE_REPOSITORY) private readonly repo: IAboutPrincipleRepository) {}

  async execute(query: ListAboutPrinciplesQuery): Promise<AboutPrincipleListResponse> {
    const principles = await this.repo.findAll({ onlyPublished: query.options.onlyPublished });
    return { items: principles.map(AboutPrinciplePresenter.toResponse) };
  }
}
