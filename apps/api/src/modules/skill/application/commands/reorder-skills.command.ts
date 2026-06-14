import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ValidationError, ErrorLayer, SkillErrorCode } from '@portfolio/shared/errors';
import { BaseCommand } from '../../../../shared/cqrs/base.command';
import { ISkillRepository } from '../ports/skill.repository.port';
import { SKILL_REPOSITORY } from '../skill.token';
import { ReorderSkillsSchema } from '../skill.dto';

export class ReorderSkillsCommand extends BaseCommand {
  constructor(
    readonly dto: unknown,
    userId: string
  ) {
    super(userId);
  }
}

@CommandHandler(ReorderSkillsCommand)
export class ReorderSkillsHandler implements ICommandHandler<ReorderSkillsCommand> {
  constructor(@Inject(SKILL_REPOSITORY) private readonly repo: ISkillRepository) {}

  async execute(command: ReorderSkillsCommand): Promise<void> {
    const { success, data, error } = ReorderSkillsSchema.safeParse(command.dto);
    if (!success)
      throw ValidationError(error, {
        errorCode: SkillErrorCode.INVALID_INPUT,
        layer: ErrorLayer.APPLICATION,
        remarks: 'Reorder validation failed',
      });

    await this.repo.reorder(data);
  }
}
