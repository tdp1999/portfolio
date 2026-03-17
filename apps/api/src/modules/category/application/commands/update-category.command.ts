import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ValidationError, NotFoundError, ConflictError, ErrorLayer, CategoryErrorCode } from '@portfolio/shared/errors';
import { IdentifierValue } from '@portfolio/shared/types';
import { BaseCommand } from '../../../../shared/cqrs/base.command';
import { ICategoryRepository } from '../ports/category.repository.port';
import { CATEGORY_REPOSITORY } from '../category.token';
import { UpdateCategorySchema } from '../category.dto';

export class UpdateCategoryCommand extends BaseCommand {
  constructor(
    readonly categoryId: string,
    readonly dto: unknown,
    userId: string
  ) {
    super(userId);
  }
}

@CommandHandler(UpdateCategoryCommand)
export class UpdateCategoryHandler implements ICommandHandler<UpdateCategoryCommand> {
  constructor(@Inject(CATEGORY_REPOSITORY) private readonly repo: ICategoryRepository) {}

  async execute(command: UpdateCategoryCommand): Promise<void> {
    IdentifierValue.from(command.categoryId);

    const { success, data, error } = UpdateCategorySchema.safeParse(command.dto);
    if (!success)
      throw ValidationError(error, {
        errorCode: CategoryErrorCode.INVALID_INPUT,
        layer: ErrorLayer.APPLICATION,
        remarks: 'Category update validation failed',
      });

    const category = await this.repo.findById(command.categoryId);
    if (!category)
      throw NotFoundError('Category not found', {
        errorCode: CategoryErrorCode.NOT_FOUND,
        layer: ErrorLayer.APPLICATION,
      });

    if (data.name) {
      const existingWithName = await this.repo.findByName(data.name);
      if (existingWithName && existingWithName.id !== command.categoryId)
        throw ConflictError('Category with this name already exists', {
          errorCode: CategoryErrorCode.NAME_TAKEN,
          layer: ErrorLayer.APPLICATION,
        });
    }

    const updated = category.update(data, command.userId);
    await this.repo.update(command.categoryId, updated);
  }
}
