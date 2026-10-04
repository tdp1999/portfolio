import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { ErrorLayer, ExternalServiceError, NotFoundError, RadarErrorCode } from '@portfolio/shared/errors';
import { IdentifierValue } from '@portfolio/shared/types';

import { STORAGE_SERVICE } from '../../../media/application/media.token';
import { IStorageService } from '../../../media/application/ports/storage.service.port';
import { IRadarImageRepository } from '../ports/radar-image.repository.port';
import { IRadarSourceRepository } from '../ports/radar-source.repository.port';
import { deleteStoredImages } from '../radar-image.cleanup';
import { RADAR_IMAGE_REPOSITORY, RADAR_SOURCE_REPOSITORY } from '../radar.token';

export interface DeleteSourceResult {
  imagesDeleted: number;
}

/**
 * Removes a source with its runs and items. Stored images go first: Radar keeps no `Media` rows,
 * so once the items are gone nothing would point at the files. If any image delete fails the
 * rows stay, and the call can simply be repeated (deleting an already-deleted file is a no-op).
 */
export class DeleteSourceCommand {
  constructor(readonly sourceId: string) {}
}

@CommandHandler(DeleteSourceCommand)
export class DeleteSourceHandler implements ICommandHandler<DeleteSourceCommand> {
  private readonly logger = new Logger(DeleteSourceHandler.name);

  constructor(
    @Inject(RADAR_SOURCE_REPOSITORY) private readonly sources: IRadarSourceRepository,
    @Inject(RADAR_IMAGE_REPOSITORY) private readonly images: IRadarImageRepository,
    @Inject(STORAGE_SERVICE) private readonly storage: IStorageService
  ) {}

  async execute(command: DeleteSourceCommand): Promise<DeleteSourceResult> {
    IdentifierValue.from(command.sourceId);

    if (!(await this.sources.findById(command.sourceId))) {
      throw NotFoundError('Radar source not found', {
        errorCode: RadarErrorCode.SOURCE_NOT_FOUND,
        layer: ErrorLayer.APPLICATION,
      });
    }

    const ids = await this.images.findStoredExternalIds(command.sourceId);
    const failed = await deleteStoredImages(this.storage, ids, this.logger);

    if (failed > 0) {
      throw ExternalServiceError(`${failed} of ${ids.length} stored images could not be deleted`, undefined, {
        errorCode: RadarErrorCode.IMAGE_DELETE_FAILED,
        layer: ErrorLayer.APPLICATION,
      });
    }

    await this.sources.delete(command.sourceId);
    return { imagesDeleted: ids.length };
  }
}
