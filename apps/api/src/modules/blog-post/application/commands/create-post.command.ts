import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ValidationError, ErrorLayer, BlogPostErrorCode } from '@portfolio/shared/errors';
import { SlugValue } from '@portfolio/shared/types';
import { BaseCommand } from '../../../../shared/cqrs/base.command';
import { BlogPost } from '../../domain/entities/blog-post.entity';
import { IBlogPostRepository } from '../ports/blog-post.repository.port';
import { BLOG_POST_REPOSITORY } from '../blog-post.token';
import { CreateBlogPostSchema } from '../blog-post.dto';
import { RichTextService } from '../../../rich-text';
import { wrapContentByLanguage } from '../blog-content-rich.util';

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
  constructor(
    @Inject(BLOG_POST_REPOSITORY) private readonly repo: IBlogPostRepository,
    private readonly richText: RichTextService
  ) {}

  async execute(command: CreatePostCommand): Promise<string> {
    const { success, data, error } = CreateBlogPostSchema.safeParse(command.dto);
    if (!success)
      throw ValidationError(error, {
        errorCode: BlogPostErrorCode.INVALID_INPUT,
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
        featuredImageId: data.featuredImageId,
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

    // Rich-text write path: the console sends a single editor document; wrap it
    // into the bilingual envelope keyed by the post's language and canonicalize.
    const persisted = data.contentJson
      ? withStatus.withContentRichText(
          await this.richText.toCanonicalFormTranslatable(
            wrapContentByLanguage(data.contentJson, withStatus.language),
            'blog-post.content'
          ),
          command.userId
        )
      : withStatus;

    return this.repo.add({
      entity: persisted,
      categoryIds: data.categoryIds,
      tagIds: data.tagIds,
    });
  }
}
