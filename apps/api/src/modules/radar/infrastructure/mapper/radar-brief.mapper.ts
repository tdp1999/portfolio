import { Prisma, RadarBrief as RadarBriefRow } from '@prisma/client';

import { RadarBrief } from '../../domain/entities/radar-brief.entity';

export class RadarBriefMapper {
  static toDomain(row: RadarBriefRow): RadarBrief {
    return RadarBrief.load({
      id: row.id,
      sourceId: row.sourceId,
      windowFrom: row.windowFrom,
      windowTo: row.windowTo,
      body: row.body,
      itemIds: row.itemIds,
      workStatus: row.workStatus,
      leaseExpiresAt: row.leaseExpiresAt,
      producer:
        row.producerAdapter && row.producerModel ? { adapter: row.producerAdapter, model: row.producerModel } : null,
      createdAt: row.createdAt,
    });
  }

  static toPersistence(brief: RadarBrief): Prisma.RadarBriefUncheckedCreateInput {
    return {
      id: brief.id,
      sourceId: brief.sourceId,
      windowFrom: brief.windowFrom,
      windowTo: brief.windowTo,
      workStatus: brief.workStatus,
      createdAt: brief.createdAt,
    };
  }

  /** What a submitted brief writes. */
  static toResultPersistence(brief: RadarBrief): Prisma.RadarBriefUpdateManyMutationInput {
    return {
      body: brief.body,
      itemIds: [...brief.itemIds],
      workStatus: brief.workStatus,
      leaseExpiresAt: brief.leaseExpiresAt,
      producerAdapter: brief.producer?.adapter ?? null,
      producerModel: brief.producer?.model ?? null,
    };
  }
}
