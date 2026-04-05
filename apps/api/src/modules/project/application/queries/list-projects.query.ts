import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ValidationError, ErrorLayer, ProjectErrorCode } from '@portfolio/shared/errors';
import { IProjectRepository } from '../ports/project.repository.port';
import { PROJECT_REPOSITORY } from '../project.token';
import { ListProjectsSchema } from '../project.dto';
import { ProjectPresenter, ProjectAdminResponseDto } from '../project.presenter';

export class ListProjectsQuery {
  constructor(readonly dto: unknown) {}
}

@QueryHandler(ListProjectsQuery)
export class ListProjectsHandler implements IQueryHandler<ListProjectsQuery> {
  constructor(@Inject(PROJECT_REPOSITORY) private readonly repo: IProjectRepository) {}

  async execute(query: ListProjectsQuery): Promise<{ data: ProjectAdminResponseDto[]; total: number }> {
    const { success, data, error } = ListProjectsSchema.safeParse(query.dto);
    if (!success)
      throw ValidationError(error, {
        errorCode: ProjectErrorCode.NOT_FOUND,
        layer: ErrorLayer.APPLICATION,
        remarks: 'List projects validation failed',
      });

    const result = await this.repo.findAll(data);

    return {
      data: result.data.map(ProjectPresenter.toAdminResponse),
      total: result.total,
    };
  }
}
