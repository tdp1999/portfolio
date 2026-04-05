import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { IExperienceRepository } from '../ports/experience.repository.port';
import { EXPERIENCE_REPOSITORY } from '../experience.token';
import { ISkillRepository } from '../../../skill/application/ports/skill.repository.port';
import { SKILL_REPOSITORY } from '../../../skill/application/skill.token';
import { IMediaRepository } from '../../../media/application/ports/media.repository.port';
import { MEDIA_REPOSITORY } from '../../../media/application/media.token';
import { ExperiencePresenter, ExperiencePublicResponseDto } from '../experience.presenter';
import { resolveSkills } from '../experience.helpers';

export class ListPublicExperiencesQuery {}

@QueryHandler(ListPublicExperiencesQuery)
export class ListPublicExperiencesHandler implements IQueryHandler<ListPublicExperiencesQuery> {
  constructor(
    @Inject(EXPERIENCE_REPOSITORY) private readonly repo: IExperienceRepository,
    @Inject(SKILL_REPOSITORY) private readonly skillRepo: ISkillRepository,
    @Inject(MEDIA_REPOSITORY) private readonly mediaRepo: IMediaRepository
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async execute(_query: ListPublicExperiencesQuery): Promise<ExperiencePublicResponseDto[]> {
    const experiences = await this.repo.findAllPublic();

    const items = await Promise.all(
      experiences.map(async (exp) => {
        const skills = await resolveSkills(exp.skillIds, this.skillRepo);
        const companyLogoUrl = exp.companyLogoId
          ? ((await this.mediaRepo.findById(exp.companyLogoId))?.url ?? null)
          : null;
        return { experience: exp, skills, companyLogoUrl };
      })
    );

    return ExperiencePresenter.toPublicListResponse(items);
  }
}
