import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { ConflictError, ErrorLayer, NotFoundError, RadarErrorCode } from '@portfolio/shared/errors';
import { IdentifierValue } from '@portfolio/shared/types';

import { RadarRun } from '../../domain/entities/radar-run.entity';
import { ICommentsProvider } from '../ports/comments-provider.port';
import { IRadarRunRepository } from '../ports/radar-run.repository.port';
import { RadarRunDto } from '../radar.dto';
import { RadarPresenter } from '../radar.presenter';
import { COMMENTS_PROVIDER, RADAR_RUN_REPOSITORY } from '../radar.token';
import { abortCommentJobs } from './run.comments.phase';

const CANCEL_ATTEMPTS = 3;

/**
 * Cancels a run (see {@link RadarRun.cancel}). A comments job still running is aborted, since
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
    // A tick may move the run between the read and the save; each retry reads where it went, and
    // throws RUN_FINISHED once the tick finished or failed it.
    for (let attempt = 1; attempt <= CANCEL_ATTEMPTS; attempt++) {
      const run = await this.find(command.runId);
      const cancelled = await this.runs.save(run.cancel(new Date()));
      if (!cancelled) continue;
      await abortCommentJobs(this.comments, run.commentsProgress?.openJobs ?? [], this.logger, run.id);
      return RadarPresenter.toRun(cancelled);
    }
    throw ConflictError('This run kept changing while it was being cancelled', {
      errorCode: RadarErrorCode.RUN_BUSY,
      layer: ErrorLayer.APPLICATION,
    });
  }

  private async find(runId: string): Promise<RadarRun> {
    const run = await this.runs.findById(runId);
    if (!run) {
      throw NotFoundError('Radar run not found', {
        errorCode: RadarErrorCode.RUN_NOT_FOUND,
        layer: ErrorLayer.APPLICATION,
      });
    }
    return run;
  }
}
