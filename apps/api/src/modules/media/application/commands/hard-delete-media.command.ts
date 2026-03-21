import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { NotFoundError, ErrorLayer, MediaErrorCode } from '@portfolio/shared/errors';
import { IdentifierValue } from '@portfolio/shared/types';
import { BaseCommand } from '../../../../shared/cqrs/base.command';
import { IMediaRepository } from '../ports/media.repository.port';
import { IStorageService } from '../ports/storage.service.port';
import { MEDIA_REPOSITORY, STORAGE_SERVICE } from '../media.token';

export class HardDeleteMediaCommand extends BaseCommand {
  constructor(
    readonly mediaId: string,
    userId: string
  ) {
    super(userId);
  }
}

@CommandHandler(HardDeleteMediaCommand)
export class HardDeleteMediaHandler implements ICommandHandler<HardDeleteMediaCommand> {
  private readonly logger = new Logger(HardDeleteMediaHandler.name);

  constructor(
    @Inject(MEDIA_REPOSITORY) private readonly repo: IMediaRepository,
    @Inject(STORAGE_SERVICE) private readonly storage: IStorageService
  ) {}

  async execute(command: HardDeleteMediaCommand): Promise<void> {
    IdentifierValue.from(command.mediaId);

    const media = await this.repo.findById(command.mediaId);
    if (!media)
      throw NotFoundError('Media not found', {
        errorCode: MediaErrorCode.NOT_FOUND,
        layer: ErrorLayer.APPLICATION,
      });

    // Best-effort delete from storage — don't block DB cleanup on storage failure
    try {
      await this.storage.delete(media.publicId);
    } catch (err) {
      this.logger.warn(
        `Failed to delete media ${command.mediaId} from storage (publicId: ${media.publicId}): ${err instanceof Error ? err.message : err}`
      );
    }

    await this.repo.hardDelete(command.mediaId);
  }
}
