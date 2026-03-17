import { Module, forwardRef } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user';
import { CategoryController } from './presentation/category.controller';
import { CategoryRepository } from './infrastructure/repositories/category.repository';
import { CATEGORY_REPOSITORY } from './application/category.token';
import { CreateCategoryHandler, UpdateCategoryHandler, DeleteCategoryHandler } from './application/commands';
import { ListCategoriesHandler, GetCategoryByIdHandler, GetCategoryBySlugHandler } from './application/queries';

const commandHandlers = [CreateCategoryHandler, UpdateCategoryHandler, DeleteCategoryHandler];
const queryHandlers = [ListCategoriesHandler, GetCategoryByIdHandler, GetCategoryBySlugHandler];

@Module({
  imports: [CqrsModule, forwardRef(() => AuthModule), forwardRef(() => UserModule)],
  controllers: [CategoryController],
  providers: [
    {
      provide: CATEGORY_REPOSITORY,
      useClass: CategoryRepository,
    },
    ...commandHandlers,
    ...queryHandlers,
  ],
  exports: [CATEGORY_REPOSITORY],
})
export class CategoryModule {}
