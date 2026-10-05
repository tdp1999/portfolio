import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RadarStatus } from '@prisma/client';

import { BadRequestError, ErrorLayer, NotFoundError, RadarErrorCode } from '@portfolio/shared/errors';
import { IdentifierValue, RADAR_RUN_CANCELLED_MESSAGE } from '@portfolio/shared/types';

import { IRadarRunRepository } from '../ports/radar-run.repository.port';
import { RadarRunDto } from '../radar.dto';
import { RadarPresenter } from '../radar.presenter';
import { RADAR_RUN_REPOSITORY } from '../radar.token';

/**
 * The way out of the one-active-run rule: a Manual run nobody uploads to, or a run waiting on
 * analysis the Owner no longer wants, would otherwise block its source for good. Marks the current step
 * and the run FAILED; items already captured stay, and a provider job already started is not
 * aborted (it finishes on Apify's side and its dataset is simply never read).
 */
export class CancelRunCommand {
  constructor(readonly runId: string) {}
}

@CommandHandler(CancelRunCommand)
export class CancelRunHandler implements ICommandHandler<CancelRunCommand> {
  constructor(@Inject(RADAR_RUN_REPOSITORY) private readonly runs: IRadarRunRepository) {}

  async execute(command: CancelRunCommand): Promise<RadarRunDto> {
    IdentifierValue.from(command.runId);
    const run = await this.runs.findById(command.runId);
    if (!run) {
      throw NotFoundError('Radar run not found', {
        errorCode: RadarErrorCode.RUN_NOT_FOUND,
        layer: ErrorLayer.APPLICATION,
      });
    }
    const current = run.steps.find((s) => s.status !== RadarStatus.DONE);
    if (run.status === RadarStatus.DONE || run.status === RadarStatus.FAILED || !current) throw finished();
    // False when the tick finished or failed the run since it was read above.
    if (!(await this.runs.fail(run.id, current.step, RADAR_RUN_CANCELLED_MESSAGE, new Date()))) throw finished();
    return RadarPresenter.toRun((await this.runs.findById(run.id)) ?? run);
  }
}

const finished = () =>
  BadRequestError('This run has already finished', {
    errorCode: RadarErrorCode.RUN_FINISHED,
    layer: ErrorLayer.APPLICATION,
  });
