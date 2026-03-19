import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { NotFoundError, BadRequestError, ErrorLayer, SkillErrorCode } from '@portfolio/shared/errors';
import { IdentifierValue } from '@portfolio/shared/types';
import { BaseCommand } from '../../../../shared/cqrs/base.command';
import { ISkillRepository } from '../ports/skill.repository.port';
import { SKILL_REPOSITORY } from '../skill.token';

export class RestoreSkillCommand extends BaseCommand {
  constructor(
    readonly skillId: string,
    userId: string
  ) {
    super(userId);
  }
}

@CommandHandler(RestoreSkillCommand)
export class RestoreSkillHandler implements ICommandHandler<RestoreSkillCommand> {
  constructor(@Inject(SKILL_REPOSITORY) private readonly repo: ISkillRepository) {}

  async execute(command: RestoreSkillCommand): Promise<void> {
    IdentifierValue.from(command.skillId);

    const skill = await this.repo.findById(command.skillId);
    if (!skill)
      throw NotFoundError('Skill not found', {
        errorCode: SkillErrorCode.NOT_FOUND,
        layer: ErrorLayer.APPLICATION,
      });

    if (skill.parentSkillId) {
      const parent = await this.repo.findById(skill.parentSkillId);
      if (!parent || parent.isDeleted)
        throw BadRequestError('Parent skill is deleted or no longer exists', {
          errorCode: SkillErrorCode.PARENT_DELETED,
          layer: ErrorLayer.APPLICATION,
        });
    }

    const restored = skill.restore(command.userId);
    await this.repo.update(command.skillId, restored);
  }
}
