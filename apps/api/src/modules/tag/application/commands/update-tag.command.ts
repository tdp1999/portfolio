import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ValidationError, NotFoundError, ConflictError, ErrorLayer, TagErrorCode } from '@portfolio/shared/errors';
import { IdentifierValue } from '@portfolio/shared/types';
import { BaseCommand } from '../../../../shared/cqrs/base.command';
import { ITagRepository } from '../ports/tag.repository.port';
import { TAG_REPOSITORY } from '../tag.token';
import { UpdateTagSchema } from '../tag.dto';

export class UpdateTagCommand extends BaseCommand {
  constructor(
    readonly tagId: string,
    readonly dto: unknown,
    userId: string
  ) {
    super(userId);
  }
}

@CommandHandler(UpdateTagCommand)
export class UpdateTagHandler implements ICommandHandler<UpdateTagCommand> {
  constructor(@Inject(TAG_REPOSITORY) private readonly repo: ITagRepository) {}

  async execute(command: UpdateTagCommand): Promise<void> {
    IdentifierValue.from(command.tagId);

    const { success, data, error } = UpdateTagSchema.safeParse(command.dto);
    if (!success)
      throw ValidationError(error, {
        errorCode: TagErrorCode.INVALID_INPUT,
        layer: ErrorLayer.APPLICATION,
        remarks: 'Tag update validation failed',
      });

    const tag = await this.repo.findById(command.tagId);
    if (!tag)
      throw NotFoundError('Tag not found', {
        errorCode: TagErrorCode.NOT_FOUND,
        layer: ErrorLayer.APPLICATION,
      });

    const existingWithName = await this.repo.findByName(data.name);
    if (existingWithName && existingWithName.id !== command.tagId)
      throw ConflictError('Tag with this name already exists', {
        errorCode: TagErrorCode.NAME_TAKEN,
        layer: ErrorLayer.APPLICATION,
      });

    const updated = tag.update(data, command.userId);
    await this.repo.update(command.tagId, updated);
  }
}
