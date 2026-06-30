import { Module, forwardRef } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user';
import { CategoryModule } from '../category';
import { TagModule } from '../tag';
import { ProfileModule } from '../profile';
import { MediaModule } from '../media/media.module';
import { RichTextModule } from '../rich-text';
import { BlogPostPublicController } from './presentation/blog-post-public.controller';
import { BlogPostAdminController } from './presentation/blog-post-admin.controller';
import { BlogPostRepository } from './infrastructure/repositories/blog-post.repository';
import { BLOG_POST_REPOSITORY } from './application/blog-post.token';
import { CreatePostHandler, UpdatePostHandler, DeletePostHandler, RestorePostHandler } from './application/commands';
import {
  ListPostsHandler,
  GetPostByIdHandler,
  ListPublicPostsHandler,
  GetPublicPostBySlugHandler,
  ListFeaturedPostsHandler,
  ConvertMarkdownHandler,
} from './application/queries';

const commandHandlers = [CreatePostHandler, UpdatePostHandler, DeletePostHandler, RestorePostHandler];

const queryHandlers = [
  ListPostsHandler,
  GetPostByIdHandler,
  ListPublicPostsHandler,
  GetPublicPostBySlugHandler,
  ListFeaturedPostsHandler,
  ConvertMarkdownHandler,
];

@Module({
  imports: [
    CqrsModule,
    RichTextModule,
    forwardRef(() => AuthModule),
    forwardRef(() => UserModule),
    CategoryModule,
    TagModule,
    ProfileModule,
    MediaModule,
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
