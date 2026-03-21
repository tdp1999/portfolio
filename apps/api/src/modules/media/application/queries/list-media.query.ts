import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ValidationError, ErrorLayer, MediaErrorCode } from '@portfolio/shared/errors';
import { IMediaRepository } from '../ports/media.repository.port';
import { MEDIA_REPOSITORY } from '../media.token';
import { ListMediaSchema, MediaResponseDto } from '../media.dto';
import { MediaPresenter } from '../media.presenter';

export class ListMediaQuery {
  constructor(readonly params: unknown) {}
}

@QueryHandler(ListMediaQuery)
export class ListMediaHandler implements IQueryHandler<ListMediaQuery> {
  constructor(@Inject(MEDIA_REPOSITORY) private readonly repo: IMediaRepository) {}

  async execute(
    query: ListMediaQuery
  ): Promise<{ data: MediaResponseDto[]; total: number; page: number; limit: number }> {
    const { success, data, error } = ListMediaSchema.safeParse(query.params);
    if (!success)
      throw ValidationError(error, {
        errorCode: MediaErrorCode.INVALID_INPUT,
        layer: ErrorLayer.APPLICATION,
        remarks: 'List media pagination validation failed',
      });

    const { data: media, total } = await this.repo.findAll({
      page: data.page,
      limit: data.limit,
      search: data.search,
      mimeTypePrefix: data.mimeTypePrefix,
      includeDeleted: data.includeDeleted || undefined,
    });

    return {
      data: media.map(MediaPresenter.toResponse),
      total,
      page: data.page,
      limit: data.limit,
    };
  }
}
