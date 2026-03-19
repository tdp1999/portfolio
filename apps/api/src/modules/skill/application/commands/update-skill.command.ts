import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import {
  ValidationError,
  NotFoundError,
  ConflictError,
  BadRequestError,
  ErrorLayer,
  SkillErrorCode,
} from '@portfolio/shared/errors';
import { IdentifierValue } from '@portfolio/shared/types';
import { BaseCommand } from '../../../../shared/cqrs/base.command';
import { ISkillRepository } from '../ports/skill.repository.port';
import { SKILL_REPOSITORY } from '../skill.token';
import { UpdateSkillSchema } from '../skill.dto';

export class UpdateSkillCommand extends BaseCommand {
  constructor(
    readonly skillId: string,
    readonly dto: unknown,
    userId: string
  ) {
    super(userId);
  }
}

@CommandHandler(UpdateSkillCommand)
export class UpdateSkillHandler implements ICommandHandler<UpdateSkillCommand> {
  constructor(@Inject(SKILL_REPOSITORY) private readonly repo: ISkillRepository) {}

  async execute(command: UpdateSkillCommand): Promise<void> {
    IdentifierValue.from(command.skillId);

    const { success, data, error } = UpdateSkillSchema.safeParse(command.dto);
    if (!success)
      throw ValidationError(error, {
        errorCode: SkillErrorCode.INVALID_INPUT,
        layer: ErrorLayer.APPLICATION,
        remarks: 'Skill update validation failed',
      });

    const skill = await this.repo.findById(command.skillId);
    if (!skill)
      throw NotFoundError('Skill not found', {
        errorCode: SkillErrorCode.NOT_FOUND,
        layer: ErrorLayer.APPLICATION,
      });

    if (data.name) {
      const existingWithName = await this.repo.findByName(data.name);
      if (existingWithName && existingWithName.id !== command.skillId)
        throw ConflictError('Skill with this name already exists', {
          errorCode: SkillErrorCode.NAME_TAKEN,
          layer: ErrorLayer.APPLICATION,
        });
    }

    let updated = skill.update(data, command.userId);

    if (data.parentSkillId !== undefined) {
      if (data.parentSkillId === null) {
        updated = updated.removeParent();
      } else {
        const parent = await this.repo.findById(data.parentSkillId);
        if (!parent)
          throw NotFoundError('Parent skill not found', {
            errorCode: SkillErrorCode.NOT_FOUND,
            layer: ErrorLayer.APPLICATION,
          });

        if (parent.isDeleted)
          throw BadRequestError('Parent skill is deleted', {
            errorCode: SkillErrorCode.PARENT_DELETED,
            layer: ErrorLayer.APPLICATION,
          });

        updated = updated.assignParent(data.parentSkillId, parent.parentSkillId !== null);
      }
    }

    await this.repo.update(command.skillId, updated);
  }
}
