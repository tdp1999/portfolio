import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaginatedResult } from '@portfolio/shared/types';
import { PrismaService } from '../../../../infrastructure/prisma';
import { ITagRepository, TagFindAllOptions } from '../../application/ports/tag.repository.port';
import { Tag } from '../../domain/entities/tag.entity';
import { TagMapper } from '../mapper/tag.mapper';

@Injectable()
export class TagRepository implements ITagRepository {
  constructor(private readonly prisma: PrismaService) {}

  async add(tag: Tag): Promise<string> {
    const data = TagMapper.toPrisma(tag);
    const created = await this.prisma.tag.create({ data });
    return created.id;
  }

  async update(id: string, tag: Tag): Promise<void> {
    await this.prisma.tag.update({
      where: { id },
      data: {
        name: tag.name,
        slug: tag.slug,
        updatedById: tag.updatedById,
      },
    });
  }

  async remove(id: string, tag: Tag): Promise<void> {
    await this.prisma.tag.update({
      where: { id },
      data: {
        deletedAt: tag.deletedAt,
        deletedById: tag.deletedById,
        updatedById: tag.updatedById,
      },
    });
  }

  async findById(id: string): Promise<Tag | null> {
    const raw = await this.prisma.tag.findFirst({ where: { id, deletedAt: null } });
    return raw ? TagMapper.toDomain(raw) : null;
  }

  async findBySlug(slug: string): Promise<Tag | null> {
    const raw = await this.prisma.tag.findFirst({ where: { slug, deletedAt: null } });
    return raw ? TagMapper.toDomain(raw) : null;
  }

  async findByName(name: string): Promise<Tag | null> {
    const raw = await this.prisma.tag.findFirst({ where: { name, deletedAt: null } });
    return raw ? TagMapper.toDomain(raw) : null;
  }

  async findAll(options: TagFindAllOptions): Promise<PaginatedResult<Tag>> {
    const { page, limit, search, includeDeleted, sortBy, sortDir } = options;
    const where: Prisma.TagWhereInput = includeDeleted ? {} : { deletedAt: null };

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const orderBy = [{ [sortBy ?? 'updatedAt']: sortDir ?? 'desc' } as Prisma.TagOrderByWithRelationInput];

    const [data, total] = await Promise.all([
      this.prisma.tag.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
      }),
      this.prisma.tag.count({ where }),
    ]);

    return {
      data: data.map(TagMapper.toDomain),
      total,
    };
  }
}
