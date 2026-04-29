import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ConflictError, ErrorLayer, ExperienceErrorCode } from '@portfolio/shared/errors';
import { PaginatedResult } from '@portfolio/shared/types';
import { PrismaService } from '../../../../infrastructure/prisma';
import { IExperienceRepository, ExperienceFindAllOptions } from '../../application/ports/experience.repository.port';
import { Experience } from '../../domain/entities/experience.entity';
import { ExperienceMapper } from '../mapper/experience.mapper';

const skillsInclude = { skills: true } as const;

@Injectable()
export class ExperienceRepository implements IExperienceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async add(entity: Experience, skillIds: string[]): Promise<string> {
    try {
      const data = ExperienceMapper.toPrisma(entity);
      const created = await this.prisma.experience.create({
        data: {
          ...data,
          skills: {
            create: skillIds.map((skillId) => ({ skillId })),
          },
        },
        include: skillsInclude,
      });
      return created.id;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw ConflictError('Experience with this slug already exists', {
          errorCode: ExperienceErrorCode.SLUG_TAKEN,
          layer: ErrorLayer.INFRASTRUCTURE,
        });
      }
      throw err;
    }
  }

  async update(id: string, entity: Experience, skillIds: string[]): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.experienceSkill.deleteMany({ where: { experienceId: id } }),
      this.prisma.experience.update({
        where: { id },
        data: {
          companyName: entity.companyName,
          companyUrl: entity.companyUrl,
          companyLogoId: entity.companyLogoId,
          position: entity.position as unknown as Prisma.InputJsonValue,
          description:
            entity.description !== null ? (entity.description as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
          responsibilities: entity.responsibilities as unknown as Prisma.InputJsonValue,
          highlights: entity.highlights as unknown as Prisma.InputJsonValue,
          teamRole: entity.teamRole !== null ? (entity.teamRole as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
          links: entity.links as unknown as Prisma.InputJsonValue,
          employmentType: entity.employmentType,
          locationType: entity.locationType,
          locationCountry: entity.locationCountry,
          locationCity: entity.locationCity,
          locationPostalCode: entity.locationPostalCode,
          locationAddress1: entity.locationAddress1,
          locationAddress2: entity.locationAddress2,
          clientName: entity.clientName,
          domain: entity.domain,
          teamSizeMin: entity.teamSizeMin,
          teamSizeMax: entity.teamSizeMax,
          startDate: entity.startDate,
          endDate: entity.endDate,
          displayOrder: entity.displayOrder,
          updatedById: entity.updatedById,
          skills: {
            create: skillIds.map((skillId) => ({ skillId })),
          },
        },
      }),
    ]);
  }

  async remove(id: string, entity: Experience): Promise<void> {
    await this.prisma.experience.update({
      where: { id },
      data: {
        deletedAt: entity.deletedAt,
        deletedById: entity.deletedById,
        updatedById: entity.updatedById,
      },
    });
  }

  async restore(id: string, entity: Experience): Promise<void> {
    await this.prisma.experience.update({
      where: { id },
      data: {
        deletedAt: null,
        deletedById: null,
        updatedById: entity.updatedById,
      },
    });
  }

  async findById(id: string): Promise<Experience | null> {
    const raw = await this.prisma.experience.findFirst({
      where: { id },
      include: skillsInclude,
    });
    return raw ? ExperienceMapper.toDomain(raw) : null;
  }

  async findByIdIncludeDeleted(id: string): Promise<Experience | null> {
    const raw = await this.prisma.experience.findFirst({
      where: { id },
      include: skillsInclude,
    });
    return raw ? ExperienceMapper.toDomain(raw) : null;
  }

  async findBySlug(slug: string): Promise<Experience | null> {
    const raw = await this.prisma.experience.findFirst({
      where: { slug },
      include: skillsInclude,
    });
    return raw ? ExperienceMapper.toDomain(raw) : null;
  }

  async findAll(options: ExperienceFindAllOptions): Promise<PaginatedResult<Experience>> {
    const { page, limit, search, employmentType, locationType, includeDeleted, sortBy, sortDir } = options;
    const where: Prisma.ExperienceWhereInput = includeDeleted ? {} : { deletedAt: null };

    if (employmentType) {
      where.employmentType = employmentType;
    }

    if (locationType) {
      where.locationType = locationType;
    }

    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: 'insensitive' } },
        { position: { path: ['en'], string_contains: search } },
        { position: { path: ['vi'], string_contains: search } },
      ];
    }

    const orderBy = [{ [sortBy ?? 'updatedAt']: sortDir ?? 'desc' } as Prisma.ExperienceOrderByWithRelationInput];

    const [data, total] = await Promise.all([
      this.prisma.experience.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
        include: skillsInclude,
      }),
      this.prisma.experience.count({ where }),
    ]);

    return {
      data: data.map(ExperienceMapper.toDomain),
      total,
    };
  }

  async findAllPublic(): Promise<Experience[]> {
    const data = await this.prisma.experience.findMany({
      where: { deletedAt: null },
      orderBy: [{ displayOrder: 'asc' }, { startDate: 'desc' }],
      include: skillsInclude,
    });
    return data.map(ExperienceMapper.toDomain);
  }

  async slugExists(slug: string): Promise<boolean> {
    const count = await this.prisma.experience.count({ where: { slug, deletedAt: null } });
    return count > 0;
  }

  async reorder(items: { id: string; displayOrder: number }[]): Promise<void> {
    await this.prisma.$transaction(
      items.map(({ id, displayOrder }) => this.prisma.experience.update({ where: { id }, data: { displayOrder } }))
    );
  }
}
