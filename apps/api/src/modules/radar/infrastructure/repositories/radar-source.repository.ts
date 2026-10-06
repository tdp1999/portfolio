import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { ConflictError, ErrorLayer, RadarErrorCode } from '@portfolio/shared/errors';

import { IRadarSourceRepository, RadarSourceListing } from '../../application/ports/radar-source.repository.port';
import { RadarSource } from '../../domain/entities/radar-source.entity';
import { RadarSourceMapper } from '../mapper/radar-source.mapper';
import { PrismaService } from '../../../../shared/prisma';

@Injectable()
export class RadarSourceRepository implements IRadarSourceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async add(source: RadarSource): Promise<void> {
    try {
      await this.prisma.radarSource.create({ data: RadarSourceMapper.toPersistence(source) });
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

  async findById(id: string): Promise<RadarSource | null> {
    const row = await this.prisma.radarSource.findUnique({ where: { id } });
    return row ? RadarSourceMapper.toDomain(row) : null;
  }

  async findByUrl(url: string): Promise<RadarSource | null> {
    const row = await this.prisma.radarSource.findUnique({ where: { url } });
    return row ? RadarSourceMapper.toDomain(row) : null;
  }

  async findAll(): Promise<RadarSourceListing[]> {
    const rows = await this.prisma.radarSource.findMany({
      include: { _count: { select: { items: true } } },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map(({ _count, ...row }) => ({ source: RadarSourceMapper.toDomain(row), itemCount: _count.items }));
  }

  async save(source: RadarSource): Promise<void> {
    const { id, ...data } = RadarSourceMapper.toPersistence(source);
    await this.prisma.radarSource.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.radarSource.delete({ where: { id } });
  }
}
