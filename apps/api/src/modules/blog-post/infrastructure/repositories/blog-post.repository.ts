import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaginatedResult } from '@portfolio/shared/types';
import { ConflictError, ErrorLayer, BlogPostErrorCode } from '@portfolio/shared/errors';
import { PrismaService } from '../../../../infrastructure/prisma';
import {
  IBlogPostRepository,
  BlogPostCreateInput,
  BlogPostUpdateInput,
  BlogPostFindAllOptions,
  BlogPostListPublicOptions,
} from '../../application/ports/blog-post.repository.port';
import { BlogPost } from '../../domain/entities/blog-post.entity';
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
          content: entity.content,
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
    const { page, limit, search, includeDeleted, status, language } = options;
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

    const [data, total] = await Promise.all([
      this.prisma.blogPost.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ createdAt: 'desc' }],
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
    const { page, limit, categoryId, tagId, language } = options;
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

    const [data, total] = await Promise.all([
      this.prisma.blogPost.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ publishedAt: 'desc' }],
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

  async findRelated(
    postId: string,
    categoryIds: string[],
    tagIds: string[],
    limit: number
  ): Promise<BlogPostReadResult[]> {
    const orConditions: Prisma.BlogPostWhereInput[] = [];

    if (categoryIds.length > 0) {
      orConditions.push({ categories: { some: { categoryId: { in: categoryIds } } } });
    }

    if (tagIds.length > 0) {
      orConditions.push({ tags: { some: { tagId: { in: tagIds } } } });
    }

    if (orConditions.length === 0) return [];

    const data = await this.prisma.blogPost.findMany({
      where: {
        id: { not: postId },
        status: 'PUBLISHED',
        deletedAt: null,
        OR: orConditions,
      },
      orderBy: [{ publishedAt: 'desc' }],
      take: limit,
      include: fullInclude,
    });

    return (data as PrismaBlogPostWithRelations[]).map(BlogPostMapper.toReadResult);
  }

  async slugExists(slug: string, excludeId?: string): Promise<boolean> {
    const where: Prisma.BlogPostWhereInput = { slug };
    if (excludeId) {
      where.id = { not: excludeId };
    }
    const count = await this.prisma.blogPost.count({ where });
    return count > 0;
  }
}
