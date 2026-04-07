import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { IBlogPostRepository } from '../ports/blog-post.repository.port';
import { BLOG_POST_REPOSITORY } from '../blog-post.token';
import { BlogPostPublicListItemDto } from '../blog-post.dto';
import { BlogPostPresenter } from '../blog-post.presenter';

export class ListFeaturedPostsQuery {}

@QueryHandler(ListFeaturedPostsQuery)
export class ListFeaturedPostsHandler implements IQueryHandler<ListFeaturedPostsQuery> {
  constructor(@Inject(BLOG_POST_REPOSITORY) private readonly repo: IBlogPostRepository) {}

  async execute(_query: ListFeaturedPostsQuery): Promise<BlogPostPublicListItemDto[]> {
    const posts = await this.repo.listFeatured();
    return posts.map(BlogPostPresenter.toPublicList);
  }
}
