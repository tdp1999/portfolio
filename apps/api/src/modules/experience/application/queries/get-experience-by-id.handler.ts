import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { NotFoundError, ErrorLayer, ExperienceErrorCode } from '@portfolio/shared/errors';
import { IExperienceRepository } from '../ports/experience.repository.port';
import { EXPERIENCE_REPOSITORY } from '../experience.token';
import { ISkillRepository } from '../../../skill/application/ports/skill.repository.port';
import { SKILL_REPOSITORY } from '../../../skill/application/skill.token';
import { IMediaRepository } from '../../../media/application/ports/media.repository.port';
import { MEDIA_REPOSITORY } from '../../../media/application/media.token';
import { ExperiencePresenter, ExperienceAdminResponseDto } from '../experience.presenter';
import { resolveSkills } from '../experience.helpers';

export class GetExperienceByIdQuery {
  constructor(readonly experienceId: string) {}
}

@QueryHandler(GetExperienceByIdQuery)
export class GetExperienceByIdHandler implements IQueryHandler<GetExperienceByIdQuery> {
  constructor(
    @Inject(EXPERIENCE_REPOSITORY) private readonly repo: IExperienceRepository,
    @Inject(SKILL_REPOSITORY) private readonly skillRepo: ISkillRepository,
    @Inject(MEDIA_REPOSITORY) private readonly mediaRepo: IMediaRepository
  ) {}

  async execute(query: GetExperienceByIdQuery): Promise<ExperienceAdminResponseDto> {
    const experience = await this.repo.findById(query.experienceId);
    if (!experience)
      throw NotFoundError('Experience not found', {
        errorCode: ExperienceErrorCode.NOT_FOUND,
        layer: ErrorLayer.APPLICATION,
      });

    const skills = await resolveSkills(experience.skillIds, this.skillRepo);
    const companyLogoUrl = experience.companyLogoId
      ? ((await this.mediaRepo.findById(experience.companyLogoId))?.url ?? null)
      : null;

    return ExperiencePresenter.toAdminResponse(experience, skills, companyLogoUrl);
  }
}
