import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../shared/prisma';
import { IAboutPrincipleRepository } from '../../application/ports/about-principle.repository.port';
import { AboutPrinciple } from '../../domain/entities/about-principle.entity';
import { AboutPrincipleMapper } from '../mapper/about-principle.mapper';

@Injectable()
export class AboutPrincipleRepository implements IAboutPrincipleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async add(principle: AboutPrinciple): Promise<string> {
    const created = await this.prisma.aboutPrinciple.create({
      data: {
        id: principle.id,
        order: principle.order,
        claim: principle.claim.toProps() as unknown as Prisma.InputJsonValue,
        expansion: principle.expansion.toProps() as unknown as Prisma.InputJsonValue,
        isPublished: principle.isPublished,
      },
    });
    return created.id;
  }

  async findById(id: string): Promise<AboutPrinciple | null> {
    const raw = await this.prisma.aboutPrinciple.findUnique({ where: { id } });
    return raw ? AboutPrincipleMapper.toDomain(raw) : null;
  }

  async findAll(options: { onlyPublished?: boolean } = {}): Promise<AboutPrinciple[]> {
    const raw = await this.prisma.aboutPrinciple.findMany({
      where: options.onlyPublished ? { isPublished: true } : undefined,
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
    return raw.map(AboutPrincipleMapper.toDomain);
  }

  async update(id: string, principle: AboutPrinciple): Promise<void> {
    await this.prisma.aboutPrinciple.update({
      where: { id },
      data: {
        order: principle.order,
        claim: principle.claim.toProps() as unknown as Prisma.InputJsonValue,
        expansion: principle.expansion.toProps() as unknown as Prisma.InputJsonValue,
        isPublished: principle.isPublished,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.aboutPrinciple.delete({ where: { id } });
  }

  async reorder(updates: ReadonlyArray<{ id: string; order: number }>): Promise<void> {
    if (updates.length === 0) return;
    await this.prisma.$transaction(
      updates.map((u) => this.prisma.aboutPrinciple.update({ where: { id: u.id }, data: { order: u.order } }))
    );
  }
}
