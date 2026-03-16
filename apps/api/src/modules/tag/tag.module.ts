import { Module, forwardRef } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user';
import { TagController } from './presentation/tag.controller';
import { TagRepository } from './infrastructure/repositories/tag.repository';
import { TAG_REPOSITORY } from './application/tag.token';
import { CreateTagHandler, UpdateTagHandler, DeleteTagHandler } from './application/commands';
import { ListTagsHandler, GetTagByIdHandler, GetTagBySlugHandler } from './application/queries';

const commandHandlers = [CreateTagHandler, UpdateTagHandler, DeleteTagHandler];
const queryHandlers = [ListTagsHandler, GetTagByIdHandler, GetTagBySlugHandler];

@Module({
  imports: [CqrsModule, forwardRef(() => AuthModule), forwardRef(() => UserModule)],
  controllers: [TagController],
  providers: [
    {
      provide: TAG_REPOSITORY,
      useClass: TagRepository,
    },
    ...commandHandlers,
    ...queryHandlers,
  ],
  exports: [TAG_REPOSITORY],
})
export class TagModule {}
