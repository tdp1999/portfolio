import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { NotFoundError, ErrorLayer, SkillErrorCode } from '@portfolio/shared/errors';
import { IdentifierValue } from '@portfolio/shared/types';
import { ISkillRepository } from '../ports/skill.repository.port';
import { SKILL_REPOSITORY } from '../skill.token';
import { SkillResponseDto } from '../skill.dto';
import { SkillPresenter } from '../skill.presenter';

export class GetSkillByIdQuery {
  constructor(readonly skillId: string) {}
}

@QueryHandler(GetSkillByIdQuery)
export class GetSkillByIdHandler implements IQueryHandler<GetSkillByIdQuery> {
  constructor(@Inject(SKILL_REPOSITORY) private readonly repo: ISkillRepository) {}

  async execute(query: GetSkillByIdQuery): Promise<SkillResponseDto> {
    IdentifierValue.from(query.skillId);

    const skill = await this.repo.findById(query.skillId);
    if (!skill)
      throw NotFoundError('Skill not found', {
        errorCode: SkillErrorCode.NOT_FOUND,
        layer: ErrorLayer.APPLICATION,
      });

    return SkillPresenter.toResponse(skill);
  }
}
