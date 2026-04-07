import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ValidationError, BadRequestError, ErrorLayer, BlogPostErrorCode } from '@portfolio/shared/errors';
import { SlugValue } from '@portfolio/shared/types';
import { BaseCommand } from '../../../../shared/cqrs/base.command';
import { BlogPost } from '../../domain/entities/blog-post.entity';
import { IBlogPostRepository } from '../ports/blog-post.repository.port';
import { BLOG_POST_REPOSITORY } from '../blog-post.token';
import { ImportMarkdownSchema } from '../blog-post.dto';

const H1_REGEX = /^#\s+(.+?)\s*$/m;

export function extractH1Title(content: string): string | null {
  const match = content.match(H1_REGEX);
  return match ? match[1].trim() : null;
}

export class ImportMarkdownCommand extends BaseCommand {
  constructor(
    readonly dto: unknown,
    userId: string
  ) {
    super(userId);
  }
}

@CommandHandler(ImportMarkdownCommand)
export class ImportMarkdownHandler implements ICommandHandler<ImportMarkdownCommand> {
  constructor(@Inject(BLOG_POST_REPOSITORY) private readonly repo: IBlogPostRepository) {}

  async execute(command: ImportMarkdownCommand): Promise<string> {
    const { success, data, error } = ImportMarkdownSchema.safeParse(command.dto);
    if (!success)
      throw ValidationError(error, {
        errorCode: BlogPostErrorCode.NOT_FOUND,
        layer: ErrorLayer.APPLICATION,
        remarks: 'Import markdown validation failed',
      });

    const extractedTitle = extractH1Title(data.content);
    const title = data.title ?? extractedTitle;

    if (!title)
      throw BadRequestError('Markdown must contain an h1 heading or an explicit title', {
        errorCode: BlogPostErrorCode.CONTENT_REQUIRED,
        layer: ErrorLayer.APPLICATION,
      });

    const baseSlug = SlugValue.from(title);
    let candidateSlug = baseSlug;
    let counter = 2;
    while (await this.repo.slugExists(candidateSlug)) {
      candidateSlug = `${baseSlug}-${counter++}`;
      if (counter > 10) break;
    }

    const entity = BlogPost.create(
      {
        title,
        content: data.content,
        language: data.language,
        authorId: command.userId,
      },
      command.userId
    );

    const finalEntity =
      candidateSlug !== baseSlug ? BlogPost.load({ ...entity.toProps(), slug: candidateSlug }) : entity;

    return this.repo.add({
      entity: finalEntity,
      categoryIds: [],
      tagIds: [],
    });
  }
}
