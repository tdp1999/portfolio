import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaginatedQuery, PaginatedResult } from '@portfolio/shared/types';
import { PrismaService } from '../../../../infrastructure/prisma';
import {
  IMediaRepository,
  MediaFindAllOptions,
  StorageStatsResult,
} from '../../application/ports/media.repository.port';
import { Media } from '../../domain/entities/media.entity';
import { MediaMapper } from '../mapper/media.mapper';

@Injectable()
export class MediaRepository implements IMediaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async add(media: Media): Promise<string> {
    const data = MediaMapper.toPrisma(media);
    const created = await this.prisma.media.create({ data });
    return created.id;
  }

  async update(id: string, media: Media): Promise<void> {
    await this.prisma.media.update({
      where: { id },
      data: {
        altText: media.altText,
        caption: media.caption,
        deletedAt: media.deletedAt,
        deletedById: media.deletedById,
        updatedById: media.updatedById,
      },
    });
  }

  async remove(id: string, media: Media): Promise<void> {
    await this.prisma.media.update({
      where: { id },
      data: {
        deletedAt: media.deletedAt,
        deletedById: media.deletedById,
        updatedById: media.updatedById,
      },
    });
  }

  async hardDelete(id: string): Promise<void> {
    await this.prisma.media.delete({ where: { id } });
  }

  async findById(id: string): Promise<Media | null> {
    const raw = await this.prisma.media.findFirst({ where: { id, deletedAt: null } });
    return raw ? MediaMapper.toDomain(raw) : null;
  }

  async findByIdIncludeDeleted(id: string): Promise<Media | null> {
    const raw = await this.prisma.media.findFirst({ where: { id } });
    return raw ? MediaMapper.toDomain(raw) : null;
  }

  async findByPublicId(publicId: string): Promise<Media | null> {
    const raw = await this.prisma.media.findFirst({ where: { publicId, deletedAt: null } });
    return raw ? MediaMapper.toDomain(raw) : null;
  }

  async findByMimeTypePrefix(prefix: string): Promise<Media[]> {
    const raw = await this.prisma.media.findMany({
      where: { mimeType: { startsWith: prefix }, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return raw.map(MediaMapper.toDomain);
  }

  async findOrphans(): Promise<Media[]> {
    // Stub: returns empty until consumer modules reference media
    // Will be refined when Profile, Project, BlogPost modules are built
    return [];
  }

  async findExpiredSoftDeleted(olderThan: Date): Promise<Media[]> {
    const raw = await this.prisma.media.findMany({
      where: {
        deletedAt: { not: null, lt: olderThan },
      },
    });
    return raw.map(MediaMapper.toDomain);
  }

  async findDeleted(options: PaginatedQuery): Promise<PaginatedResult<Media>> {
    const { page, limit, search } = options;
    const where: Prisma.MediaWhereInput = { deletedAt: { not: null } };

    if (search) {
      where.originalFilename = { contains: search, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      this.prisma.media.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { deletedAt: 'desc' },
      }),
      this.prisma.media.count({ where }),
    ]);

    return {
      data: data.map(MediaMapper.toDomain),
      total,
    };
  }

  async getStorageStats(options?: { includeDeleted?: boolean }): Promise<StorageStatsResult> {
    const where: Prisma.MediaWhereInput = options?.includeDeleted ? {} : { deletedAt: null };

    const groups = await this.prisma.media.groupBy({
      by: ['mimeType'],
      where,
      _count: true,
      _sum: { bytes: true },
    });

    const prefixMap = new Map<string, { count: number; bytes: number }>();
    let totalFiles = 0;
    let totalBytes = 0;

    for (const group of groups) {
      const prefix = group.mimeType.split('/')[0];
      const existing = prefixMap.get(prefix) ?? { count: 0, bytes: 0 };
      existing.count += group._count;
      existing.bytes += group._sum.bytes ?? 0;
      prefixMap.set(prefix, existing);
      totalFiles += group._count;
      totalBytes += group._sum.bytes ?? 0;
    }

    return {
      totalFiles,
      totalBytes,
      breakdown: Array.from(prefixMap.entries()).map(([mimeTypePrefix, stats]) => ({
        mimeTypePrefix,
        ...stats,
      })),
    };
  }

  async findAll(options: MediaFindAllOptions): Promise<PaginatedResult<Media>> {
    const { page, limit, search, includeDeleted, mimeTypePrefix, mimeTypes, folder, sort } = options;
    const where: Prisma.MediaWhereInput = includeDeleted ? {} : { deletedAt: null };

    if (search) {
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : []),
        {
          OR: [
            { originalFilename: { contains: search, mode: 'insensitive' } },
            { altText: { contains: search, mode: 'insensitive' } },
            { caption: { contains: search, mode: 'insensitive' } },
          ],
        },
      ];
    }

    if (mimeTypes?.length) {
      where.AND = [...(Array.isArray(where.AND) ? where.AND : []), { mimeType: { in: mimeTypes } }];
    } else if (mimeTypePrefix?.length) {
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : []),
        { OR: mimeTypePrefix.map((prefix) => ({ mimeType: { startsWith: prefix } })) },
      ];
    }

    if (folder) {
      where.folder = folder;
    }

    const [data, total] = await Promise.all([
      this.prisma.media.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: this.toOrderBy(sort),
      }),
      this.prisma.media.count({ where }),
    ]);

    return {
      data: data.map(MediaMapper.toDomain),
      total,
    };
  }

  private toOrderBy(sort?: MediaFindAllOptions['sort']): Prisma.MediaOrderByWithRelationInput {
    switch (sort) {
      case 'createdAt_asc':
        return { createdAt: 'asc' };
      case 'filename_asc':
        return { originalFilename: 'asc' };
      case 'bytes_desc':
        return { bytes: 'desc' };
      case 'createdAt_desc':
      default:
        return { createdAt: 'desc' };
    }
  }
}
