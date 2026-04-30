import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import {
  NotFoundError,
  BadRequestError,
  ConflictError,
  ErrorLayer,
  ExperienceErrorCode,
} from '@portfolio/shared/errors';
import { IdentifierValue } from '@portfolio/shared/types';
import { BaseCommand } from '../../../../shared/cqrs/base.command';
import { IExperienceRepository } from '../ports/experience.repository.port';
import { EXPERIENCE_REPOSITORY } from '../experience.token';

export class RestoreExperienceCommand extends BaseCommand {
  constructor(
    readonly experienceId: string,
    userId: string
  ) {
    super(userId);
  }
}

@CommandHandler(RestoreExperienceCommand)
export class RestoreExperienceHandler implements ICommandHandler<RestoreExperienceCommand> {
  constructor(@Inject(EXPERIENCE_REPOSITORY) private readonly repo: IExperienceRepository) {}

  async execute(command: RestoreExperienceCommand): Promise<void> {
    IdentifierValue.from(command.experienceId);

    const experience = await this.repo.findByIdIncludeDeleted(command.experienceId);
    if (!experience)
      throw NotFoundError('Experience not found', {
        errorCode: ExperienceErrorCode.NOT_FOUND,
        layer: ErrorLayer.APPLICATION,
      });

    if (!experience.isDeleted)
      throw BadRequestError('Experience is not deleted', {
        errorCode: ExperienceErrorCode.NOT_DELETED,
        layer: ErrorLayer.APPLICATION,
      });

    if (await this.repo.slugExists(experience.slug))
      throw ConflictError('Cannot restore: another active experience already uses this slug', {
        errorCode: ExperienceErrorCode.SLUG_TAKEN,
        layer: ErrorLayer.APPLICATION,
      });

    const restored = experience.restore(command.userId);
    await this.repo.restore(command.experienceId, restored);
  }
}
