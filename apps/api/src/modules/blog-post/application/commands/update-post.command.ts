import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ValidationError, NotFoundError, ErrorLayer, BlogPostErrorCode } from '@portfolio/shared/errors';
import { IdentifierValue } from '@portfolio/shared/types';
import { BaseCommand } from '../../../../shared/cqrs/base.command';
import { IBlogPostRepository } from '../ports/blog-post.repository.port';
import { BLOG_POST_REPOSITORY } from '../blog-post.token';
import { UpdateBlogPostSchema } from '../blog-post.dto';
import { RichTextService } from '../../../rich-text';
import { wrapContentByLanguage } from '../blog-content-rich.util';

export class UpdatePostCommand extends BaseCommand {
  constructor(
    readonly postId: string,
    readonly dto: unknown,
    userId: string
  ) {
    super(userId);
  }
}

@CommandHandler(UpdatePostCommand)
export class UpdatePostHandler implements ICommandHandler<UpdatePostCommand> {
  constructor(
    @Inject(BLOG_POST_REPOSITORY) private readonly repo: IBlogPostRepository,
    private readonly richText: RichTextService
  ) {}

  async execute(command: UpdatePostCommand): Promise<void> {
    IdentifierValue.from(command.postId);

    const { success, data, error } = UpdateBlogPostSchema.safeParse(command.dto);
    if (!success)
      throw ValidationError(error, {
        errorCode: BlogPostErrorCode.INVALID_INPUT,
        layer: ErrorLayer.APPLICATION,
        remarks: 'Blog post update validation failed',
      });

    const existing = await this.repo.findByIdIncludeDeleted(command.postId);
    if (!existing)
      throw NotFoundError('Blog post not found', {
        errorCode: BlogPostErrorCode.NOT_FOUND,
        layer: ErrorLayer.APPLICATION,
      });

    // entity.update() handles readTime recalc + auto publishedAt on PUBLISHED transition
    let updated = existing.entity.update(
      {
        title: data.title,
        content: data.content,
        language: data.language,
        excerpt: data.excerpt,
        status: data.status,
        featured: data.featured,
        featuredImageId: data.featuredImageId,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
      },
      command.userId
    );

    // Rich-text write path: wrap the single editor document into the bilingual
    // envelope keyed by the (possibly just-updated) post language and canonicalize.
    if (data.contentJson) {
      const rich = await this.richText.toCanonicalFormTranslatable(
        wrapContentByLanguage(data.contentJson, updated.language),
        'blog-post.content'
      );
      updated = updated.withContentRichText(rich, command.userId);
    }

    // Junction tables: replace-all when arrays provided, else keep existing
    const categoryIds =
      data.categoryIds !== undefined ? data.categoryIds : existing.relations.categories.map((c) => c.id);
    const tagIds = data.tagIds !== undefined ? data.tagIds : existing.relations.tags.map((t) => t.id);

    await this.repo.update(command.postId, {
      entity: updated,
      categoryIds,
      tagIds,
    });
  }
}
