import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { NotFoundError, ErrorLayer, SkillErrorCode } from '@portfolio/shared/errors';
import { ISkillRepository } from '../ports/skill.repository.port';
import { SKILL_REPOSITORY } from '../skill.token';
import { SkillResponseDto } from '../skill.dto';
import { SkillPresenter } from '../skill.presenter';

export class GetSkillBySlugQuery {
  constructor(readonly slug: string) {}
}

@QueryHandler(GetSkillBySlugQuery)
export class GetSkillBySlugHandler implements IQueryHandler<GetSkillBySlugQuery> {
  constructor(@Inject(SKILL_REPOSITORY) private readonly repo: ISkillRepository) {}

  async execute(query: GetSkillBySlugQuery): Promise<SkillResponseDto> {
    const skill = await this.repo.findBySlug(query.slug);
    if (!skill)
      throw NotFoundError('Skill not found', {
        errorCode: SkillErrorCode.NOT_FOUND,
        layer: ErrorLayer.APPLICATION,
      });

    return SkillPresenter.toResponse(skill);
  }
}
