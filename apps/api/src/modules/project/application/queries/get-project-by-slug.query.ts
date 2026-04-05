import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { NotFoundError, ErrorLayer, ProjectErrorCode } from '@portfolio/shared/errors';
import { IProjectRepository } from '../ports/project.repository.port';
import { PROJECT_REPOSITORY } from '../project.token';
import { ProjectPresenter, ProjectDetailDto } from '../project.presenter';

export class GetProjectBySlugQuery {
  constructor(readonly slug: string) {}
}

@QueryHandler(GetProjectBySlugQuery)
export class GetProjectBySlugHandler implements IQueryHandler<GetProjectBySlugQuery> {
  constructor(@Inject(PROJECT_REPOSITORY) private readonly repo: IProjectRepository) {}

  async execute(query: GetProjectBySlugQuery): Promise<ProjectDetailDto> {
    const result = await this.repo.findBySlug(query.slug);
    if (!result)
      throw NotFoundError('Project not found', {
        errorCode: ProjectErrorCode.NOT_FOUND,
        layer: ErrorLayer.APPLICATION,
      });

    return ProjectPresenter.toDetail(result);
  }
}
