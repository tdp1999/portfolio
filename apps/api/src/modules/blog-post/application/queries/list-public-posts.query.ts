import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ValidationError, ErrorLayer, BlogPostErrorCode } from '@portfolio/shared/errors';
import { IBlogPostRepository } from '../ports/blog-post.repository.port';
import { BLOG_POST_REPOSITORY } from '../blog-post.token';
import { ICategoryRepository } from '../../../category/application/ports/category.repository.port';
import { CATEGORY_REPOSITORY } from '../../../category/application/category.token';
import { ITagRepository } from '../../../tag/application/ports/tag.repository.port';
import { TAG_REPOSITORY } from '../../../tag/application/tag.token';
import { PublicBlogPostQuerySchema, BlogPostPublicListItemDto } from '../blog-post.dto';
import { BlogPostPresenter } from '../blog-post.presenter';

export class ListPublicPostsQuery {
  constructor(readonly params: unknown) {}
}

@QueryHandler(ListPublicPostsQuery)
export class ListPublicPostsHandler implements IQueryHandler<ListPublicPostsQuery> {
  constructor(
    @Inject(BLOG_POST_REPOSITORY) private readonly repo: IBlogPostRepository,
    @Inject(CATEGORY_REPOSITORY) private readonly categoryRepo: ICategoryRepository,
    @Inject(TAG_REPOSITORY) private readonly tagRepo: ITagRepository
  ) {}

  async execute(
    query: ListPublicPostsQuery
  ): Promise<{ data: BlogPostPublicListItemDto[]; total: number; page: number; limit: number }> {
    const { success, data, error } = PublicBlogPostQuerySchema.safeParse(query.params);
    if (!success)
      throw ValidationError(error, {
        errorCode: BlogPostErrorCode.NOT_FOUND,
        layer: ErrorLayer.APPLICATION,
        remarks: 'List public blog posts validation failed',
      });

    let categoryId: string | undefined;
    if (data.categorySlug) {
      const cat = await this.categoryRepo.findBySlug(data.categorySlug);
      if (!cat) return { data: [], total: 0, page: data.page, limit: data.limit };
      categoryId = cat.id;
    }

    let tagId: string | undefined;
    if (data.tagSlug) {
      const tag = await this.tagRepo.findBySlug(data.tagSlug);
      if (!tag) return { data: [], total: 0, page: data.page, limit: data.limit };
      tagId = tag.id;
    }

    const { data: posts, total } = await this.repo.listPublic({
      page: data.page,
      limit: data.limit,
      categoryId,
      tagId,
      language: data.language,
    });

    return {
      data: posts.map(BlogPostPresenter.toPublicList),
      total,
      page: data.page,
      limit: data.limit,
    };
  }
}
