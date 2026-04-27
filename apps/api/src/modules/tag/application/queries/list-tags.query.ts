import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ValidationError, ErrorLayer, TagErrorCode } from '@portfolio/shared/errors';
import { ITagRepository } from '../ports/tag.repository.port';
import { TAG_REPOSITORY } from '../tag.token';
import { TagQuerySchema, TagResponseDto } from '../tag.dto';
import { TagPresenter } from '../tag.presenter';

export class ListTagsQuery {
  constructor(readonly params: unknown) {}
}

@QueryHandler(ListTagsQuery)
export class ListTagsHandler implements IQueryHandler<ListTagsQuery> {
  constructor(@Inject(TAG_REPOSITORY) private readonly repo: ITagRepository) {}

  async execute(query: ListTagsQuery): Promise<{ data: TagResponseDto[]; total: number; page: number; limit: number }> {
    const { success, data, error } = TagQuerySchema.safeParse(query.params);
    if (!success)
      throw ValidationError(error, {
        errorCode: TagErrorCode.INVALID_INPUT,
        layer: ErrorLayer.APPLICATION,
        remarks: 'List tags pagination validation failed',
      });

    const { data: tags, total } = await this.repo.findAll({
      page: data.page,
      limit: data.limit,
      search: data.search,
      includeDeleted: data.includeDeleted,
      sortBy: data.sortBy,
      sortDir: data.sortDir,
    });

    return {
      data: tags.map(TagPresenter.toResponse),
      total,
      page: data.page,
      limit: data.limit,
    };
  }
}
