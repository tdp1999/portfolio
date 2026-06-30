import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import {
  ValidationError,
  BadRequestError,
  NotFoundError,
  ErrorLayer,
  ExperienceErrorCode,
} from '@portfolio/shared/errors';
import { SlugValue } from '@portfolio/shared/types';
import { ICreateExperiencePayload } from '../../domain/experience.types';
import { BaseCommand } from '../../../../shared/cqrs/base.command';
import { Experience } from '../../domain/entities/experience.entity';
import { IExperienceRepository } from '../ports/experience.repository.port';
import { EXPERIENCE_REPOSITORY } from '../experience.token';
import { ISkillRepository } from '../../../skill/application/ports/skill.repository.port';
import { SKILL_REPOSITORY } from '../../../skill/application/skill.token';
import { IMediaRepository } from '../../../media/application/ports/media.repository.port';
import { MEDIA_REPOSITORY } from '../../../media/application/media.token';
import { CreateExperienceSchema } from '../experience.dto';
import { RichTextService } from '../../../rich-text';

export class CreateExperienceCommand extends BaseCommand {
  constructor(
    readonly dto: unknown,
    userId: string
  ) {
    super(userId);
  }
}

@CommandHandler(CreateExperienceCommand)
export class CreateExperienceHandler implements ICommandHandler<CreateExperienceCommand> {
  constructor(
    @Inject(EXPERIENCE_REPOSITORY) private readonly repo: IExperienceRepository,
    @Inject(SKILL_REPOSITORY) private readonly skillRepo: ISkillRepository,
    @Inject(MEDIA_REPOSITORY) private readonly mediaRepo: IMediaRepository,
    private readonly richText: RichTextService
  ) {}

  async execute(command: CreateExperienceCommand): Promise<string> {
    const { success, data, error } = CreateExperienceSchema.safeParse(command.dto);
    if (!success)
      throw ValidationError(error, {
        errorCode: ExperienceErrorCode.INVALID_INPUT,
        layer: ErrorLayer.APPLICATION,
        remarks: 'Experience creation validation failed',
      });

    if (data.skillIds.length > 0) {
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

    const baseSlug = SlugValue.from(`${data.companyName} ${data.position.en}`);
    let candidateSlug = baseSlug;
    let counter = 2;
    while (await this.repo.slugExists(candidateSlug)) {
      candidateSlug = `${baseSlug}-${counter++}`;
    }

    const entity = Experience.create(data as ICreateExperiencePayload, command.userId);
    let finalEntity =
      candidateSlug !== baseSlug ? Experience.load({ ...entity.toProps(), slug: candidateSlug }) : entity;

    // Rich-text write path: canonicalize each provided prose field and apply it.
    if (data.descriptionJson) {
      const rich = await this.richText.toCanonicalFormTranslatable(data.descriptionJson, 'experience.description');
      finalEntity = finalEntity.withDescriptionRichText(rich, command.userId);
    }
    if (data.responsibilitiesJson) {
      const rich = await this.richText.toCanonicalFormTranslatable(
        data.responsibilitiesJson,
        'experience.responsibilities'
      );
      finalEntity = finalEntity.withResponsibilitiesRichText(rich, command.userId);
    }
    if (data.highlightsJson) {
      const rich = await this.richText.toCanonicalFormTranslatable(data.highlightsJson, 'experience.highlights');
      finalEntity = finalEntity.withHighlightsRichText(rich, command.userId);
    }

    return this.repo.add(finalEntity, data.skillIds);
  }
}
