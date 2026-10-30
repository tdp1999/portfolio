import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../shared/prisma';
import {
  HealthProfileWithItemCount,
  IHealthProfileRepository,
} from '../../application/ports/health-profile.repository.port';
import { profileNameTaken } from '../../application/medicine-cabinet.errors';
import { HealthProfile } from '../../domain/entities/health-profile.entity';
import { HealthProfileMapper } from '../mapper/medicine-cabinet.mapper';

@Injectable()
export class HealthProfileRepository implements IHealthProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async add(profile: HealthProfile): Promise<string> {
    try {
      const created = await this.prisma.healthProfile.create({ data: HealthProfileMapper.toPrisma(profile) });
      return created.id;
    } catch (err) {
      throw asNameTaken(err);
    }
  }

  async update(id: string, profile: HealthProfile): Promise<void> {
    try {
      await this.prisma.healthProfile.update({
        where: { id },
        data: { name: profile.name, updatedById: profile.updatedById },
      });
    } catch (err) {
      throw asNameTaken(err);
    }
  }

  async findById(id: string): Promise<HealthProfile | null> {
    const raw = await this.prisma.healthProfile.findFirst({ where: { id, deletedAt: null } });
    return raw ? HealthProfileMapper.toDomain(raw) : null;
  }

  async findByName(name: string): Promise<HealthProfile | null> {
    // The same expression as the partial unique index. `mode: 'insensitive'` becomes ILIKE, where `%` and `_` are wildcards.
    const [match] = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM health_profiles WHERE lower(name) = lower(${name}) AND "deletedAt" IS NULL LIMIT 1`;
    return match ? this.findById(match.id) : null;
  }

  async findAllWithItemCount(): Promise<HealthProfileWithItemCount[]> {
    const rows = await this.prisma.healthProfile.findMany({
      where: { deletedAt: null },
      include: { _count: { select: { items: { where: { deletedAt: null } } } } },
    });
    return rows.map(({ _count, ...raw }) => ({ profile: HealthProfileMapper.toDomain(raw), itemCount: _count.items }));
  }

  async removeWithItems(id: string, deletedProfile: HealthProfile): Promise<void> {
    const mark = {
      deletedAt: deletedProfile.deletedAt,
      deletedById: deletedProfile.deletedById,
      updatedById: deletedProfile.updatedById,
    };
    await this.prisma.$transaction([
      this.prisma.medicalItem.updateMany({ where: { profileId: id, deletedAt: null }, data: mark }),
      this.prisma.healthProfile.update({ where: { id }, data: mark }),
    ]);
  }
}

/** Two requests can both pass `findByName`; the partial unique index on lower(name) then rejects the second (R11.2). */
function asNameTaken(err: unknown): unknown {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002' ? profileNameTaken() : err;
}
