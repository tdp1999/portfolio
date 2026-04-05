import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ValidationError, ErrorLayer, ExperienceErrorCode } from '@portfolio/shared/errors';
import { BaseCommand } from '../../../../shared/cqrs/base.command';
import { IExperienceRepository } from '../ports/experience.repository.port';
import { EXPERIENCE_REPOSITORY } from '../experience.token';
import { ReorderExperiencesSchema } from '../experience.dto';

export class ReorderExperiencesCommand extends BaseCommand {
  constructor(
    readonly dto: unknown,
    userId: string
  ) {
    super(userId);
  }
}

@CommandHandler(ReorderExperiencesCommand)
export class ReorderExperiencesHandler implements ICommandHandler<ReorderExperiencesCommand> {
  constructor(@Inject(EXPERIENCE_REPOSITORY) private readonly repo: IExperienceRepository) {}

  async execute(command: ReorderExperiencesCommand): Promise<void> {
    const { success, data, error } = ReorderExperiencesSchema.safeParse(command.dto);
    if (!success)
      throw ValidationError(error, {
        errorCode: ExperienceErrorCode.INVALID_INPUT,
        layer: ErrorLayer.APPLICATION,
        remarks: 'Reorder validation failed',
      });

    await this.repo.reorder(data);
  }
}
