import { Module, forwardRef } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user';
import { CategoryModule } from '../category';
import { TagModule } from '../tag';
import { ProfileModule } from '../profile';
import { BlogPostPublicController } from './presentation/blog-post-public.controller';
import { BlogPostAdminController } from './presentation/blog-post-admin.controller';
import { BlogPostRepository } from './infrastructure/repositories/blog-post.repository';
import { BLOG_POST_REPOSITORY } from './application/blog-post.token';
import {
  CreatePostHandler,
  UpdatePostHandler,
  DeletePostHandler,
  RestorePostHandler,
  ImportMarkdownHandler,
} from './application/commands';
import {
  ListPostsHandler,
  GetPostByIdHandler,
  ListPublicPostsHandler,
  GetPublicPostBySlugHandler,
  ListFeaturedPostsHandler,
} from './application/queries';

const commandHandlers = [
  CreatePostHandler,
  UpdatePostHandler,
  DeletePostHandler,
  RestorePostHandler,
  ImportMarkdownHandler,
];

const queryHandlers = [
  ListPostsHandler,
  GetPostByIdHandler,
  ListPublicPostsHandler,
  GetPublicPostBySlugHandler,
  ListFeaturedPostsHandler,
];

@Module({
  imports: [
    CqrsModule,
    forwardRef(() => AuthModule),
    forwardRef(() => UserModule),
    CategoryModule,
    TagModule,
    ProfileModule,
  ],
  controllers: [BlogPostPublicController, BlogPostAdminController],
  providers: [
    {
      provide: BLOG_POST_REPOSITORY,
      useClass: BlogPostRepository,
    },
    ...commandHandlers,
    ...queryHandlers,
  ],
})
export class BlogPostModule {}
