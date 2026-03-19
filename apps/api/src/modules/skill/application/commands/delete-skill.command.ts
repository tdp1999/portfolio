import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { NotFoundError, BadRequestError, ErrorLayer, SkillErrorCode } from '@portfolio/shared/errors';
import { IdentifierValue } from '@portfolio/shared/types';
import { BaseCommand } from '../../../../shared/cqrs/base.command';
import { ISkillRepository } from '../ports/skill.repository.port';
import { SKILL_REPOSITORY } from '../skill.token';

export class DeleteSkillCommand extends BaseCommand {
  constructor(
    readonly skillId: string,
    userId: string
  ) {
    super(userId);
  }
}

@CommandHandler(DeleteSkillCommand)
export class DeleteSkillHandler implements ICommandHandler<DeleteSkillCommand> {
  constructor(@Inject(SKILL_REPOSITORY) private readonly repo: ISkillRepository) {}

  async execute(command: DeleteSkillCommand): Promise<void> {
    IdentifierValue.from(command.skillId);

    const skill = await this.repo.findById(command.skillId);
    if (!skill)
      throw NotFoundError('Skill not found', {
        errorCode: SkillErrorCode.NOT_FOUND,
        layer: ErrorLayer.APPLICATION,
      });

    if (skill.isDeleted)
      throw BadRequestError('Skill is already deleted', {
        errorCode: SkillErrorCode.ALREADY_DELETED,
        layer: ErrorLayer.APPLICATION,
      });

    const hasChildren = await this.repo.hasChildren(command.skillId);
    if (hasChildren)
      throw BadRequestError('Cannot delete skill with child skills', {
        errorCode: SkillErrorCode.HAS_CHILDREN,
        layer: ErrorLayer.APPLICATION,
      });

    const deleted = skill.softDelete(command.userId);
    await this.repo.remove(command.skillId, deleted);
  }
}
