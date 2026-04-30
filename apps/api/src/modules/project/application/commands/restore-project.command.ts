import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { NotFoundError, BadRequestError, ConflictError, ErrorLayer, ProjectErrorCode } from '@portfolio/shared/errors';
import { IdentifierValue } from '@portfolio/shared/types';
import { BaseCommand } from '../../../../shared/cqrs/base.command';
import { IProjectRepository } from '../ports/project.repository.port';
import { PROJECT_REPOSITORY } from '../project.token';

export class RestoreProjectCommand extends BaseCommand {
  constructor(
    readonly projectId: string,
    userId: string
  ) {
    super(userId);
  }
}

@CommandHandler(RestoreProjectCommand)
export class RestoreProjectHandler implements ICommandHandler<RestoreProjectCommand> {
  constructor(@Inject(PROJECT_REPOSITORY) private readonly repo: IProjectRepository) {}

  async execute(command: RestoreProjectCommand): Promise<void> {
    IdentifierValue.from(command.projectId);

    const result = await this.repo.findByIdIncludeDeleted(command.projectId);
    if (!result)
      throw NotFoundError('Project not found', {
        errorCode: ProjectErrorCode.NOT_FOUND,
        layer: ErrorLayer.APPLICATION,
      });

    if (!result.entity.isDeleted)
      throw BadRequestError('Project is not deleted', {
        errorCode: ProjectErrorCode.NOT_FOUND,
        layer: ErrorLayer.APPLICATION,
      });

    if (await this.repo.slugExists(result.entity.slug))
      throw ConflictError('Cannot restore: another active project already uses this slug', {
        errorCode: ProjectErrorCode.SLUG_CONFLICT,
        layer: ErrorLayer.APPLICATION,
      });

    const restored = result.entity.restore(command.userId);
    await this.repo.restore(command.projectId, restored);
  }
}
