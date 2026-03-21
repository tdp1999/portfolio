import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ValidationError, NotFoundError, ErrorLayer, MediaErrorCode } from '@portfolio/shared/errors';
import { IdentifierValue } from '@portfolio/shared/types';
import { BaseCommand } from '../../../../shared/cqrs/base.command';
import { IMediaRepository } from '../ports/media.repository.port';
import { MEDIA_REPOSITORY } from '../media.token';
import { UpdateMediaMetadataSchema } from '../media.dto';

export class UpdateMediaMetadataCommand extends BaseCommand {
  constructor(
    readonly mediaId: string,
    readonly dto: unknown,
    userId: string
  ) {
    super(userId);
  }
}

@CommandHandler(UpdateMediaMetadataCommand)
export class UpdateMediaMetadataHandler implements ICommandHandler<UpdateMediaMetadataCommand> {
  constructor(@Inject(MEDIA_REPOSITORY) private readonly repo: IMediaRepository) {}

  async execute(command: UpdateMediaMetadataCommand): Promise<void> {
    IdentifierValue.from(command.mediaId);

    const { success, data, error } = UpdateMediaMetadataSchema.safeParse(command.dto);
    if (!success)
      throw ValidationError(error, {
        errorCode: MediaErrorCode.INVALID_INPUT,
        layer: ErrorLayer.APPLICATION,
        remarks: 'Media metadata update validation failed',
      });

    const media = await this.repo.findById(command.mediaId);
    if (!media)
      throw NotFoundError('Media not found', {
        errorCode: MediaErrorCode.NOT_FOUND,
        layer: ErrorLayer.APPLICATION,
      });

    const updated = media.updateMetadata(data, command.userId);
    await this.repo.update(command.mediaId, updated);
  }
}
