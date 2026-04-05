import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ValidationError, ErrorLayer, ProjectErrorCode } from '@portfolio/shared/errors';
import { BaseCommand } from '../../../../shared/cqrs/base.command';
import { IProjectRepository } from '../ports/project.repository.port';
import { PROJECT_REPOSITORY } from '../project.token';
import { ReorderProjectsSchema } from '../project.dto';

export class ReorderProjectsCommand extends BaseCommand {
  constructor(
    readonly dto: unknown,
    userId: string
  ) {
    super(userId);
  }
}

@CommandHandler(ReorderProjectsCommand)
export class ReorderProjectsHandler implements ICommandHandler<ReorderProjectsCommand> {
  constructor(@Inject(PROJECT_REPOSITORY) private readonly repo: IProjectRepository) {}

  async execute(command: ReorderProjectsCommand): Promise<void> {
    const { success, data, error } = ReorderProjectsSchema.safeParse(command.dto);
    if (!success)
      throw ValidationError(error, {
        errorCode: ProjectErrorCode.NOT_FOUND,
        layer: ErrorLayer.APPLICATION,
        remarks: 'Reorder validation failed',
      });

    await this.repo.batchUpdateOrder(data);
  }
}
