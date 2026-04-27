import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ValidationError, ErrorLayer, CategoryErrorCode } from '@portfolio/shared/errors';
import { ICategoryRepository } from '../ports/category.repository.port';
import { CATEGORY_REPOSITORY } from '../category.token';
import { CategoryQuerySchema, CategoryResponseDto } from '../category.dto';
import { CategoryPresenter } from '../category.presenter';

export class ListCategoriesQuery {
  constructor(readonly params: unknown) {}
}

@QueryHandler(ListCategoriesQuery)
export class ListCategoriesHandler implements IQueryHandler<ListCategoriesQuery> {
  constructor(@Inject(CATEGORY_REPOSITORY) private readonly repo: ICategoryRepository) {}

  async execute(
    query: ListCategoriesQuery
  ): Promise<{ data: CategoryResponseDto[]; total: number; page: number; limit: number }> {
    const { success, data, error } = CategoryQuerySchema.safeParse(query.params);
    if (!success)
      throw ValidationError(error, {
        errorCode: CategoryErrorCode.INVALID_INPUT,
        layer: ErrorLayer.APPLICATION,
        remarks: 'List categories pagination validation failed',
      });

    const { data: categories, total } = await this.repo.findAll({
      page: data.page,
      limit: data.limit,
      search: data.search,
      includeDeleted: data.includeDeleted,
      sortBy: data.sortBy,
      sortDir: data.sortDir,
    });

    return {
      data: categories.map(CategoryPresenter.toResponse),
      total,
      page: data.page,
      limit: data.limit,
    };
  }
}
