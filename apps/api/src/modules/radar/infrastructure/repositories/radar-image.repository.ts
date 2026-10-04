import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { isPlainObject, nonEmptyString } from '@portfolio/shared/utils';

import { IRadarImageRepository, RadarItemImages } from '../../application/ports/radar-image.repository.port';
import { applyImageResults, ImageResult } from '../../domain/radar-media.util';
import { RadarMedia, RadarSharedPost } from '../../domain/radar.types';
import { PrismaService } from '../../../../shared/prisma';

// jsonb `@>` containment: matches when any array element carries storageStatus "pending".
const HAS_PENDING = [{ storageStatus: 'pending' }];

const storedIdsOf = (media: unknown): string[] =>
  Array.isArray(media)
    ? media.flatMap((m) => {
        const id = isPlainObject(m) && m['storageStatus'] === 'stored' ? nonEmptyString(m['storedExternalId']) : null;
        return id ? [id] : [];
      })
    : [];

@Injectable()
export class RadarImageRepository implements IRadarImageRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findWithPendingImages(limit: number): Promise<RadarItemImages[]> {
    const rows = await this.prisma.radarItem.findMany({
      where: {
        OR: [
          { media: { array_contains: HAS_PENDING } },
          { sharedPost: { path: ['media'], array_contains: HAS_PENDING } },
        ],
      },
      select: { id: true, media: true, sharedPost: true },
      orderBy: { publishedAt: 'desc' },
      take: limit,
    });

    return rows.map((r) => ({
      id: r.id,
      media: r.media as unknown as RadarMedia[],
      sharedPost: r.sharedPost as unknown as RadarSharedPost | null,
    }));
  }

  async applyResults(itemId: string, results: ImageResult[]): Promise<{ orphaned: string[] }> {
    return this.prisma.$transaction(async (tx) => {
      // Same lock the capture transaction takes, so the read-merge-write below is atomic.
      await tx.$queryRaw`SELECT id FROM radar_items WHERE id = ${itemId}::uuid FOR UPDATE`;
      const row = await tx.radarItem.findUnique({ where: { id: itemId }, select: { media: true, sharedPost: true } });
      if (!row) {
        return { orphaned: results.flatMap((r) => (r.outcome === 'stored' ? [r.storedExternalId] : [])) };
      }

      const sharedPost = row.sharedPost as unknown as RadarSharedPost | null;
      const merged = applyImageResults(row.media as unknown as RadarMedia[], sharedPost?.media ?? [], results);
      await tx.radarItem.update({
        where: { id: itemId },
        data: {
          media: merged.media as unknown as Prisma.InputJsonValue,
          sharedPost: sharedPost
            ? ({ ...sharedPost, media: merged.sharedMedia } as unknown as Prisma.InputJsonValue)
            : Prisma.DbNull,
        },
      });
      return { orphaned: merged.orphaned };
    });
  }

  async findStoredExternalIds(sourceId: string): Promise<string[]> {
    const rows = await this.prisma.radarItem.findMany({
      where: { sourceId },
      select: { media: true, sharedPost: true },
    });
    return rows.flatMap((r) =>
      storedIdsOf(r.media).concat(storedIdsOf(isPlainObject(r.sharedPost) ? r.sharedPost['media'] : []))
    );
  }
}
