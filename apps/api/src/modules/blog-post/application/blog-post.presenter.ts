import type { MediaRefMap } from '@portfolio/shared/features/rte-core/image-refs';
import { BlogPostReadResult } from '../infrastructure/mapper/blog-post.mapper';
import {
  BlogPostAdminDetailDto,
  BlogPostAdminListItemDto,
  BlogPostAuthorDto,
  BlogPostJsonLdDto,
  BlogPostPublicDetailDto,
  BlogPostPublicListItemDto,
} from './blog-post.dto';

// Trailing slash stripped so callers can append `/blog/<slug>` cleanly.
const resolveSiteUrl = (): string => (process.env['FRONTEND_URL'] || 'https://thunderphong.com').replace(/\/+$/, '');

export class BlogPostPresenter {
  static toPublicList(item: BlogPostReadResult): BlogPostPublicListItemDto {
    const { entity, relations, featuredImageUrl } = item;
    return {
      slug: entity.slug,
      title: entity.title,
      excerpt: entity.excerpt,
      language: entity.language,
      featured: entity.featured,
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
    relatedPosts: BlogPostReadResult[],
    mediaRefs: MediaRefMap = {}
  ): BlogPostPublicDetailDto {
    return {
      ...BlogPostPresenter.toPublicList(item),
      contentJson: item.entity.contentJson,
      contentHtml: item.entity.contentHtml,
      contentCanonical: item.entity.contentCanonical,
      contentSchemaVersion: item.entity.contentSchemaVersion,
      mediaRefs,
      metaTitle: item.entity.metaTitle,
      metaDescription: item.entity.metaDescription,
      author,
      relatedPosts: relatedPosts.map(BlogPostPresenter.toPublicList),
      jsonLd: BlogPostPresenter.toJsonLd(item, author),
    };
  }

  // schema.org BlogPosting payload — embedded in the detail response (Option B in
  // task 348) so SSR can inject without a second round-trip. Bound to PUBLISHED
  // posts only because `findBySlug` filters drafts; drafts never reach this code.
  static toJsonLd(item: BlogPostReadResult, author: BlogPostAuthorDto | null): BlogPostJsonLdDto {
    const { entity, featuredImageUrl } = item;
    const site = resolveSiteUrl();
    const authorName = author?.name ?? 'Phuong Tran';

    const dto: BlogPostJsonLdDto = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: entity.title,
      description: entity.metaDescription ?? entity.excerpt ?? null,
      datePublished: (entity.publishedAt ?? entity.createdAt).toISOString(),
      dateModified: entity.updatedAt.toISOString(),
      author: {
        '@type': 'Person',
        name: authorName,
        url: null,
      },
      publisher: {
        '@type': 'Person',
        name: authorName,
      },
      mainEntityOfPage: `${site}/blog/${entity.slug}`,
      inLanguage: entity.language === 'VI' ? 'vi' : 'en',
    };

    if (featuredImageUrl) dto.image = featuredImageUrl;
    return dto;
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
      contentJson: entity.contentJson,
      contentHtml: entity.contentHtml,
      contentSchemaVersion: entity.contentSchemaVersion,
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
