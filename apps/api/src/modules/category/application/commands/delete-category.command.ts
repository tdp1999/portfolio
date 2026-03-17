import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { NotFoundError, BadRequestError, ErrorLayer, CategoryErrorCode } from '@portfolio/shared/errors';
import { IdentifierValue } from '@portfolio/shared/types';
import { BaseCommand } from '../../../../shared/cqrs/base.command';
import { ICategoryRepository } from '../ports/category.repository.port';
import { CATEGORY_REPOSITORY } from '../category.token';

export class DeleteCategoryCommand extends BaseCommand {
  constructor(
    readonly categoryId: string,
    userId: string
  ) {
    super(userId);
  }
}

@CommandHandler(DeleteCategoryCommand)
export class DeleteCategoryHandler implements ICommandHandler<DeleteCategoryCommand> {
  constructor(@Inject(CATEGORY_REPOSITORY) private readonly repo: ICategoryRepository) {}

  async execute(command: DeleteCategoryCommand): Promise<void> {
    IdentifierValue.from(command.categoryId);

    const category = await this.repo.findById(command.categoryId);
    if (!category)
      throw NotFoundError('Category not found', {
        errorCode: CategoryErrorCode.NOT_FOUND,
        layer: ErrorLayer.APPLICATION,
      });

    if (category.isDeleted)
      throw BadRequestError('Category is already deleted', {
        errorCode: CategoryErrorCode.ALREADY_DELETED,
        layer: ErrorLayer.APPLICATION,
      });

    const deleted = category.softDelete(command.userId);
    await this.repo.remove(command.categoryId, deleted);
  }
}
