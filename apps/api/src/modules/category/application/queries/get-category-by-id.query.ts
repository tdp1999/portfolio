import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { NotFoundError, ErrorLayer, CategoryErrorCode } from '@portfolio/shared/errors';
import { IdentifierValue } from '@portfolio/shared/types';
import { ICategoryRepository } from '../ports/category.repository.port';
import { CATEGORY_REPOSITORY } from '../category.token';
import { CategoryResponseDto } from '../category.dto';
import { CategoryPresenter } from '../category.presenter';

export class GetCategoryByIdQuery {
  constructor(readonly categoryId: string) {}
}

@QueryHandler(GetCategoryByIdQuery)
export class GetCategoryByIdHandler implements IQueryHandler<GetCategoryByIdQuery> {
  constructor(@Inject(CATEGORY_REPOSITORY) private readonly repo: ICategoryRepository) {}

  async execute(query: GetCategoryByIdQuery): Promise<CategoryResponseDto> {
    IdentifierValue.from(query.categoryId);

    const category = await this.repo.findById(query.categoryId);
    if (!category)
      throw NotFoundError('Category not found', {
        errorCode: CategoryErrorCode.NOT_FOUND,
        layer: ErrorLayer.APPLICATION,
      });

    return CategoryPresenter.toResponse(category);
  }
}
