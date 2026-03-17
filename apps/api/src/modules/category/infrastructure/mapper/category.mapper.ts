import { Category as PrismaCategory } from '@prisma/client';
import { Category } from '../../domain/entities/category.entity';
import { ICategoryProps } from '../../domain/category.types';

export class CategoryMapper {
  static toDomain(raw: PrismaCategory): Category {
    const props: ICategoryProps = {
      id: raw.id,
      name: raw.name,
      slug: raw.slug,
      description: raw.description,
      displayOrder: raw.displayOrder,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      createdById: raw.createdById,
      updatedById: raw.updatedById,
      deletedAt: raw.deletedAt,
      deletedById: raw.deletedById,
    };
    return Category.load(props);
  }

  static toPrisma(category: Category): Omit<PrismaCategory, 'createdAt' | 'updatedAt'> {
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      displayOrder: category.displayOrder,
      createdById: category.createdById,
      updatedById: category.updatedById,
      deletedAt: category.deletedAt,
      deletedById: category.deletedById,
    };
  }
}
