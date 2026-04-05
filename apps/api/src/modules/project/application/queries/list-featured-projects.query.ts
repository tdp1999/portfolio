import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { IProjectRepository } from '../ports/project.repository.port';
import { PROJECT_REPOSITORY } from '../project.token';
import { ProjectPresenter, ProjectListItemDto } from '../project.presenter';

export class ListFeaturedProjectsQuery {}

@QueryHandler(ListFeaturedProjectsQuery)
export class ListFeaturedProjectsHandler implements IQueryHandler<ListFeaturedProjectsQuery> {
  constructor(@Inject(PROJECT_REPOSITORY) private readonly repo: IProjectRepository) {}

  async execute(): Promise<ProjectListItemDto[]> {
    const results = await this.repo.findFeatured();
    return results.map(ProjectPresenter.toListItem);
  }
}
