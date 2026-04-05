import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { NotFoundError, ErrorLayer, ExperienceErrorCode } from '@portfolio/shared/errors';
import { IdentifierValue } from '@portfolio/shared/types';
import { BaseCommand } from '../../../../shared/cqrs/base.command';
import { IExperienceRepository } from '../ports/experience.repository.port';
import { EXPERIENCE_REPOSITORY } from '../experience.token';

export class DeleteExperienceCommand extends BaseCommand {
  constructor(
    readonly experienceId: string,
    userId: string
  ) {
    super(userId);
  }
}

@CommandHandler(DeleteExperienceCommand)
export class DeleteExperienceHandler implements ICommandHandler<DeleteExperienceCommand> {
  constructor(@Inject(EXPERIENCE_REPOSITORY) private readonly repo: IExperienceRepository) {}

  async execute(command: DeleteExperienceCommand): Promise<void> {
    IdentifierValue.from(command.experienceId);

    const experience = await this.repo.findById(command.experienceId);
    if (!experience)
      throw NotFoundError('Experience not found', {
        errorCode: ExperienceErrorCode.NOT_FOUND,
        layer: ErrorLayer.APPLICATION,
      });

    const deleted = experience.softDelete(command.userId);
    await this.repo.remove(command.experienceId, deleted);
  }
}
