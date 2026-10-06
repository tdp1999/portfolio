import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RadarRunFlow } from '@prisma/client';

import {
  BadRequestError,
  ConflictError,
  ErrorLayer,
  NotFoundError,
  RadarErrorCode,
  ValidationError,
} from '@portfolio/shared/errors';

import { RadarRun } from '../../domain/entities/radar-run.entity';
import { ICaptureProvider } from '../ports/capture-provider.port';
import { EXTERNAL_WORKER_ADAPTER } from '../ports/llm-provider.port';
import { IRadarRunRepository } from '../ports/radar-run.repository.port';
import { IRadarSourceRepository } from '../ports/radar-source.repository.port';
import { CreateRunSchema, RadarRunDto } from '../radar.dto';
import { RadarPresenter } from '../radar.presenter';
import { CAPTURE_PROVIDERS, RADAR_RUN_REPOSITORY, RADAR_SOURCE_REPOSITORY } from '../radar.token';

/** Manual flow: the Owner uploads the provider export into the run. */
export const UPLOAD_CAPTURE_ADAPTER = 'upload';
/** Hybrid flow default; later providers register under their own name. */
const HYBRID_CAPTURE_ADAPTER = 'apify';
const NORMALIZE_ADAPTER = 'apify-facebook-posts';
const IMAGE_ADAPTER = 'storage';

/** Starts a run because the Owner asked for one (see {@link RadarRun.create}). */
export class CreateRunCommand {
  constructor(readonly body: unknown) {}
}

@CommandHandler(CreateRunCommand)
export class CreateRunHandler implements ICommandHandler<CreateRunCommand> {
  constructor(
    @Inject(RADAR_SOURCE_REPOSITORY) private readonly sources: IRadarSourceRepository,
    @Inject(RADAR_RUN_REPOSITORY) private readonly runs: IRadarRunRepository,
    @Inject(CAPTURE_PROVIDERS) private readonly providers: ICaptureProvider[]
  ) {}

  async execute(command: CreateRunCommand): Promise<RadarRunDto> {
    const parsed = CreateRunSchema.safeParse(command.body ?? {});
    if (!parsed.success) {
      throw ValidationError(parsed.error, { errorCode: RadarErrorCode.INVALID_INPUT, layer: ErrorLayer.APPLICATION });
    }
    const input = parsed.data;
    const hybrid = input.flow === RadarRunFlow.HYBRID;

    const source = await this.sources.findById(input.sourceId);
    if (!source) {
      throw NotFoundError('Radar source not found', {
        errorCode: RadarErrorCode.SOURCE_NOT_FOUND,
        layer: ErrorLayer.APPLICATION,
      });
    }
    source.ensureCanCapture();
    if (hybrid && !this.providers.find((p) => p.name === HYBRID_CAPTURE_ADAPTER)?.isConfigured()) {
      throw BadRequestError('Hybrid capture is not configured (APIFY_TOKEN is unset)', {
        errorCode: RadarErrorCode.CAPTURE_NOT_CONFIGURED,
        layer: ErrorLayer.APPLICATION,
      });
    }
    // Two runs on one source would race on the same items' lastRunId and double the provider bill.
    // Checked here for a fast answer, and again inside the insert transaction for concurrent calls.
    if (await this.runs.hasActiveRun(source.id)) throw alreadyActive();

    const captureAdapter = hybrid ? HYBRID_CAPTURE_ADAPTER : UPLOAD_CAPTURE_ADAPTER;
    const run = await this.runs.add(
      RadarRun.create({
        sourceId: source.id,
        sourceUrl: source.url,
        sourceName: source.displayName,
        flow: input.flow,
        windowFrom: input.windowFrom ?? null,
        windowTo: input.windowTo ?? null,
        itemCap: input.itemCap,
        fetchComments: input.fetchComments,
        adapters: {
          capture: captureAdapter,
          normalize: NORMALIZE_ADAPTER,
          enrich: IMAGE_ADAPTER,
          analyze: EXTERNAL_WORKER_ADAPTER,
        },
      })
    );
    if (!run) throw alreadyActive();
    return RadarPresenter.toRun(run);
  }
}

const alreadyActive = () =>
  ConflictError('This source already has an active run', {
    errorCode: RadarErrorCode.RUN_ALREADY_ACTIVE,
    layer: ErrorLayer.APPLICATION,
  });
