import { Injectable } from '@nestjs/common';
import { Prisma, RadarSource } from '@prisma/client';

import { ConflictError, ErrorLayer, RadarErrorCode } from '@portfolio/shared/errors';

import {
  CreateRadarSourceData,
  IRadarSourceRepository,
  RadarSourceWithCount,
} from '../../application/ports/radar-source.repository.port';
import { PrismaService } from '../../../../shared/prisma';

const withCount = { _count: { select: { items: true } } } as const;

type SourceRow = RadarSource & { _count: { items: number } };

const toWithCount = ({ _count, ...source }: SourceRow): RadarSourceWithCount => ({
  ...source,
  itemCount: _count.items,
});

@Injectable()
export class RadarSourceRepository implements IRadarSourceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateRadarSourceData): Promise<RadarSourceWithCount> {
    try {
      return toWithCount(await this.prisma.radarSource.create({ data, include: withCount }));
    } catch (err) {
      // Two creates for the same URL can both pass the handler's findByUrl check.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw ConflictError('A radar source with this URL already exists', {
          errorCode: RadarErrorCode.SOURCE_URL_TAKEN,
          layer: ErrorLayer.INFRASTRUCTURE,
        });
      }
      throw err;
    }
  }

  findById(id: string): Promise<RadarSource | null> {
    return this.prisma.radarSource.findUnique({ where: { id } });
  }

  findByUrl(url: string): Promise<RadarSource | null> {
    return this.prisma.radarSource.findUnique({ where: { url } });
  }

  async findAll(): Promise<RadarSourceWithCount[]> {
    const rows = await this.prisma.radarSource.findMany({ include: withCount, orderBy: { createdAt: 'asc' } });
    return rows.map(toWithCount);
  }

  async setActive(id: string, isActive: boolean): Promise<void> {
    await this.prisma.radarSource.update({ where: { id }, data: { isActive } });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.radarSource.delete({ where: { id } });
  }
}
