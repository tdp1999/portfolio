import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RadarStatus, RadarStep } from '@prisma/client';

import { BadRequestError, ErrorLayer, NotFoundError, RadarErrorCode } from '@portfolio/shared/errors';
import { IdentifierValue, RADAR_RUN_CANCELLED_MESSAGE } from '@portfolio/shared/types';

import { ICommentsProvider } from '../ports/comments-provider.port';
import { IRadarRunRepository, RadarRunSnapshot } from '../ports/radar-run.repository.port';
import { RadarRunDto } from '../radar.dto';
import { RadarPresenter } from '../radar.presenter';
import { COMMENTS_PROVIDER, RADAR_RUN_REPOSITORY } from '../radar.token';
import { abortCommentJobs, CommentsPhaseMeta } from './run.comments.phase';

/**
 * The way out of the one-active-run rule: a Manual run nobody uploads to, or a run waiting on
 * analysis the Owner no longer wants, would otherwise block its source for good. Marks the current step
 * and the run FAILED; items already captured stay. A comments job still running is aborted, since
 * nobody will read it; a capture job is not (it finishes on Apify's side and is never read).
 */
export class CancelRunCommand {
  constructor(readonly runId: string) {}
}

@CommandHandler(CancelRunCommand)
export class CancelRunHandler implements ICommandHandler<CancelRunCommand> {
  private readonly logger = new Logger(CancelRunHandler.name);

  constructor(
    @Inject(RADAR_RUN_REPOSITORY) private readonly runs: IRadarRunRepository,
    @Inject(COMMENTS_PROVIDER) private readonly comments: ICommentsProvider
  ) {}

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
    await abortCommentJobs(this.comments, openCommentJobs(run), this.logger, run.id);
    return RadarPresenter.toRun((await this.runs.findById(run.id)) ?? run);
  }
}

const openCommentJobs = (run: RadarRunSnapshot) => {
  const meta = run.steps.find((s) => s.step === RadarStep.ENRICH)?.meta['comments'] as CommentsPhaseMeta | undefined;
  return meta?.jobs.filter((j) => !j.done) ?? [];
};

const finished = () =>
  BadRequestError('This run has already finished', {
    errorCode: RadarErrorCode.RUN_FINISHED,
    layer: ErrorLayer.APPLICATION,
  });
