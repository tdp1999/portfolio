import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaginatedResult } from '@portfolio/shared/types';
import { PrismaService } from '../../../../infrastructure/prisma';
import { ICategoryRepository, CategoryFindAllOptions } from '../../application/ports/category.repository.port';
import { Category } from '../../domain/entities/category.entity';
import { CategoryMapper } from '../mapper/category.mapper';

@Injectable()
export class CategoryRepository implements ICategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async add(category: Category): Promise<string> {
    const data = CategoryMapper.toPrisma(category);
    const created = await this.prisma.category.create({ data });
    return created.id;
  }

  async update(id: string, category: Category): Promise<void> {
    await this.prisma.category.update({
      where: { id },
      data: {
        name: category.name,
        slug: category.slug,
        description: category.description,
        displayOrder: category.displayOrder,
        updatedById: category.updatedById,
      },
    });
  }

  async remove(id: string, category: Category): Promise<void> {
    await this.prisma.category.update({
      where: { id },
      data: {
        deletedAt: category.deletedAt,
        deletedById: category.deletedById,
        updatedById: category.updatedById,
      },
    });
  }

  async findById(id: string): Promise<Category | null> {
    const raw = await this.prisma.category.findFirst({ where: { id, deletedAt: null } });
    return raw ? CategoryMapper.toDomain(raw) : null;
  }

  async findBySlug(slug: string): Promise<Category | null> {
    const raw = await this.prisma.category.findFirst({ where: { slug, deletedAt: null } });
    return raw ? CategoryMapper.toDomain(raw) : null;
  }

  async findByName(name: string): Promise<Category | null> {
    const raw = await this.prisma.category.findFirst({ where: { name, deletedAt: null } });
    return raw ? CategoryMapper.toDomain(raw) : null;
  }

  async findAll(options: CategoryFindAllOptions): Promise<PaginatedResult<Category>> {
    const { page, limit, search, includeDeleted, sortBy, sortDir } = options;
    const where: Prisma.CategoryWhereInput = includeDeleted ? {} : { deletedAt: null };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderBy = [{ [sortBy ?? 'updatedAt']: sortDir ?? 'desc' } as Prisma.CategoryOrderByWithRelationInput];

    const [data, total] = await Promise.all([
      this.prisma.category.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
      }),
      this.prisma.category.count({ where }),
    ]);

    return {
      data: data.map(CategoryMapper.toDomain),
      total,
    };
  }
}
