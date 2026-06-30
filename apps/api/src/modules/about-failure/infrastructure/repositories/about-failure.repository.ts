import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../shared/prisma';
import { IAboutFailureRepository } from '../../application/ports/about-failure.repository.port';
import { AboutFailure } from '../../domain/entities/about-failure.entity';
import { AboutFailureMapper } from '../mapper/about-failure.mapper';

@Injectable()
export class AboutFailureRepository implements IAboutFailureRepository {
  constructor(private readonly prisma: PrismaService) {}

  async add(failure: AboutFailure): Promise<string> {
    const created = await this.prisma.aboutFailure.create({
      data: {
        id: failure.id,
        order: failure.order,
        year: failure.year,
        context: failure.context.toProps() as unknown as Prisma.InputJsonValue,
        decision: failure.decision.toProps() as unknown as Prisma.InputJsonValue,
        consequence: failure.consequence.toProps() as unknown as Prisma.InputJsonValue,
        lesson: failure.lesson.toProps() as unknown as Prisma.InputJsonValue,
        isPublished: failure.isPublished,
      },
    });
    return created.id;
  }

  async findById(id: string): Promise<AboutFailure | null> {
    const raw = await this.prisma.aboutFailure.findUnique({ where: { id } });
    return raw ? AboutFailureMapper.toDomain(raw) : null;
  }

  async findAll(options: { onlyPublished?: boolean } = {}): Promise<AboutFailure[]> {
    const raw = await this.prisma.aboutFailure.findMany({
      where: options.onlyPublished ? { isPublished: true } : undefined,
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
    return raw.map(AboutFailureMapper.toDomain);
  }

  async update(id: string, failure: AboutFailure): Promise<void> {
    await this.prisma.aboutFailure.update({
      where: { id },
      data: {
        order: failure.order,
        year: failure.year,
        context: failure.context.toProps() as unknown as Prisma.InputJsonValue,
        decision: failure.decision.toProps() as unknown as Prisma.InputJsonValue,
        consequence: failure.consequence.toProps() as unknown as Prisma.InputJsonValue,
        lesson: failure.lesson.toProps() as unknown as Prisma.InputJsonValue,
        isPublished: failure.isPublished,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.aboutFailure.delete({ where: { id } });
  }

  async reorder(updates: ReadonlyArray<{ id: string; order: number }>): Promise<void> {
    if (updates.length === 0) return;
    await this.prisma.$transaction(
      updates.map((u) => this.prisma.aboutFailure.update({ where: { id: u.id }, data: { order: u.order } }))
    );
  }
}
