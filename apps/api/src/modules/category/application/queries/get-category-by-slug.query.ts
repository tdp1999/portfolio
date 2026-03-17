import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { NotFoundError, ErrorLayer, CategoryErrorCode } from '@portfolio/shared/errors';
import { ICategoryRepository } from '../ports/category.repository.port';
import { CATEGORY_REPOSITORY } from '../category.token';
import { CategoryResponseDto } from '../category.dto';
import { CategoryPresenter } from '../category.presenter';

export class GetCategoryBySlugQuery {
  constructor(readonly slug: string) {}
}

@QueryHandler(GetCategoryBySlugQuery)
export class GetCategoryBySlugHandler implements IQueryHandler<GetCategoryBySlugQuery> {
  constructor(@Inject(CATEGORY_REPOSITORY) private readonly repo: ICategoryRepository) {}

  async execute(query: GetCategoryBySlugQuery): Promise<CategoryResponseDto> {
    const category = await this.repo.findBySlug(query.slug);
    if (!category)
      throw NotFoundError('Category not found', {
        errorCode: CategoryErrorCode.NOT_FOUND,
        layer: ErrorLayer.APPLICATION,
      });

    return CategoryPresenter.toResponse(category);
  }
}
