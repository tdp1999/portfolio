import { RadarSource as PrismaRadarSource } from '@prisma/client';

import { RadarSource } from '../../domain/entities/radar-source.entity';

export class RadarSourceMapper {
  static toDomain(raw: PrismaRadarSource): RadarSource {
    return RadarSource.load({
      id: raw.id,
      platform: raw.platform,
      url: raw.url,
      displayName: raw.displayName,
      isActive: raw.isActive,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  static toPersistence(source: RadarSource): Omit<PrismaRadarSource, 'createdAt' | 'updatedAt'> {
    return {
      id: source.id,
      platform: source.platform,
      url: source.url,
      displayName: source.displayName,
      isActive: source.isActive,
    };
  }
}
