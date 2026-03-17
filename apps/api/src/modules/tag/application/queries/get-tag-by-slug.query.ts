import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { NotFoundError, ErrorLayer, TagErrorCode } from '@portfolio/shared/errors';
import { ITagRepository } from '../ports/tag.repository.port';
import { TAG_REPOSITORY } from '../tag.token';
import { TagResponseDto } from '../tag.dto';
import { TagPresenter } from '../tag.presenter';

export class GetTagBySlugQuery {
  constructor(readonly slug: string) {}
}

@QueryHandler(GetTagBySlugQuery)
export class GetTagBySlugHandler implements IQueryHandler<GetTagBySlugQuery> {
  constructor(@Inject(TAG_REPOSITORY) private readonly repo: ITagRepository) {}

  async execute(query: GetTagBySlugQuery): Promise<TagResponseDto> {
    const tag = await this.repo.findBySlug(query.slug);
    if (!tag)
      throw NotFoundError('Tag not found', {
        errorCode: TagErrorCode.NOT_FOUND,
        layer: ErrorLayer.APPLICATION,
      });

    return TagPresenter.toResponse(tag);
  }
}
