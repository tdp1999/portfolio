import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RadarPlatform, RadarRunFlow } from '@prisma/client';

import {
  BadRequestError,
  ConflictError,
  ErrorLayer,
  NotFoundError,
  RadarErrorCode,
  ValidationError,
} from '@portfolio/shared/errors';

import { AI_CLIENT, type IAiClient } from '../../../ai';
import { RadarRun } from '../../domain/entities/radar-run.entity';
import { ICaptureProvider } from '../ports/capture-provider.port';
import { EXTERNAL_WORKER_ADAPTER, SERVER_AI_ADAPTER } from '../ports/llm-provider.port';
import { RADAR_ANALYSIS_CONFIG, RadarAnalysisConfig } from '../radar-analysis.config';
import { RadarAutoRun } from '../radar-auto-run';
import { IRadarRunRepository } from '../ports/radar-run.repository.port';
import { IRadarSourceRepository } from '../ports/radar-source.repository.port';
import { CreateRunSchema, RadarRunDto } from '../radar.dto';
import { RadarPresenter } from '../radar.presenter';
import { CAPTURE_PROVIDERS, RADAR_RUN_REPOSITORY, RADAR_SOURCE_REPOSITORY } from '../radar.token';

/** Manual flow: the Owner uploads the provider export into the run. */
export const UPLOAD_CAPTURE_ADAPTER = 'upload';
/** The upload route reads a Facebook posts export, so a Manual run is Facebook only. */
const UPLOAD_NORMALIZE_ADAPTER = 'apify-facebook-posts';
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
    @Inject(CAPTURE_PROVIDERS) private readonly providers: ICaptureProvider[],
    @Inject(AI_CLIENT) private readonly ai: IAiClient,
    @Inject(RADAR_ANALYSIS_CONFIG) private readonly analysis: RadarAnalysisConfig
  ) {}

  async execute(command: CreateRunCommand): Promise<RadarRunDto> {
    const parsed = CreateRunSchema.safeParse(command.body ?? {});
    if (!parsed.success) {
      throw ValidationError(parsed.error, { errorCode: RadarErrorCode.INVALID_INPUT, layer: ErrorLayer.APPLICATION });
    }
    const input = parsed.data;
    // A flow says how much the Owner does by hand: MANUAL uploads and runs `/radar work`, HYBRID
    // runs `/radar work`, AUTO only reads. The flow picks both adapters; the Owner never picks them apart.
    const auto = input.flow === RadarRunFlow.AUTO;
    const providerCapture = input.flow !== RadarRunFlow.MANUAL;

    const source = await this.sources.findById(input.sourceId);
    if (!source) {
      throw NotFoundError('Radar source not found', {
        errorCode: RadarErrorCode.SOURCE_NOT_FOUND,
        layer: ErrorLayer.APPLICATION,
      });
    }
    source.ensureCanCapture();
    const facebook = source.platform === RadarPlatform.FACEBOOK;
    if (!providerCapture && !facebook) {
      throw invalid('A Manual run takes a Facebook export; run this source as Hybrid or Auto');
    }
    // The comments actor reads Facebook posts only.
    if (input.fetchComments && !facebook) throw invalid('Comments can only be fetched for a Facebook source');
    const provider = providerCapture ? this.providers.find((p) => p.platform === source.platform) : null;
    if (providerCapture && !provider?.isConfigured()) {
      const setting = provider ? ` (${provider.credentialName} is unset)` : '';
      throw BadRequestError(`Provider capture is not configured${setting}`, {
        errorCode: RadarErrorCode.CAPTURE_NOT_CONFIGURED,
        layer: ErrorLayer.APPLICATION,
      });
    }
    if (auto) RadarAutoRun.ensureConfigured(this.ai);
    // Two runs on one source would race on the same items' lastRunId and double the provider bill.
    // An active re-analysis holding posts of this source counts too: a capture would take them over.
    // Checked here for a fast answer, and again inside the insert transaction for concurrent calls.
    if (await this.runs.hasActiveRun(source.id)) throw alreadyActive();

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
        budgetMicroUsd: auto ? RadarAutoRun.budgetMicroUsd(this.analysis, input.budgetUsd) : null,
        deepAnalysis: auto && input.deepAnalysis,
        adapters: {
          capture: provider?.name ?? UPLOAD_CAPTURE_ADAPTER,
          normalize: provider?.format ?? UPLOAD_NORMALIZE_ADAPTER,
          enrich: IMAGE_ADAPTER,
          analyze: auto ? SERVER_AI_ADAPTER : EXTERNAL_WORKER_ADAPTER,
        },
      })
    );
    if (!run) throw alreadyActive();
    return RadarPresenter.toRun(run);
  }
}

const invalid = (message: string) =>
  BadRequestError(message, { errorCode: RadarErrorCode.INVALID_INPUT, layer: ErrorLayer.APPLICATION });

const alreadyActive = () =>
  ConflictError('This source already has an active run, or a re-analysis of its posts', {
    errorCode: RadarErrorCode.RUN_ALREADY_ACTIVE,
    layer: ErrorLayer.APPLICATION,
  });
