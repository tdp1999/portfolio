import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaginatedResult } from '@portfolio/shared/types';
import { PrismaService } from '../../../../shared/prisma';
import {
  IMedicalItemRepository,
  MedicalItemFindAllOptions,
  MedicalItemLookupRow,
} from '../../application/ports/medical-item.repository.port';
import { MedicalItem } from '../../domain/entities/medical-item.entity';
import { MedicalItemMapper } from '../mapper/medicine-cabinet.mapper';

@Injectable()
export class MedicalItemRepository implements IMedicalItemRepository {
  constructor(private readonly prisma: PrismaService) {}

  async add(item: MedicalItem): Promise<string> {
    const created = await this.prisma.medicalItem.create({ data: MedicalItemMapper.toPrisma(item) });
    return created.id;
  }

  async update(id: string, item: MedicalItem): Promise<void> {
    const {
      id: _id,
      kind: _kind,
      createdById: _createdById,
      deletedAt: _deletedAt,
      deletedById: _deletedById,
      ...data
    } = MedicalItemMapper.toPrisma(item);
    await this.prisma.medicalItem.update({ where: { id }, data });
  }

  async remove(id: string, item: MedicalItem): Promise<void> {
    await this.prisma.medicalItem.update({
      where: { id },
      data: { deletedAt: item.deletedAt, deletedById: item.deletedById, updatedById: item.updatedById },
    });
  }

  async findById(id: string): Promise<MedicalItem | null> {
    const raw = await this.prisma.medicalItem.findFirst({ where: { id, deletedAt: null } });
    return raw ? MedicalItemMapper.toDomain(raw) : null;
  }

  async findAll({ page, limit, profileId }: MedicalItemFindAllOptions): Promise<PaginatedResult<MedicalItem>> {
    // The person filter hides an item saved while its person was being deleted (R7.4), as in `findLookup`.
    const where: Prisma.MedicalItemWhereInput = {
      deletedAt: null,
      profile: { deletedAt: null },
      ...(profileId ? { profileId } : {}),
    };
    const [rows, total] = await Promise.all([
      this.prisma.medicalItem.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      }),
      this.prisma.medicalItem.count({ where }),
    ]);
    return { data: rows.map(MedicalItemMapper.toDomain), total };
  }

  async findLookup(): Promise<MedicalItemLookupRow[]> {
    // Items of a deleted person are deleted with them (Q-11); the person filter guards a partial failure.
    const rows = await this.prisma.medicalItem.findMany({
      where: { deletedAt: null, profile: { deletedAt: null } },
      include: { profile: { select: { name: true } } },
    });
    return rows.map(({ profile, ...raw }) => ({ item: MedicalItemMapper.toDomain(raw), profileName: profile.name }));
  }
}
