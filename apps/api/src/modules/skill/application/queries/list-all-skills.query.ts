import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ISkillRepository } from '../ports/skill.repository.port';
import { SKILL_REPOSITORY } from '../skill.token';
import { SkillResponseDto } from '../skill.dto';
import { SkillPresenter } from '../skill.presenter';

export class ListAllSkillsQuery {}

@QueryHandler(ListAllSkillsQuery)
export class ListAllSkillsHandler implements IQueryHandler<ListAllSkillsQuery> {
  constructor(@Inject(SKILL_REPOSITORY) private readonly repo: ISkillRepository) {}

  async execute(): Promise<SkillResponseDto[]> {
    const skills = await this.repo.findAllNoLimit();
    return skills.map(SkillPresenter.toResponse);
  }
}
