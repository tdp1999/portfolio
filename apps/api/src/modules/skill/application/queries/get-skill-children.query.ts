import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { NotFoundError, ErrorLayer, SkillErrorCode } from '@portfolio/shared/errors';
import { IdentifierValue } from '@portfolio/shared/types';
import { ISkillRepository } from '../ports/skill.repository.port';
import { SKILL_REPOSITORY } from '../skill.token';
import { SkillResponseDto } from '../skill.dto';
import { SkillPresenter } from '../skill.presenter';

export class GetSkillChildrenQuery {
  constructor(readonly parentId: string) {}
}

@QueryHandler(GetSkillChildrenQuery)
export class GetSkillChildrenHandler implements IQueryHandler<GetSkillChildrenQuery> {
  constructor(@Inject(SKILL_REPOSITORY) private readonly repo: ISkillRepository) {}

  async execute(query: GetSkillChildrenQuery): Promise<SkillResponseDto[]> {
    IdentifierValue.from(query.parentId);

    const parent = await this.repo.findById(query.parentId);
    if (!parent)
      throw NotFoundError('Parent skill not found', {
        errorCode: SkillErrorCode.NOT_FOUND,
        layer: ErrorLayer.APPLICATION,
      });

    const children = await this.repo.findChildren(query.parentId);
    return children.map(SkillPresenter.toResponse);
  }
}
