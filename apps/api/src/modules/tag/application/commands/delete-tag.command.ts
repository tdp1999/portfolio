import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { NotFoundError, BadRequestError, ErrorLayer, TagErrorCode } from '@portfolio/shared/errors';
import { IdentifierValue } from '@portfolio/shared/types';
import { BaseCommand } from '../../../../shared/cqrs/base.command';
import { ITagRepository } from '../ports/tag.repository.port';
import { TAG_REPOSITORY } from '../tag.token';

export class DeleteTagCommand extends BaseCommand {
  constructor(
    readonly tagId: string,
    userId: string
  ) {
    super(userId);
  }
}

@CommandHandler(DeleteTagCommand)
export class DeleteTagHandler implements ICommandHandler<DeleteTagCommand> {
  constructor(@Inject(TAG_REPOSITORY) private readonly repo: ITagRepository) {}

  async execute(command: DeleteTagCommand): Promise<void> {
    IdentifierValue.from(command.tagId);

    const tag = await this.repo.findById(command.tagId);
    if (!tag)
      throw NotFoundError('Tag not found', {
        errorCode: TagErrorCode.NOT_FOUND,
        layer: ErrorLayer.APPLICATION,
      });

    if (tag.isDeleted)
      throw BadRequestError('Tag is already deleted', {
        errorCode: TagErrorCode.ALREADY_DELETED,
        layer: ErrorLayer.APPLICATION,
      });

    const deleted = tag.softDelete(command.userId);
    await this.repo.remove(command.tagId, deleted);
  }
}
