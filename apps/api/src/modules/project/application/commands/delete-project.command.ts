import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { NotFoundError, ErrorLayer, ProjectErrorCode } from '@portfolio/shared/errors';
import { IdentifierValue } from '@portfolio/shared/types';
import { BaseCommand } from '../../../../shared/cqrs/base.command';
import { IProjectRepository } from '../ports/project.repository.port';
import { PROJECT_REPOSITORY } from '../project.token';

export class DeleteProjectCommand extends BaseCommand {
  constructor(
    readonly projectId: string,
    userId: string
  ) {
    super(userId);
  }
}

@CommandHandler(DeleteProjectCommand)
export class DeleteProjectHandler implements ICommandHandler<DeleteProjectCommand> {
  constructor(@Inject(PROJECT_REPOSITORY) private readonly repo: IProjectRepository) {}

  async execute(command: DeleteProjectCommand): Promise<void> {
    IdentifierValue.from(command.projectId);

    const result = await this.repo.findById(command.projectId);
    if (!result)
      throw NotFoundError('Project not found', {
        errorCode: ProjectErrorCode.NOT_FOUND,
        layer: ErrorLayer.APPLICATION,
      });

    const deleted = result.entity.softDelete(command.userId);
    await this.repo.softDelete(command.projectId, deleted);
  }
}
