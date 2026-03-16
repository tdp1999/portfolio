import { Tag as PrismaTag } from '@prisma/client';
import { Tag } from '../../domain/entities/tag.entity';
import { ITagProps } from '../../domain/tag.types';

export class TagMapper {
  static toDomain(raw: PrismaTag): Tag {
    const props: ITagProps = {
      id: raw.id,
      name: raw.name,
      slug: raw.slug,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      createdById: raw.createdById,
      updatedById: raw.updatedById,
      deletedAt: raw.deletedAt,
      deletedById: raw.deletedById,
    };
    return Tag.load(props);
  }

  static toPrisma(tag: Tag): Omit<PrismaTag, 'createdAt' | 'updatedAt'> {
    return {
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      createdById: tag.createdById,
      updatedById: tag.updatedById,
      deletedAt: tag.deletedAt,
      deletedById: tag.deletedById,
    };
  }
}
