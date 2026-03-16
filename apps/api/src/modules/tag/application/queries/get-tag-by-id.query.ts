import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { NotFoundError, ErrorLayer, TagErrorCode } from '@portfolio/shared/errors';
import { IdentifierValue } from '@portfolio/shared/types';
import { ITagRepository } from '../ports/tag.repository.port';
import { TAG_REPOSITORY } from '../tag.token';
import { TagResponseDto } from '../tag.dto';

export class GetTagByIdQuery {
  constructor(readonly tagId: string) {}
}

@QueryHandler(GetTagByIdQuery)
export class GetTagByIdHandler implements IQueryHandler<GetTagByIdQuery> {
  constructor(@Inject(TAG_REPOSITORY) private readonly repo: ITagRepository) {}

  async execute(query: GetTagByIdQuery): Promise<TagResponseDto> {
    IdentifierValue.from(query.tagId);

    const tag = await this.repo.findById(query.tagId);
    if (!tag)
      throw NotFoundError('Tag not found', {
        errorCode: TagErrorCode.NOT_FOUND,
        layer: ErrorLayer.APPLICATION,
      });

    return {
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      createdAt: tag.createdAt,
      updatedAt: tag.updatedAt,
    };
  }
}
