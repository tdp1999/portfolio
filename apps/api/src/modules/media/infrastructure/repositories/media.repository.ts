import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaginatedQuery, PaginatedResult } from '@portfolio/shared/types';
import { PrismaService } from '../../../../infrastructure/prisma';
import { IMediaRepository, MediaFindAllOptions } from '../../application/ports/media.repository.port';
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

  async findAll(options: MediaFindAllOptions): Promise<PaginatedResult<Media>> {
    const { page, limit, search, includeDeleted, mimeTypePrefix } = options;
    const where: Prisma.MediaWhereInput = includeDeleted ? {} : { deletedAt: null };

    if (search) {
      where.originalFilename = { contains: search, mode: 'insensitive' };
    }

    if (mimeTypePrefix) {
      where.mimeType = { startsWith: mimeTypePrefix };
    }

    const [data, total] = await Promise.all([
      this.prisma.media.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.media.count({ where }),
    ]);

    return {
      data: data.map(MediaMapper.toDomain),
      total,
    };
  }
}
