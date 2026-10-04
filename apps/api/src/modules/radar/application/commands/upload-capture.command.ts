import { Inject, Logger } from '@nestjs/common';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { BadRequestError, ErrorLayer, NotFoundError, RadarErrorCode, ValidationError } from '@portfolio/shared/errors';
import { IdentifierValue } from '@portfolio/shared/types';

import { MulterFile } from '../../../../shared/types';
import { STORAGE_SERVICE } from '../../../media/application/media.token';
import { IStorageService } from '../../../media/application/ports/storage.service.port';
import { ICaptureNormalizer } from '../ports/capture-normalizer.port';
import { IRadarCaptureRepository } from '../ports/radar-capture.repository.port';
import { IRadarSourceRepository } from '../ports/radar-source.repository.port';
import {
  MAX_REPORTED_FAILURES,
  UploadCaptureBodySchema,
  UploadCaptureFileSchema,
  UploadCaptureResponseDto,
} from '../radar.dto';
import { PersistItemImagesCommand } from './persist-item-images.command';
import { deleteStoredImages } from '../radar-image.cleanup';
import { CAPTURE_NORMALIZERS, RADAR_CAPTURE_REPOSITORY, RADAR_SOURCE_REPOSITORY } from '../radar.token';

const UPLOAD_CAPTURE_ADAPTER = 'upload';
/** Manual flow: Claude Code pulls the analyze work through the worker API (task 404). */
const MANUAL_LLM_ADAPTER = 'external-worker';

/**
 * Manual-flow capture: the Owner exports a dataset from the provider console and uploads it.
 * A file that is not a JSON array of posts is rejected whole (400, nothing written). Inside a
 * valid file, a single malformed post is reported in `failures` and the rest still land.
 */
export class UploadCaptureCommand {
  constructor(
    readonly sourceId: string,
    readonly file: MulterFile | undefined,
    readonly body: unknown
  ) {}
}

@CommandHandler(UploadCaptureCommand)
export class UploadCaptureHandler implements ICommandHandler<UploadCaptureCommand> {
  private readonly logger = new Logger(UploadCaptureHandler.name);

  constructor(
    private readonly commandBus: CommandBus,
    @Inject(RADAR_SOURCE_REPOSITORY) private readonly sources: IRadarSourceRepository,
    @Inject(RADAR_CAPTURE_REPOSITORY) private readonly captures: IRadarCaptureRepository,
    @Inject(CAPTURE_NORMALIZERS) private readonly normalizers: ICaptureNormalizer[],
    @Inject(STORAGE_SERVICE) private readonly storage: IStorageService
  ) {}

  async execute(command: UploadCaptureCommand): Promise<UploadCaptureResponseDto> {
    const startedAt = new Date();
    IdentifierValue.from(command.sourceId);

    const body = UploadCaptureBodySchema.safeParse(command.body ?? {});
    if (!body.success) {
      throw ValidationError(body.error, { errorCode: RadarErrorCode.INVALID_INPUT, layer: ErrorLayer.APPLICATION });
    }

    const normalizer = this.normalizers.find((n) => n.format === body.data.format);
    if (!normalizer) {
      throw invalidUpload(`Unknown capture format "${body.data.format}"`);
    }

    const source = await this.sources.findById(command.sourceId);
    if (!source) {
      throw NotFoundError('Radar source not found', {
        errorCode: RadarErrorCode.SOURCE_NOT_FOUND,
        layer: ErrorLayer.APPLICATION,
      });
    }
    if (!source.isActive) {
      throw BadRequestError('Radar source is inactive', {
        errorCode: RadarErrorCode.SOURCE_INACTIVE,
        layer: ErrorLayer.APPLICATION,
      });
    }

    const posts = UploadCaptureFileSchema.safeParse(parseJson(command.file));
    if (!posts.success) {
      throw ValidationError(posts.error, { errorCode: RadarErrorCode.INVALID_UPLOAD, layer: ErrorLayer.APPLICATION });
    }

    const { items, skipped, failures } = normalizer.normalize(posts.data);
    const runId = IdentifierValue.v7();
    const { created, updated, orphanedImageIds } = await this.captures.saveCapture({
      runId,
      sourceId: source.id,
      captureAdapter: UPLOAD_CAPTURE_ADAPTER,
      llmAdapter: MANUAL_LLM_ADAPTER,
      startedAt,
      items,
      failedCount: failures.length,
    });

    // Not awaited: a backfill has thousands of images and the upload response must not wait.
    if (created + updated > 0) {
      this.commandBus
        .execute(new PersistItemImagesCommand())
        .catch((err) =>
          this.logger.error(`Radar image persistence crashed: ${err instanceof Error ? err.message : err}`)
        );
    }
    // Stored images the re-captured posts dropped; after the commit nothing references them.
    void deleteStoredImages(this.storage, orphanedImageIds, this.logger);

    return {
      runId,
      created,
      updated,
      skipped,
      failed: failures.length,
      failures: failures.slice(0, MAX_REPORTED_FAILURES),
    };
  }
}

function parseJson(file: MulterFile | undefined): unknown {
  if (!file?.buffer?.length) {
    throw invalidUpload('A capture file is required (multipart field "file")');
  }
  try {
    return JSON.parse(file.buffer.toString('utf8').replace(/^\uFEFF/, ''));
  } catch {
    throw invalidUpload('The capture file is not valid JSON');
  }
}

const invalidUpload = (message: string) =>
  BadRequestError(message, { errorCode: RadarErrorCode.INVALID_UPLOAD, layer: ErrorLayer.APPLICATION });
