import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ConflictError, ValidationError, ErrorLayer, CategoryErrorCode } from '@portfolio/shared/errors';
import { BaseCommand } from '../../../../shared/cqrs/base.command';
import { Category } from '../../domain/entities/category.entity';
import { ICategoryRepository } from '../ports/category.repository.port';
import { CATEGORY_REPOSITORY } from '../category.token';
import { CreateCategorySchema } from '../category.dto';

export class CreateCategoryCommand extends BaseCommand {
  constructor(
    readonly dto: unknown,
    userId: string
  ) {
    super(userId);
  }
}

@CommandHandler(CreateCategoryCommand)
export class CreateCategoryHandler implements ICommandHandler<CreateCategoryCommand> {
  constructor(@Inject(CATEGORY_REPOSITORY) private readonly repo: ICategoryRepository) {}

  async execute(command: CreateCategoryCommand): Promise<string> {
    const { success, data, error } = CreateCategorySchema.safeParse(command.dto);
    if (!success)
      throw ValidationError(error, {
        errorCode: CategoryErrorCode.INVALID_INPUT,
        layer: ErrorLayer.APPLICATION,
        remarks: 'Category creation validation failed',
      });

    const existing = await this.repo.findByName(data.name);
    if (existing)
      throw ConflictError('Category with this name already exists', {
        errorCode: CategoryErrorCode.NAME_TAKEN,
        layer: ErrorLayer.APPLICATION,
      });

    const category = Category.create(data, command.userId);
    return this.repo.add(category);
  }
}
