import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { BadRequestError, ErrorLayer, NotFoundError, RadarErrorCode, ValidationError } from '@portfolio/shared/errors';
import { IdentifierValue } from '@portfolio/shared/types';

import { IRadarBriefRepository } from '../ports/radar-brief.repository.port';
import { SubmitBriefResponseDto, SubmitBriefSchema } from '../radar.dto';
import { RADAR_BRIEF_REPOSITORY } from '../radar.token';

/** The worker's markdown for a claimed brief (see {@link RadarBrief.complete}). */
export class SubmitBriefCommand {
  constructor(
    readonly briefId: string,
    readonly dto: unknown
  ) {}
}

@CommandHandler(SubmitBriefCommand)
export class SubmitBriefHandler implements ICommandHandler<SubmitBriefCommand> {
  constructor(@Inject(RADAR_BRIEF_REPOSITORY) private readonly briefs: IRadarBriefRepository) {}

  async execute(command: SubmitBriefCommand): Promise<SubmitBriefResponseDto> {
    IdentifierValue.from(command.briefId);
    const { success, data, error } = SubmitBriefSchema.safeParse(command.dto ?? {});
    if (!success) {
      throw ValidationError(error, { errorCode: RadarErrorCode.INVALID_INPUT, layer: ErrorLayer.APPLICATION });
    }

    const brief = await this.briefs.findById(command.briefId);
    if (!brief) {
      throw NotFoundError('Radar brief not found', {
        errorCode: RadarErrorCode.BRIEF_NOT_FOUND,
        layer: ErrorLayer.APPLICATION,
      });
    }

    const written = brief.complete(data.body, await this.briefs.windowItemIds(brief), data.producer);
    // The brief stopped being CLAIMED between the read and the write: a parallel submit landed first.
    // There is no claim token, so after a lease runs out and another session claims the brief again,
    // whichever session submits first wins and the other one is refused here or in `complete`.
    if (!(await this.briefs.saveResult(written))) {
      throw BadRequestError('This brief is not claimed by the worker', {
        errorCode: RadarErrorCode.BRIEF_NOT_CLAIMED,
        layer: ErrorLayer.APPLICATION,
      });
    }
    return { id: written.id, itemCount: written.itemIds.length };
  }
}
