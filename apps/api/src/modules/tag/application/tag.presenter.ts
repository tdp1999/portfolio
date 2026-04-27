import { Tag } from '../domain/entities/tag.entity';
import { TagResponseDto } from './tag.dto';

export class TagPresenter {
  static toResponse(tag: Tag): TagResponseDto {
    return {
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      createdAt: tag.createdAt,
      updatedAt: tag.updatedAt,
      deletedAt: tag.deletedAt ?? null,
    };
  }
}
