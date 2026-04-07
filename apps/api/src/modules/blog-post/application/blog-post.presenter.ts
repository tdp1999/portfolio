import { BlogPostReadResult } from '../infrastructure/mapper/blog-post.mapper';
import {
  BlogPostAdminDetailDto,
  BlogPostAdminListItemDto,
  BlogPostAuthorDto,
  BlogPostPublicDetailDto,
  BlogPostPublicListItemDto,
} from './blog-post.dto';

export class BlogPostPresenter {
  static toPublicList(item: BlogPostReadResult): BlogPostPublicListItemDto {
    const { entity, relations, featuredImageUrl } = item;
    return {
      slug: entity.slug,
      title: entity.title,
      excerpt: entity.excerpt,
      language: entity.language,
      featuredImageUrl,
      categories: relations.categories,
      tags: relations.tags,
      readTimeMinutes: entity.readTimeMinutes,
      publishedAt: entity.publishedAt,
    };
  }

  static toPublicDetail(
    item: BlogPostReadResult,
    author: BlogPostAuthorDto | null,
    relatedPosts: BlogPostReadResult[]
  ): BlogPostPublicDetailDto {
    return {
      ...BlogPostPresenter.toPublicList(item),
      content: item.entity.content,
      metaTitle: item.entity.metaTitle,
      metaDescription: item.entity.metaDescription,
      author,
      relatedPosts: relatedPosts.map(BlogPostPresenter.toPublicList),
    };
  }

  static toAdminList(item: BlogPostReadResult): BlogPostAdminListItemDto {
    const { entity, relations, featuredImageUrl } = item;
    return {
      id: entity.id,
      slug: entity.slug,
      title: entity.title,
      language: entity.language,
      status: entity.status,
      featured: entity.featured,
      publishedAt: entity.publishedAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
      categories: relations.categories,
      tags: relations.tags,
      featuredImageUrl,
    };
  }

  static toAdmin(item: BlogPostReadResult): BlogPostAdminDetailDto {
    const { entity } = item;
    return {
      ...BlogPostPresenter.toAdminList(item),
      excerpt: entity.excerpt,
      content: entity.content,
      readTimeMinutes: entity.readTimeMinutes,
      metaTitle: entity.metaTitle,
      metaDescription: entity.metaDescription,
      authorId: entity.authorId,
      featuredImageId: entity.featuredImageId,
      createdById: entity.createdById,
      updatedById: entity.updatedById,
      deletedById: entity.deletedById,
    };
  }
}
