import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ConflictError, ValidationError, ErrorLayer, TagErrorCode } from '@portfolio/shared/errors';
import { BaseCommand } from '../../../../shared/cqrs/base.command';
import { Tag } from '../../domain/entities/tag.entity';
import { ITagRepository } from '../ports/tag.repository.port';
import { TAG_REPOSITORY } from '../tag.token';
import { CreateTagSchema } from '../tag.dto';

export class CreateTagCommand extends BaseCommand {
  constructor(
    readonly dto: unknown,
    userId: string
  ) {
    super(userId);
  }
}

@CommandHandler(CreateTagCommand)
export class CreateTagHandler implements ICommandHandler<CreateTagCommand> {
  constructor(@Inject(TAG_REPOSITORY) private readonly repo: ITagRepository) {}

  async execute(command: CreateTagCommand): Promise<string> {
    const { success, data, error } = CreateTagSchema.safeParse(command.dto);
    if (!success)
      throw ValidationError(error, {
        errorCode: TagErrorCode.INVALID_INPUT,
        layer: ErrorLayer.APPLICATION,
        remarks: 'Tag creation validation failed',
      });

    const existing = await this.repo.findByName(data.name);
    if (existing)
      throw ConflictError('Tag with this name already exists', {
        errorCode: TagErrorCode.NAME_TAKEN,
        layer: ErrorLayer.APPLICATION,
      });

    const tag = Tag.create(data, command.userId);
    return this.repo.add(tag);
  }
}
