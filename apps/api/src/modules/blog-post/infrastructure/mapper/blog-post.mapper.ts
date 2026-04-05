import { Prisma, BlogPost as PrismaBlogPost, PostCategory, PostTag, Category, Tag, Media } from '@prisma/client';
import { BlogPost } from '../../domain/entities/blog-post.entity';
import { IBlogPostProps, PostStatus } from '../../domain/blog-post.types';

export type PrismaBlogPostWithRelations = PrismaBlogPost & {
  categories: (PostCategory & { category: Category })[];
  tags: (PostTag & { tag: Tag })[];
  featuredImage: Media | null;
};

export interface BlogPostCategoryDto {
  id: string;
  name: string;
  slug: string;
}

export interface BlogPostTagDto {
  id: string;
  name: string;
  slug: string;
}

export interface BlogPostRelations {
  categories: BlogPostCategoryDto[];
  tags: BlogPostTagDto[];
}

export interface BlogPostReadResult {
  entity: BlogPost;
  relations: BlogPostRelations;
  featuredImageUrl: string | null;
}

export class BlogPostMapper {
  static toDomain(raw: PrismaBlogPostWithRelations): BlogPost {
    const props: IBlogPostProps = {
      id: raw.id,
      slug: raw.slug,
      language: raw.language as 'EN' | 'VI',
      title: raw.title,
      excerpt: raw.excerpt,
      content: raw.content,
      readTimeMinutes: raw.readTimeMinutes,
      status: raw.status as PostStatus,
      featured: raw.featured,
      publishedAt: raw.publishedAt,
      metaTitle: raw.metaTitle,
      metaDescription: raw.metaDescription,
      authorId: raw.authorId,
      featuredImageId: raw.featuredImageId,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      createdById: raw.createdById,
      updatedById: raw.updatedById,
      deletedAt: raw.deletedAt,
      deletedById: raw.deletedById,
    };
    return BlogPost.load(props);
  }

  static toRelations(raw: PrismaBlogPostWithRelations): BlogPostRelations {
    return {
      categories: raw.categories.map((c) => ({
        id: c.category.id,
        name: c.category.name,
        slug: c.category.slug,
      })),
      tags: raw.tags.map((t) => ({
        id: t.tag.id,
        name: t.tag.name,
        slug: t.tag.slug,
      })),
    };
  }

  static toReadResult(raw: PrismaBlogPostWithRelations): BlogPostReadResult {
    return {
      entity: BlogPostMapper.toDomain(raw),
      relations: BlogPostMapper.toRelations(raw),
      featuredImageUrl: raw.featuredImage?.url ?? null,
    };
  }

  static toPrisma(entity: BlogPost): Prisma.BlogPostUncheckedCreateInput {
    return {
      id: entity.id,
      slug: entity.slug,
      language: entity.language,
      title: entity.title,
      excerpt: entity.excerpt,
      content: entity.content,
      readTimeMinutes: entity.readTimeMinutes,
      status: entity.status,
      featured: entity.featured,
      publishedAt: entity.publishedAt,
      metaTitle: entity.metaTitle,
      metaDescription: entity.metaDescription,
      authorId: entity.authorId,
      featuredImageId: entity.featuredImageId,
      createdById: entity.createdById,
      updatedById: entity.updatedById,
      deletedAt: entity.deletedAt,
      deletedById: entity.deletedById,
    };
  }
}
