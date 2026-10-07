import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { BadRequestError, ConflictError, ErrorLayer, RadarErrorCode, ValidationError } from '@portfolio/shared/errors';
import { RadarSource } from '../../domain/entities/radar-source.entity';

import { ICaptureProvider } from '../ports/capture-provider.port';
import { IRadarSourceRepository } from '../ports/radar-source.repository.port';
import { CreateRadarSourceSchema, RadarSourceResponseDto } from '../radar.dto';
import { RadarPresenter } from '../radar.presenter';
import { CAPTURE_PROVIDERS, RADAR_SOURCE_REPOSITORY } from '../radar.token';

export class CreateSourceCommand {
  constructor(readonly dto: unknown) {}
}

@CommandHandler(CreateSourceCommand)
export class CreateSourceHandler implements ICommandHandler<CreateSourceCommand> {
  constructor(
    @Inject(RADAR_SOURCE_REPOSITORY) private readonly repo: IRadarSourceRepository,
    @Inject(CAPTURE_PROVIDERS) private readonly providers: ICaptureProvider[]
  ) {}

  async execute(command: CreateSourceCommand): Promise<RadarSourceResponseDto> {
    const { success, data, error } = CreateRadarSourceSchema.safeParse(command.dto);
    if (!success) {
      throw ValidationError(error, { errorCode: RadarErrorCode.INVALID_INPUT, layer: ErrorLayer.APPLICATION });
    }

    // A provider that knows its sources turns the pasted URL into the one form it stores, so the
    // same channel pasted two ways is still one source.
    const provider = this.providers.find((p) => p.platform === data.platform);
    let { url, displayName } = data;
    if (provider?.resolveSource) {
      if (!provider.isConfigured()) {
        throw BadRequestError(`Provider capture is not configured (${provider.credentialName} is unset)`, {
          errorCode: RadarErrorCode.CAPTURE_NOT_CONFIGURED,
          layer: ErrorLayer.APPLICATION,
        });
      }
      const resolved = await provider.resolveSource(url).catch((error: unknown) => {
        throw BadRequestError(`Could not check the source: ${error instanceof Error ? error.message : String(error)}`, {
          errorCode: RadarErrorCode.INVALID_INPUT,
          layer: ErrorLayer.APPLICATION,
        });
      });
      if (!resolved) {
        throw BadRequestError(`No ${data.platform.toLowerCase()} channel found at ${url}`, {
          errorCode: RadarErrorCode.INVALID_INPUT,
          layer: ErrorLayer.APPLICATION,
        });
      }
      url = resolved.url;
      displayName ||= resolved.name.slice(0, 200);
    }

    if (await this.repo.findByUrl(url)) {
      throw ConflictError('A radar source with this URL already exists', {
        errorCode: RadarErrorCode.SOURCE_URL_TAKEN,
        layer: ErrorLayer.APPLICATION,
      });
    }

    const source = RadarSource.create({ platform: data.platform, url, displayName });
    await this.repo.add(source);
    return RadarPresenter.toSource({ source, itemCount: 0 });
  }
}
