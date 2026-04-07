import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ValidationError, ErrorLayer, BlogPostErrorCode } from '@portfolio/shared/errors';
import { IBlogPostRepository } from '../ports/blog-post.repository.port';
import { BLOG_POST_REPOSITORY } from '../blog-post.token';
import { BlogPostQuerySchema, BlogPostAdminListItemDto } from '../blog-post.dto';
import { BlogPostPresenter } from '../blog-post.presenter';

export class ListPostsQuery {
  constructor(readonly params: unknown) {}
}

@QueryHandler(ListPostsQuery)
export class ListPostsHandler implements IQueryHandler<ListPostsQuery> {
  constructor(@Inject(BLOG_POST_REPOSITORY) private readonly repo: IBlogPostRepository) {}

  async execute(
    query: ListPostsQuery
  ): Promise<{ data: BlogPostAdminListItemDto[]; total: number; page: number; limit: number }> {
    const { success, data, error } = BlogPostQuerySchema.safeParse(query.params);
    if (!success)
      throw ValidationError(error, {
        errorCode: BlogPostErrorCode.NOT_FOUND,
        layer: ErrorLayer.APPLICATION,
        remarks: 'List blog posts validation failed',
      });

    const { data: posts, total } = await this.repo.list({
      page: data.page,
      limit: data.limit,
      search: data.search,
      includeDeleted: data.includeDeleted,
      status: data.status,
      language: data.language,
    });

    return {
      data: posts.map(BlogPostPresenter.toAdminList),
      total,
      page: data.page,
      limit: data.limit,
    };
  }
}
