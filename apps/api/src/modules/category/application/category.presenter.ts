import { Category } from '../domain/entities/category.entity';
import { CategoryResponseDto } from './category.dto';

export class CategoryPresenter {
  static toResponse(category: Category): CategoryResponseDto {
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      displayOrder: category.displayOrder,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      deletedAt: category.deletedAt ?? null,
    };
  }
}
