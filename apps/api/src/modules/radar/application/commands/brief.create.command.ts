import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { ErrorLayer, RadarErrorCode, ValidationError } from '@portfolio/shared/errors';

import { RadarBrief } from '../../domain/entities/radar-brief.entity';
import { IRadarBriefRepository } from '../ports/radar-brief.repository.port';
import { IRadarSourceRepository } from '../ports/radar-source.repository.port';
import { CreateBriefSchema, RadarBriefDto } from '../radar.dto';
import { RadarPresenter } from '../radar.presenter';
import { RADAR_BRIEF_REPOSITORY, RADAR_SOURCE_REPOSITORY } from '../radar.token';

/** The Owner asks for a brief of a window (see {@link RadarBrief.create}); `/radar work brief` writes it. */
export class CreateBriefCommand {
  constructor(readonly dto: unknown) {}
}

@CommandHandler(CreateBriefCommand)
export class CreateBriefHandler implements ICommandHandler<CreateBriefCommand> {
  constructor(
    @Inject(RADAR_BRIEF_REPOSITORY) private readonly briefs: IRadarBriefRepository,
    @Inject(RADAR_SOURCE_REPOSITORY) private readonly sources: IRadarSourceRepository
  ) {}

  async execute(command: CreateBriefCommand): Promise<RadarBriefDto> {
    const { success, data, error } = CreateBriefSchema.safeParse(command.dto ?? {});
    if (!success) {
      throw ValidationError(error, { errorCode: RadarErrorCode.INVALID_INPUT, layer: ErrorLayer.APPLICATION });
    }

    const [itemIds, waiting] = await Promise.all([this.briefs.windowItemIds(data), this.briefs.hasWaiting()]);
    const brief = RadarBrief.create(data, itemIds.length, waiting);
    await this.briefs.add(brief);

    const source = data.sourceId ? await this.sources.findById(data.sourceId) : null;
    return RadarPresenter.toBrief({
      ...brief.toProps(),
      itemCount: 0,
      sourceName: source?.displayName ?? null,
    });
  }
}
