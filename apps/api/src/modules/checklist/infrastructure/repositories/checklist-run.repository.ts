import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../../shared/prisma';
import { IChecklistRunRepository } from '../../application/ports/checklist-run.repository.port';
import { ChecklistRun } from '../../domain/entities/checklist-run.entity';
import { ChecklistMapper } from '../mapper/checklist.mapper';

/** The id column is a UUID: anything else in the URL is simply not found, never a database error. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class ChecklistRunRepository implements IChecklistRunRepository {
  constructor(private readonly prisma: PrismaService) {}

  async add(run: ChecklistRun): Promise<void> {
    await this.prisma.checklistRun.create({ data: ChecklistMapper.runToPersistence(run) });
  }

  async findById(id: string): Promise<ChecklistRun | null> {
    if (!UUID.test(id)) return null;
    const row = await this.prisma.checklistRun.findUnique({ where: { id } });
    return row ? ChecklistMapper.runToDomain(row) : null;
  }

  async findAll(): Promise<ChecklistRun[]> {
    const rows = await this.prisma.checklistRun.findMany({ orderBy: { updatedAt: 'desc' } });
    return rows.map(ChecklistMapper.runToDomain);
  }

  async updateMeta(run: ChecklistRun): Promise<void> {
    await this.prisma.checklistRun.update({ where: { id: run.id }, data: { name: run.name, status: run.status } });
  }

  async saveBody(run: ChecklistRun, baseVersion: number): Promise<boolean> {
    const { count } = await this.prisma.checklistRun.updateMany({
      where: { id: run.id, version: baseVersion },
      data: { body: run.body as unknown as Prisma.InputJsonValue, version: run.version },
    });
    return count === 1;
  }

  async remove(id: string): Promise<void> {
    await this.prisma.checklistRun.delete({ where: { id } });
  }
}
