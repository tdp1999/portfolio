import { Inject, Logger } from '@nestjs/common';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RadarRunFlow, RadarStatus, RadarStep } from '@prisma/client';

import {
  BadRequestError,
  ConflictError,
  ErrorLayer,
  NotFoundError,
  RadarErrorCode,
  ValidationError,
} from '@portfolio/shared/errors';
import { IdentifierValue } from '@portfolio/shared/types';

import { MulterFile } from '../../../../shared/types';
import { NormalizedRadarItem } from '../../domain/radar.types';
import { STORAGE_SERVICE } from '../../../media/application/media.token';
import { IStorageService } from '../../../media/application/ports/storage.service.port';
import { ICaptureNormalizer } from '../ports/capture-normalizer.port';
import { IRadarCaptureRepository, SaveCaptureResult } from '../ports/radar-capture.repository.port';
import { EXTERNAL_WORKER_ADAPTER } from '../ports/llm-provider.port';
import { IRadarRunRepository, RadarRunSnapshot } from '../ports/radar-run.repository.port';
import { IRadarSourceRepository } from '../ports/radar-source.repository.port';
import {
  MAX_REPORTED_FAILURES,
  UploadCaptureBodySchema,
  UploadCaptureFileSchema,
  UploadCaptureResponseDto,
} from '../radar.dto';
import { PersistItemImagesCommand } from './persist-item-images.command';
import { deleteStoredImages } from '../radar-image.cleanup';
import {
  CAPTURE_NORMALIZERS,
  RADAR_CAPTURE_REPOSITORY,
  RADAR_RUN_REPOSITORY,
  RADAR_SOURCE_REPOSITORY,
} from '../radar.token';
import { UPLOAD_CAPTURE_ADAPTER } from './run.create.command';

/**
 * Manual-flow capture: the Owner exports a dataset from the provider console and uploads it.
 * A file that is not a JSON array of posts is rejected whole (400, nothing written). Inside a
 * valid file, a single malformed post is reported in `failures` and the rest still land.
 *
 * With `runId` the file fills a Manual run created through the runs API: its capture and normalize
 * steps finish here and the tick takes the run on from image copying. Without `runId` the upload
 * records its own finished run (the Phase A path).
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
    @Inject(RADAR_RUN_REPOSITORY) private readonly runs: IRadarRunRepository,
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

    const run = body.data.runId ? await this.findWaitingRun(body.data.runId, source.id) : null;
    // A direct upload would move the active run's items to a run of its own (their lastRunId),
    // and that run would stop counting them. The file belongs in the active run instead.
    if (!run && (await this.runs.hasActiveRun(source.id))) {
      throw ConflictError('This source has an active run; upload into that run from the Runs page', {
        errorCode: RadarErrorCode.RUN_ALREADY_ACTIVE,
        layer: ErrorLayer.APPLICATION,
      });
    }

    const posts = UploadCaptureFileSchema.safeParse(parseJson(command.file));
    if (!posts.success) {
      throw ValidationError(posts.error, { errorCode: RadarErrorCode.INVALID_UPLOAD, layer: ErrorLayer.APPLICATION });
    }
    if (run && posts.data.length > run.itemCap) {
      throw invalidUpload(`The file has ${posts.data.length} posts, more than the run's cap of ${run.itemCap}`);
    }

    const { items, skipped, failures } = normalizer.normalize(posts.data);
    const runId = run?.id ?? IdentifierValue.v7();
    const { created, updated, orphanedImageIds } = run
      ? await this.fillRun(run, items, failures.length, startedAt)
      : await this.captures.saveCapture({
          runId,
          sourceId: source.id,
          captureAdapter: UPLOAD_CAPTURE_ADAPTER,
          llmAdapter: EXTERNAL_WORKER_ADAPTER,
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

  private async findWaitingRun(runId: string, sourceId: string): Promise<RadarRunSnapshot> {
    const run = await this.runs.findById(runId);
    if (!run) {
      throw NotFoundError('Radar run not found', {
        errorCode: RadarErrorCode.RUN_NOT_FOUND,
        layer: ErrorLayer.APPLICATION,
      });
    }
    const capture = run.steps.find((s) => s.step === RadarStep.CAPTURE);
    if (
      run.sourceId !== sourceId ||
      run.flow !== RadarRunFlow.MANUAL ||
      capture?.status !== RadarStatus.AWAITING_EXTERNAL
    ) {
      throw notAwaitingUpload();
    }
    return run;
  }

  /**
   * Normalizing happened above, so both steps finish here and the tick picks up image copying.
   * The page is saved first, then the steps flip in one transaction that re-checks the run: a
   * cancel or a second upload that landed meanwhile wins, and the posts saved stay in the Feed.
   */
  private async fillRun(
    run: RadarRunSnapshot,
    items: NormalizedRadarItem[],
    failedCount: number,
    startedAt: Date
  ): Promise<SaveCaptureResult> {
    const saved = await this.captures.saveCapturePage({ runId: run.id, sourceId: run.sourceId, items, failedCount });
    if (!(await this.runs.completeUpload(run.id, startedAt, new Date()))) throw notAwaitingUpload();
    return saved;
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

const notAwaitingUpload = () =>
  BadRequestError('This run is not waiting for an upload for this source', {
    errorCode: RadarErrorCode.RUN_NOT_AWAITING_UPLOAD,
    layer: ErrorLayer.APPLICATION,
  });
