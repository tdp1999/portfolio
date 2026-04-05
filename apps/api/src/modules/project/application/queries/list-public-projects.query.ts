import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { IProjectRepository } from '../ports/project.repository.port';
import { PROJECT_REPOSITORY } from '../project.token';
import { ProjectPresenter, ProjectListItemDto } from '../project.presenter';

export class ListPublicProjectsQuery {}

@QueryHandler(ListPublicProjectsQuery)
export class ListPublicProjectsHandler implements IQueryHandler<ListPublicProjectsQuery> {
  constructor(@Inject(PROJECT_REPOSITORY) private readonly repo: IProjectRepository) {}

  async execute(): Promise<ProjectListItemDto[]> {
    const results = await this.repo.findPublished();
    return results.map(ProjectPresenter.toListItem);
  }
}
