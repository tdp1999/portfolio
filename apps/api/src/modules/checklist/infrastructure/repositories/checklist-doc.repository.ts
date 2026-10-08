import { Injectable } from '@nestjs/common';
import { ChecklistDocKind } from '@prisma/client';

import { PrismaService } from '../../../../shared/prisma';
import { IChecklistDocRepository } from '../../application/ports/checklist-doc.repository.port';
import { ChecklistDoc } from '../../domain/entities/checklist-doc.entity';
import { ChecklistMapper } from '../mapper/checklist.mapper';

@Injectable()
export class ChecklistDocRepository implements IChecklistDocRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<ChecklistDoc[]> {
    const rows = await this.prisma.checklistDoc.findMany();
    return rows.map(ChecklistMapper.docToDomain);
  }

  async findLive(kind?: ChecklistDocKind): Promise<ChecklistDoc[]> {
    const rows = await this.prisma.checklistDoc.findMany({
      where: { archivedAt: null, ...(kind ? { kind } : {}) },
      orderBy: [{ kind: 'asc' }, { slug: 'asc' }],
    });
    return rows.map(ChecklistMapper.docToDomain);
  }

  async findBySlug(kind: ChecklistDocKind, slug: string): Promise<ChecklistDoc | null> {
    const row = await this.prisma.checklistDoc.findUnique({ where: { kind_slug: { kind, slug } } });
    return row ? ChecklistMapper.docToDomain(row) : null;
  }

  async saveSync(created: ChecklistDoc[], changed: ChecklistDoc[]): Promise<void> {
    await this.prisma.$transaction([
      ...created.map((doc) => this.prisma.checklistDoc.create({ data: ChecklistMapper.docToPersistence(doc) })),
      ...changed.map((doc) =>
        this.prisma.checklistDoc.update({ where: { id: doc.id }, data: ChecklistMapper.docToPersistence(doc) })
      ),
    ]);
  }
}
