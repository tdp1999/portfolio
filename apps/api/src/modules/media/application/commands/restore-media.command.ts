import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { NotFoundError, ErrorLayer, MediaErrorCode } from '@portfolio/shared/errors';
import { IdentifierValue } from '@portfolio/shared/types';
import { BaseCommand } from '../../../../shared/cqrs/base.command';
import { IMediaRepository } from '../ports/media.repository.port';
import { MEDIA_REPOSITORY } from '../media.token';

export class RestoreMediaCommand extends BaseCommand {
  constructor(
    readonly mediaId: string,
    userId: string
  ) {
    super(userId);
  }
}

@CommandHandler(RestoreMediaCommand)
export class RestoreMediaHandler implements ICommandHandler<RestoreMediaCommand> {
  constructor(@Inject(MEDIA_REPOSITORY) private readonly repo: IMediaRepository) {}

  async execute(command: RestoreMediaCommand): Promise<void> {
    IdentifierValue.from(command.mediaId);

    const media = await this.repo.findByIdIncludeDeleted(command.mediaId);
    if (!media)
      throw NotFoundError('Media not found', {
        errorCode: MediaErrorCode.NOT_FOUND,
        layer: ErrorLayer.APPLICATION,
      });

    const restored = media.restore(command.userId);
    await this.repo.update(command.mediaId, restored);
  }
}
