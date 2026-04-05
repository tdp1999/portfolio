import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import {
  ValidationError,
  BadRequestError,
  NotFoundError,
  ErrorLayer,
  ExperienceErrorCode,
} from '@portfolio/shared/errors';
import { IdentifierValue } from '@portfolio/shared/types';
import { IUpdateExperiencePayload } from '../../domain/experience.types';
import { BaseCommand } from '../../../../shared/cqrs/base.command';
import { IExperienceRepository } from '../ports/experience.repository.port';
import { EXPERIENCE_REPOSITORY } from '../experience.token';
import { ISkillRepository } from '../../../skill/application/ports/skill.repository.port';
import { SKILL_REPOSITORY } from '../../../skill/application/skill.token';
import { IMediaRepository } from '../../../media/application/ports/media.repository.port';
import { MEDIA_REPOSITORY } from '../../../media/application/media.token';
import { UpdateExperienceSchema } from '../experience.dto';

export class UpdateExperienceCommand extends BaseCommand {
  constructor(
    readonly experienceId: string,
    readonly dto: unknown,
    userId: string
  ) {
    super(userId);
  }
}

@CommandHandler(UpdateExperienceCommand)
export class UpdateExperienceHandler implements ICommandHandler<UpdateExperienceCommand> {
  constructor(
    @Inject(EXPERIENCE_REPOSITORY) private readonly repo: IExperienceRepository,
    @Inject(SKILL_REPOSITORY) private readonly skillRepo: ISkillRepository,
    @Inject(MEDIA_REPOSITORY) private readonly mediaRepo: IMediaRepository
  ) {}

  async execute(command: UpdateExperienceCommand): Promise<void> {
    IdentifierValue.from(command.experienceId);

    const { success, data, error } = UpdateExperienceSchema.safeParse(command.dto);
    if (!success)
      throw ValidationError(error, {
        errorCode: ExperienceErrorCode.INVALID_INPUT,
        layer: ErrorLayer.APPLICATION,
        remarks: 'Experience update validation failed',
      });

    const experience = await this.repo.findById(command.experienceId);
    if (!experience)
      throw NotFoundError('Experience not found', {
        errorCode: ExperienceErrorCode.NOT_FOUND,
        layer: ErrorLayer.APPLICATION,
      });

    if (data.skillIds && data.skillIds.length > 0) {
      const skills = await Promise.all(data.skillIds.map((id) => this.skillRepo.findById(id)));
      const missingId = data.skillIds.find((id, i) => !skills[i]);
      if (missingId)
        throw BadRequestError(`Skill not found: ${missingId}`, {
          errorCode: ExperienceErrorCode.INVALID_INPUT,
          layer: ErrorLayer.APPLICATION,
        });
    }

    if (data.companyLogoId) {
      const media = await this.mediaRepo.findById(data.companyLogoId);
      if (!media)
        throw NotFoundError('Company logo media not found', {
          errorCode: ExperienceErrorCode.INVALID_INPUT,
          layer: ErrorLayer.APPLICATION,
        });
    }

    const updated = experience.update(data as IUpdateExperiencePayload, command.userId);
    await this.repo.update(command.experienceId, updated, data.skillIds ?? experience.skillIds);
  }
}
