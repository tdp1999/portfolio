import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { NotFoundError, ErrorLayer, BlogPostErrorCode } from '@portfolio/shared/errors';
import { IBlogPostRepository } from '../ports/blog-post.repository.port';
import { BLOG_POST_REPOSITORY } from '../blog-post.token';
import { BlogPostAdminDetailDto } from '../blog-post.dto';
import { BlogPostPresenter } from '../blog-post.presenter';

export class GetPostByIdQuery {
  constructor(readonly postId: string) {}
}

@QueryHandler(GetPostByIdQuery)
export class GetPostByIdHandler implements IQueryHandler<GetPostByIdQuery> {
  constructor(@Inject(BLOG_POST_REPOSITORY) private readonly repo: IBlogPostRepository) {}

  async execute(query: GetPostByIdQuery): Promise<BlogPostAdminDetailDto> {
    const post = await this.repo.findByIdIncludeDeleted(query.postId);
    if (!post)
      throw NotFoundError('Blog post not found', {
        errorCode: BlogPostErrorCode.NOT_FOUND,
        layer: ErrorLayer.APPLICATION,
      });

    return BlogPostPresenter.toAdmin(post);
  }
}
