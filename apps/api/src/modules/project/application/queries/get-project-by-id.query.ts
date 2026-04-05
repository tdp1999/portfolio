import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { NotFoundError, ErrorLayer, ProjectErrorCode } from '@portfolio/shared/errors';
import { IdentifierValue } from '@portfolio/shared/types';
import { IProjectRepository } from '../ports/project.repository.port';
import { PROJECT_REPOSITORY } from '../project.token';
import { ProjectPresenter, ProjectAdminResponseDto } from '../project.presenter';

export class GetProjectByIdQuery {
  constructor(readonly projectId: string) {}
}

@QueryHandler(GetProjectByIdQuery)
export class GetProjectByIdHandler implements IQueryHandler<GetProjectByIdQuery> {
  constructor(@Inject(PROJECT_REPOSITORY) private readonly repo: IProjectRepository) {}

  async execute(query: GetProjectByIdQuery): Promise<ProjectAdminResponseDto> {
    IdentifierValue.from(query.projectId);

    const result = await this.repo.findById(query.projectId);
    if (!result)
      throw NotFoundError('Project not found', {
        errorCode: ProjectErrorCode.NOT_FOUND,
        layer: ErrorLayer.APPLICATION,
      });

    return ProjectPresenter.toAdminResponse(result);
  }
}
