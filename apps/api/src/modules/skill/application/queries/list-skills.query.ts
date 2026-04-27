import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ValidationError, ErrorLayer, SkillErrorCode } from '@portfolio/shared/errors';
import { ISkillRepository } from '../ports/skill.repository.port';
import { SKILL_REPOSITORY } from '../skill.token';
import { SkillQuerySchema, SkillResponseDto } from '../skill.dto';
import { SkillPresenter } from '../skill.presenter';

export class ListSkillsQuery {
  constructor(readonly params: unknown) {}
}

@QueryHandler(ListSkillsQuery)
export class ListSkillsHandler implements IQueryHandler<ListSkillsQuery> {
  constructor(@Inject(SKILL_REPOSITORY) private readonly repo: ISkillRepository) {}

  async execute(
    query: ListSkillsQuery
  ): Promise<{ data: SkillResponseDto[]; total: number; page: number; limit: number }> {
    const { success, data, error } = SkillQuerySchema.safeParse(query.params);
    if (!success)
      throw ValidationError(error, {
        errorCode: SkillErrorCode.INVALID_INPUT,
        layer: ErrorLayer.APPLICATION,
        remarks: 'List skills pagination validation failed',
      });

    const { data: skills, total } = await this.repo.findAll({
      page: data.page,
      limit: data.limit,
      search: data.search,
      category: data.category,
      isLibrary: data.isLibrary,
      parentSkillId: data.parentSkillId,
      includeDeleted: data.includeDeleted,
      sortBy: data.sortBy,
      sortDir: data.sortDir,
    });

    return {
      data: skills.map(SkillPresenter.toResponse),
      total,
      page: data.page,
      limit: data.limit,
    };
  }
}
