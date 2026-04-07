import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ValidationError, ErrorLayer, BlogPostErrorCode } from '@portfolio/shared/errors';
import { SlugValue } from '@portfolio/shared/types';
import { BaseCommand } from '../../../../shared/cqrs/base.command';
import { BlogPost } from '../../domain/entities/blog-post.entity';
import { IBlogPostRepository } from '../ports/blog-post.repository.port';
import { BLOG_POST_REPOSITORY } from '../blog-post.token';
import { CreateBlogPostSchema } from '../blog-post.dto';

export class CreatePostCommand extends BaseCommand {
  constructor(
    readonly dto: unknown,
    userId: string
  ) {
    super(userId);
  }
}

@CommandHandler(CreatePostCommand)
export class CreatePostHandler implements ICommandHandler<CreatePostCommand> {
  constructor(@Inject(BLOG_POST_REPOSITORY) private readonly repo: IBlogPostRepository) {}

  async execute(command: CreatePostCommand): Promise<string> {
    const { success, data, error } = CreateBlogPostSchema.safeParse(command.dto);
    if (!success)
      throw ValidationError(error, {
        errorCode: BlogPostErrorCode.NOT_FOUND,
        layer: ErrorLayer.APPLICATION,
        remarks: 'Blog post creation validation failed',
      });

    const baseSlug = SlugValue.from(data.title);
    let candidateSlug = baseSlug;
    let counter = 2;
    while (await this.repo.slugExists(candidateSlug)) {
      candidateSlug = `${baseSlug}-${counter++}`;
      if (counter > 10) break;
    }

    const entity = BlogPost.create(
      {
        title: data.title,
        content: data.content,
        language: data.language,
        excerpt: data.excerpt,
        featured: data.featured,
        authorId: command.userId,
        featuredImageId: data.featuredImageId ?? undefined,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
      },
      command.userId
    );

    const finalEntity =
      candidateSlug !== baseSlug ? BlogPost.load({ ...entity.toProps(), slug: candidateSlug }) : entity;

    // Apply requested status (entity defaults to DRAFT, then publish() if needed)
    const withStatus =
      data.status === 'PUBLISHED'
        ? finalEntity.publish(command.userId)
        : data.status !== 'DRAFT'
          ? BlogPost.load({ ...finalEntity.toProps(), status: data.status })
          : finalEntity;

    return this.repo.add({
      entity: withStatus,
      categoryIds: data.categoryIds,
      tagIds: data.tagIds,
    });
  }
}
