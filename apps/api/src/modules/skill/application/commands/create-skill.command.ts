import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import {
  ConflictError,
  NotFoundError,
  BadRequestError,
  ValidationError,
  ErrorLayer,
  SkillErrorCode,
} from '@portfolio/shared/errors';
import { BaseCommand } from '../../../../shared/cqrs/base.command';
import { Skill } from '../../domain/entities/skill.entity';
import { ISkillRepository } from '../ports/skill.repository.port';
import { SKILL_REPOSITORY } from '../skill.token';
import { CreateSkillSchema } from '../skill.dto';

export class CreateSkillCommand extends BaseCommand {
  constructor(
    readonly dto: unknown,
    userId: string
  ) {
    super(userId);
  }
}

@CommandHandler(CreateSkillCommand)
export class CreateSkillHandler implements ICommandHandler<CreateSkillCommand> {
  constructor(@Inject(SKILL_REPOSITORY) private readonly repo: ISkillRepository) {}

  async execute(command: CreateSkillCommand): Promise<string> {
    const { success, data, error } = CreateSkillSchema.safeParse(command.dto);
    if (!success)
      throw ValidationError(error, {
        errorCode: SkillErrorCode.INVALID_INPUT,
        layer: ErrorLayer.APPLICATION,
        remarks: 'Skill creation validation failed',
      });

    const existing = await this.repo.findByName(data.name);
    if (existing)
      throw ConflictError('Skill with this name already exists', {
        errorCode: SkillErrorCode.NAME_TAKEN,
        layer: ErrorLayer.APPLICATION,
      });

    const skill = Skill.create(data, command.userId);

    if (data.parentSkillId) {
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

      const withParent = skill.assignParent(data.parentSkillId, parent.parentSkillId !== null);
      return this.repo.add(withParent);
    }

    return this.repo.add(skill);
  }
}
