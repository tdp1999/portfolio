import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { BadRequestError, ErrorLayer, NotFoundError, RadarErrorCode, ValidationError } from '@portfolio/shared/errors';
import { IdentifierValue } from '@portfolio/shared/types';

import { MulterFile } from '../../../../shared/types';
import { ICommentsProvider } from '../ports/comments-provider.port';
import { IRadarCommentsRepository } from '../ports/radar-comments.repository.port';
import { IRadarSourceRepository } from '../ports/radar-source.repository.port';
import { applyComments } from '../radar-comments.apply';
import { MAX_REPORTED_FAILURES, UploadCommentsFileSchema, UploadCommentsResponseDto } from '../radar.dto';
import { COMMENTS_PROVIDER, RADAR_COMMENTS_REPOSITORY, RADAR_SOURCE_REPOSITORY } from '../radar.token';

/**
 * Manual-flow comments: the Owner exports the comments actor's dataset from the Apify console
 * and uploads it for a source. Each comment is matched to a post of that source by post URL;
 * posts in the file get their list replaced, posts not in it are left alone.
 */
export class UploadCommentsCommand {
  constructor(
    readonly sourceId: string,
    readonly file: MulterFile | undefined
  ) {}
}

@CommandHandler(UploadCommentsCommand)
export class UploadCommentsHandler implements ICommandHandler<UploadCommentsCommand> {
  constructor(
    @Inject(RADAR_SOURCE_REPOSITORY) private readonly sources: IRadarSourceRepository,
    @Inject(RADAR_COMMENTS_REPOSITORY) private readonly comments: IRadarCommentsRepository,
    @Inject(COMMENTS_PROVIDER) private readonly provider: ICommentsProvider
  ) {}

  async execute(command: UploadCommentsCommand): Promise<UploadCommentsResponseDto> {
    IdentifierValue.from(command.sourceId);
    if (!(await this.sources.findById(command.sourceId))) {
      throw NotFoundError('Radar source not found', {
        errorCode: RadarErrorCode.SOURCE_NOT_FOUND,
        layer: ErrorLayer.APPLICATION,
      });
    }

    const file = UploadCommentsFileSchema.safeParse(parseJson(command.file));
    if (!file.success) {
      throw ValidationError(file.error, { errorCode: RadarErrorCode.INVALID_UPLOAD, layer: ErrorLayer.APPLICATION });
    }

    const targets = await this.comments.findBySource(command.sourceId);
    const result = this.provider.normalize(file.data, targets);
    // An export has no "asked for" limit; nothing is judged cut short.
    const { fetched } = await applyComments(this.comments, result, targets, {
      capHit: false,
      resultsLimit: 0,
      onlyMatched: true,
      now: new Date(),
    });

    return {
      posts: fetched,
      comments: [...result.threads.values()].reduce((sum, thread) => sum + thread.size, 0),
      unmatched: result.unmatched,
      failed: result.failures.length,
      failures: result.failures.slice(0, MAX_REPORTED_FAILURES),
    };
  }
}

function parseJson(file: MulterFile | undefined): unknown {
  if (!file?.buffer?.length) throw invalidUpload('A comments file is required (multipart field "file")');
  try {
    return JSON.parse(file.buffer.toString('utf8').replace(/^﻿/, ''));
  } catch {
    throw invalidUpload('The comments file is not valid JSON');
  }
}

const invalidUpload = (message: string) =>
  BadRequestError(message, { errorCode: RadarErrorCode.INVALID_UPLOAD, layer: ErrorLayer.APPLICATION });
