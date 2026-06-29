import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { IProjectRepository } from '../ports/project.repository.port';
import { PROJECT_REPOSITORY } from '../project.token';
import { ProjectPresenter, ProjectDetailDto } from '../project.presenter';

export class ListFeaturedProjectsQuery {}

@QueryHandler(ListFeaturedProjectsQuery)
export class ListFeaturedProjectsHandler implements IQueryHandler<ListFeaturedProjectsQuery> {
  constructor(@Inject(PROJECT_REPOSITORY) private readonly repo: IProjectRepository) {}

  async execute(): Promise<ProjectDetailDto[]> {
    const results = await this.repo.findFeatured();
    // Featured cards don't render the case-study body, so no image-ref resolution
    // is needed — mediaRefs defaults to empty.
    return results.map((p) => ProjectPresenter.toDetail(p));
  }
}
