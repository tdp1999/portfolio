import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { NotFoundError, BadRequestError, ErrorLayer, BlogPostErrorCode } from '@portfolio/shared/errors';
import { IdentifierValue } from '@portfolio/shared/types';
import { BaseCommand } from '../../../../shared/cqrs/base.command';
import { IBlogPostRepository } from '../ports/blog-post.repository.port';
import { BLOG_POST_REPOSITORY } from '../blog-post.token';

export class RestorePostCommand extends BaseCommand {
  constructor(
    readonly postId: string,
    userId: string
  ) {
    super(userId);
  }
}

@CommandHandler(RestorePostCommand)
export class RestorePostHandler implements ICommandHandler<RestorePostCommand> {
  constructor(@Inject(BLOG_POST_REPOSITORY) private readonly repo: IBlogPostRepository) {}

  async execute(command: RestorePostCommand): Promise<void> {
    IdentifierValue.from(command.postId);

    const existing = await this.repo.findByIdIncludeDeleted(command.postId);
    if (!existing)
      throw NotFoundError('Blog post not found', {
        errorCode: BlogPostErrorCode.NOT_FOUND,
        layer: ErrorLayer.APPLICATION,
      });

    if (!existing.entity.isDeleted)
      throw BadRequestError('Blog post is not deleted', {
        errorCode: BlogPostErrorCode.NOT_FOUND,
        layer: ErrorLayer.APPLICATION,
      });

    const restored = existing.entity.restore(command.userId);
    await this.repo.restore(command.postId, restored);
  }
}
