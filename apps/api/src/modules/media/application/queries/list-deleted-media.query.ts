import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ValidationError, ErrorLayer, MediaErrorCode } from '@portfolio/shared/errors';
import { PaginatedQuerySchema } from '@portfolio/shared/utils';
import { IMediaRepository } from '../ports/media.repository.port';
import { MEDIA_REPOSITORY } from '../media.token';
import { MediaResponseDto } from '../media.dto';
import { MediaPresenter } from '../media.presenter';

export class ListDeletedMediaQuery {
  constructor(readonly params: unknown) {}
}

@QueryHandler(ListDeletedMediaQuery)
export class ListDeletedMediaHandler implements IQueryHandler<ListDeletedMediaQuery> {
  constructor(@Inject(MEDIA_REPOSITORY) private readonly repo: IMediaRepository) {}

  async execute(
    query: ListDeletedMediaQuery
  ): Promise<{ data: MediaResponseDto[]; total: number; page: number; limit: number }> {
    const { success, data, error } = PaginatedQuerySchema.safeParse(query.params);
    if (!success)
      throw ValidationError(error, {
        errorCode: MediaErrorCode.INVALID_INPUT,
        layer: ErrorLayer.APPLICATION,
        remarks: 'List deleted media pagination validation failed',
      });

    const { data: media, total } = await this.repo.findDeleted({
      page: data.page,
      limit: data.limit,
      search: data.search,
    });

    return {
      data: media.map(MediaPresenter.toResponse),
      total,
      page: data.page,
      limit: data.limit,
    };
  }
}
