import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaginatedResult } from '@portfolio/shared/types';
import { ConflictError, ErrorLayer, BlogPostErrorCode } from '@portfolio/shared/errors';
import { PrismaService } from '../../../../shared/prisma';
import {
  IBlogPostRepository,
  BlogPostCreateInput,
  BlogPostUpdateInput,
  BlogPostFindAllOptions,
  BlogPostListPublicOptions,
  BulkPostTarget,
} from '../../application/ports/blog-post.repository.port';
import { BlogPost } from '../../domain/entities/blog-post.entity';
import { PostStatus } from '../../domain/blog-post.types';
import { BlogPostMapper, PrismaBlogPostWithRelations, BlogPostReadResult } from '../mapper/blog-post.mapper';

const fullInclude = {
  categories: { include: { category: true } },
  tags: { include: { tag: true } },
  featuredImage: true,
} as const;

@Injectable()
export class BlogPostRepository implements IBlogPostRepository {
  constructor(private readonly prisma: PrismaService) {}

  async add(input: BlogPostCreateInput): Promise<string> {
    const { entity, categoryIds, tagIds } = input;
    try {
      const data = BlogPostMapper.toPrisma(entity);
      const created = await this.prisma.blogPost.create({
        data: {
          ...data,
          categories: {
            create: categoryIds.map((categoryId) => ({ categoryId })),
          },
          tags: {
            create: tagIds.map((tagId) => ({ tagId })),
          },
        },
      });
      return created.id;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw ConflictError('Blog post with this slug already exists', {
          errorCode: BlogPostErrorCode.SLUG_CONFLICT,
          layer: ErrorLayer.INFRASTRUCTURE,
        });
      }
      throw err;
    }
  }

  async update(id: string, input: BlogPostUpdateInput): Promise<void> {
    const { entity, categoryIds, tagIds } = input;

    await this.prisma.$transaction(async (tx) => {
      await tx.postCategory.deleteMany({ where: { postId: id } });
      await tx.postTag.deleteMany({ where: { postId: id } });
      await tx.blogPost.update({
        where: { id },
        data: {
          slug: entity.slug,
          language: entity.language,
          title: entity.title,
          excerpt: entity.excerpt,
          contentJson: (entity.contentJson as unknown as Prisma.InputJsonValue) ?? Prisma.DbNull,
          contentHtml: (entity.contentHtml as unknown as Prisma.InputJsonValue) ?? Prisma.DbNull,
          contentSchemaVersion: entity.contentSchemaVersion,
          contentCanonical: (entity.contentCanonical as unknown as Prisma.InputJsonValue) ?? Prisma.DbNull,
          readTimeMinutes: entity.readTimeMinutes,
          status: entity.status,
          featured: entity.featured,
          publishedAt: entity.publishedAt,
          metaTitle: entity.metaTitle,
          metaDescription: entity.metaDescription,
          authorId: entity.authorId,
          featuredImageId: entity.featuredImageId,
          updatedById: entity.updatedById,
          categories: {
            create: categoryIds.map((categoryId) => ({ categoryId })),
          },
          tags: {
            create: tagIds.map((tagId) => ({ tagId })),
          },
        },
      });
    });
  }

  async softDelete(id: string, entity: BlogPost): Promise<void> {
    await this.prisma.blogPost.update({
      where: { id },
      data: {
        deletedAt: entity.deletedAt,
        deletedById: entity.deletedById,
        updatedById: entity.updatedById,
      },
    });
  }

  async restore(id: string, entity: BlogPost): Promise<void> {
    await this.prisma.blogPost.update({
      where: { id },
      data: {
        deletedAt: null,
        deletedById: null,
        updatedById: entity.updatedById,
      },
    });
  }

  async bulkSoftDelete(ids: string[], userId: string): Promise<number> {
    const { count } = await this.prisma.blogPost.updateMany({
      where: { id: { in: ids }, deletedAt: null },
      data: { deletedAt: new Date(), deletedById: userId, updatedById: userId },
    });
    return count;
  }

  async bulkRestore(ids: string[], userId: string): Promise<number> {
    const { count } = await this.prisma.blogPost.updateMany({
      where: { id: { in: ids }, deletedAt: { not: null } },
      data: { deletedAt: null, deletedById: null, updatedById: userId },
    });
    return count;
  }

  async bulkPermanentDelete(ids: string[]): Promise<number> {
    // Relations (postCategory/postTag) cascade via schema onDelete rules.
    // `deletedAt: { not: null }` is a hard safety rail, not a UI concern: this is the
    // only irreversible bulk action, and the endpoint accepts arbitrary ids, so a
    // malformed/replayed request must never be able to destroy a live post.
    const { count } = await this.prisma.blogPost.deleteMany({
      where: { id: { in: ids }, deletedAt: { not: null } },
    });
    return count;
  }

  async findBulkTargets(ids: string[]): Promise<BulkPostTarget[]> {
    const rows = await this.prisma.blogPost.findMany({
      where: { id: { in: ids } },
      select: { id: true, title: true, slug: true, contentJson: true, deletedAt: true },
    });
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      slug: r.slug,
      hasContent: r.contentJson !== null,
      isDeleted: r.deletedAt !== null,
    }));
  }

  async findTakenSlugs(slugs: string[]): Promise<string[]> {
    if (slugs.length === 0) return [];
    const rows = await this.prisma.blogPost.findMany({
      where: { slug: { in: slugs }, deletedAt: null },
      select: { slug: true },
    });
    return rows.map((r) => r.slug);
  }

  async bulkSetStatus(ids: string[], status: PostStatus, userId: string): Promise<number> {
    return this.prisma.$transaction(async (tx) => {
      // Publishing a post that never had a publish date gets one now; already-dated
      // rows keep their original date. Un-publishing leaves the date untouched.
      if (status === 'PUBLISHED') {
        await tx.blogPost.updateMany({
          where: { id: { in: ids }, deletedAt: null, publishedAt: null },
          data: { publishedAt: new Date() },
        });
      }
      const { count } = await tx.blogPost.updateMany({
        where: { id: { in: ids }, deletedAt: null },
        data: { status, updatedById: userId },
      });
      return count;
    });
  }

  async findById(id: string): Promise<BlogPostReadResult | null> {
    const raw = await this.prisma.blogPost.findFirst({
      where: { id, deletedAt: null },
      include: fullInclude,
    });
    return raw ? BlogPostMapper.toReadResult(raw as PrismaBlogPostWithRelations) : null;
  }

  async findByIdIncludeDeleted(id: string): Promise<BlogPostReadResult | null> {
    const raw = await this.prisma.blogPost.findFirst({
      where: { id },
      include: fullInclude,
    });
    return raw ? BlogPostMapper.toReadResult(raw as PrismaBlogPostWithRelations) : null;
  }

  async list(options: BlogPostFindAllOptions): Promise<PaginatedResult<BlogPostReadResult>> {
    const { page, limit, search, includeDeleted, status, language, sortBy, sortDir } = options;
    const where: Prisma.BlogPostWhereInput = includeDeleted ? {} : { deletedAt: null };

    if (status) {
      where.status = status as Prisma.EnumPostStatusFilter;
    }

    if (language) {
      where.language = language;
    }

    if (search) {
      where.OR = [{ title: { contains: search, mode: 'insensitive' } }];
    }

    const orderBy = [{ [sortBy ?? 'updatedAt']: sortDir ?? 'desc' } as Prisma.BlogPostOrderByWithRelationInput];

    const [data, total] = await Promise.all([
      this.prisma.blogPost.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
        include: fullInclude,
      }),
      this.prisma.blogPost.count({ where }),
    ]);

    return {
      data: (data as PrismaBlogPostWithRelations[]).map(BlogPostMapper.toReadResult),
      total,
    };
  }

  async findBySlug(slug: string): Promise<BlogPostReadResult | null> {
    const raw = await this.prisma.blogPost.findFirst({
      where: {
        slug,
        status: { in: ['PUBLISHED', 'UNLISTED'] },
        deletedAt: null,
      },
      include: fullInclude,
    });
    return raw ? BlogPostMapper.toReadResult(raw as PrismaBlogPostWithRelations) : null;
  }

  async listPublic(options: BlogPostListPublicOptions): Promise<PaginatedResult<BlogPostReadResult>> {
    const { page, limit, categoryId, tagId, language, search, sortBy } = options;
    const where: Prisma.BlogPostWhereInput = {
      status: 'PUBLISHED',
      deletedAt: null,
    };

    if (categoryId) {
      where.categories = { some: { categoryId } };
    }

    if (tagId) {
      where.tags = { some: { tagId } };
    }

    if (language) {
      where.language = language;
    }

    // Free-text contains on title + excerpt. ILIKE-fast enough for ~100 posts.
    // If volume grows past ~1000, switch to a `tsvector` column + GIN index.
    const trimmedSearch = search?.trim();
    if (trimmedSearch) {
      where.OR = [
        { title: { contains: trimmedSearch, mode: 'insensitive' } },
        { excerpt: { contains: trimmedSearch, mode: 'insensitive' } },
      ];
    }

    const direction: Prisma.SortOrder = sortBy === 'oldest' ? 'asc' : 'desc';

    const [data, total] = await Promise.all([
      this.prisma.blogPost.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ publishedAt: direction }],
        include: fullInclude,
      }),
      this.prisma.blogPost.count({ where }),
    ]);

    return {
      data: (data as PrismaBlogPostWithRelations[]).map(BlogPostMapper.toReadResult),
      total,
    };
  }

  async listFeatured(): Promise<BlogPostReadResult[]> {
    const data = await this.prisma.blogPost.findMany({
      where: { featured: true, status: 'PUBLISHED', deletedAt: null },
      orderBy: [{ publishedAt: 'desc' }],
      include: fullInclude,
    });
    return (data as PrismaBlogPostWithRelations[]).map(BlogPostMapper.toReadResult);
  }

  async findRelatedByPrimaryCategory(
    excludeId: string,
    primaryCategoryId: string,
    limit: number
  ): Promise<BlogPostReadResult[]> {
    // PST-010: primary-category match only — no tag-based fallback, no padding.
    const data = await this.prisma.blogPost.findMany({
      where: {
        id: { not: excludeId },
        status: 'PUBLISHED',
        deletedAt: null,
        categories: { some: { categoryId: primaryCategoryId } },
      },
      orderBy: [{ publishedAt: 'desc' }],
      take: limit,
      include: fullInclude,
    });

    return (data as PrismaBlogPostWithRelations[]).map(BlogPostMapper.toReadResult);
  }

  async slugExists(slug: string, excludeId?: string): Promise<boolean> {
    // Slug uniqueness is among ACTIVE posts only — soft-deleted rows don't hold a
    // slug. Without this filter, restoring a post would detect its own still-present
    // (soft-deleted) row and always 409 (see RestorePostHandler).
    const where: Prisma.BlogPostWhereInput = { slug, deletedAt: null };
    if (excludeId) {
      where.id = { not: excludeId };
    }
    const count = await this.prisma.blogPost.count({ where });
    return count > 0;
  }
}
