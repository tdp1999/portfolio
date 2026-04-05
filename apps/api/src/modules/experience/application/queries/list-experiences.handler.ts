import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ValidationError, ErrorLayer, ExperienceErrorCode } from '@portfolio/shared/errors';
import { PaginatedResult } from '@portfolio/shared/types';
import { IExperienceRepository } from '../ports/experience.repository.port';
import { EXPERIENCE_REPOSITORY } from '../experience.token';
import { ISkillRepository } from '../../../skill/application/ports/skill.repository.port';
import { SKILL_REPOSITORY } from '../../../skill/application/skill.token';
import { IMediaRepository } from '../../../media/application/ports/media.repository.port';
import { MEDIA_REPOSITORY } from '../../../media/application/media.token';
import { ListExperiencesSchema } from '../experience.dto';
import { ExperiencePresenter, ExperienceAdminResponseDto } from '../experience.presenter';
import { resolveSkills } from '../experience.helpers';

export class ListExperiencesQuery {
  constructor(readonly params: unknown) {}
}

@QueryHandler(ListExperiencesQuery)
export class ListExperiencesHandler implements IQueryHandler<ListExperiencesQuery> {
  constructor(
    @Inject(EXPERIENCE_REPOSITORY) private readonly repo: IExperienceRepository,
    @Inject(SKILL_REPOSITORY) private readonly skillRepo: ISkillRepository,
    @Inject(MEDIA_REPOSITORY) private readonly mediaRepo: IMediaRepository
  ) {}

  async execute(
    query: ListExperiencesQuery
  ): Promise<PaginatedResult<ExperienceAdminResponseDto> & { page: number; limit: number }> {
    const { success, data, error } = ListExperiencesSchema.safeParse(query.params);
    if (!success)
      throw ValidationError(error, {
        errorCode: ExperienceErrorCode.INVALID_INPUT,
        layer: ErrorLayer.APPLICATION,
        remarks: 'List experiences validation failed',
      });

    const { data: experiences, total } = await this.repo.findAll({
      page: data.page,
      limit: data.limit,
      search: data.search,
      employmentType: data.employmentType,
      locationType: data.locationType,
      includeDeleted: data.includeDeleted,
    });

    const items = await Promise.all(
      experiences.map(async (exp) => {
        const skills = await resolveSkills(exp.skillIds, this.skillRepo);
        const companyLogoUrl = exp.companyLogoId
          ? ((await this.mediaRepo.findById(exp.companyLogoId))?.url ?? null)
          : null;
        return { experience: exp, skills, companyLogoUrl };
      })
    );

    const { data: responseData, total: responseTotal } = ExperiencePresenter.toAdminListResponse(items, total);

    return {
      data: responseData,
      total: responseTotal,
      page: data.page,
      limit: data.limit,
    };
  }
}
