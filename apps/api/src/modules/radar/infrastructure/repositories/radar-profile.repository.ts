import { Injectable } from '@nestjs/common';

import {
  IRadarProfileRepository,
  RadarWorkflowProfileData,
} from '../../application/ports/radar-profile.repository.port';
import { PrismaService } from '../../../../shared/prisma';

const select = { body: true, updatedAt: true } as const;
/** The Owner has exactly one profile; a fixed id lets `upsert` stay race-free on the first save. */
const PROFILE_ID = '00000000-0000-7000-8000-000000000001';

@Injectable()
export class RadarProfileRepository implements IRadarProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  find(): Promise<RadarWorkflowProfileData | null> {
    return this.prisma.radarWorkflowProfile.findUnique({ where: { id: PROFILE_ID }, select });
  }

  upsert(body: string): Promise<RadarWorkflowProfileData> {
    return this.prisma.radarWorkflowProfile.upsert({
      where: { id: PROFILE_ID },
      create: { id: PROFILE_ID, body },
      update: { body },
      select,
    });
  }
}
