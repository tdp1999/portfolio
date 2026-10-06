import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
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

/**
 * Starts a run only because the Owner asked for one (RAD-006). A Hybrid run's capture step is
 * PENDING, so the next tick starts the provider job; a Manual run's capture step waits in
 * AWAITING_EXTERNAL for the upload. SYNTHESIZE gets no row: the brief (412) is per window.
 */
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
    if (!source.isActive) {
      throw BadRequestError('Radar source is inactive', {
        errorCode: RadarErrorCode.SOURCE_INACTIVE,
        layer: ErrorLayer.APPLICATION,
      });
    }
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
    const waiting = hybrid ? RadarStatus.PENDING : RadarStatus.AWAITING_EXTERNAL;
    const run = await this.runs.create({
      id: IdentifierValue.v7(),
      sourceId: source.id,
      flow: input.flow,
      status: waiting,
      windowFrom: input.windowFrom ?? null,
      windowTo: input.windowTo ?? null,
      itemCap: input.itemCap,
      captureAdapter,
      llmAdapter: EXTERNAL_WORKER_ADAPTER,
      fetchComments: input.fetchComments,
      steps: [
        { step: RadarStep.CAPTURE, status: waiting, adapter: captureAdapter },
        { step: RadarStep.NORMALIZE, status: RadarStatus.PENDING, adapter: NORMALIZE_ADAPTER },
        { step: RadarStep.ENRICH, status: RadarStatus.PENDING, adapter: IMAGE_ADAPTER },
        { step: RadarStep.ANALYZE, status: RadarStatus.PENDING, adapter: EXTERNAL_WORKER_ADAPTER },
      ],
    });
    if (!run) throw alreadyActive();
    return RadarPresenter.toRun(run);
  }
}

const alreadyActive = () =>
  ConflictError('This source already has an active run', {
    errorCode: RadarErrorCode.RUN_ALREADY_ACTIVE,
    layer: ErrorLayer.APPLICATION,
  });
