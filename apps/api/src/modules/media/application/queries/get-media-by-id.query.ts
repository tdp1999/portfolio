import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { NotFoundError, ErrorLayer, MediaErrorCode } from '@portfolio/shared/errors';
import { IdentifierValue } from '@portfolio/shared/types';
import { IMediaRepository } from '../ports/media.repository.port';
import { MEDIA_REPOSITORY } from '../media.token';
import { MediaResponseDto } from '../media.dto';
import { MediaPresenter } from '../media.presenter';

export class GetMediaByIdQuery {
  constructor(readonly mediaId: string) {}
}

@QueryHandler(GetMediaByIdQuery)
export class GetMediaByIdHandler implements IQueryHandler<GetMediaByIdQuery> {
  constructor(@Inject(MEDIA_REPOSITORY) private readonly repo: IMediaRepository) {}

  async execute(query: GetMediaByIdQuery): Promise<MediaResponseDto> {
    IdentifierValue.from(query.mediaId);

    const media = await this.repo.findById(query.mediaId);
    if (!media)
      throw NotFoundError('Media not found', {
        errorCode: MediaErrorCode.NOT_FOUND,
        layer: ErrorLayer.APPLICATION,
      });

    return MediaPresenter.toResponse(media);
  }
}
