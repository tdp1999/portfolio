import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { IdentifierValue, PaginatedResult } from '@portfolio/shared/types';
import { ConflictError, ErrorLayer, ProjectErrorCode } from '@portfolio/shared/errors';
import { PrismaService } from '../../../../infrastructure/prisma';
import {
  IProjectRepository,
  ProjectCreateInput,
  ProjectUpdateInput,
  ProjectFindAllOptions,
} from '../../application/ports/project.repository.port';
import { Project } from '../../domain/entities/project.entity';
import { ProjectMapper, PrismaProjectWithRelations, ProjectReadResult } from '../mapper/project.mapper';

const fullInclude = {
  highlights: true,
  images: { include: { media: true } },
  skills: { include: { skill: true } },
  thumbnail: true,
} as const;

@Injectable()
export class ProjectRepository implements IProjectRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: ProjectCreateInput): Promise<string> {
    const { entity, highlights, imageIds, skillIds } = input;
    try {
      const data = ProjectMapper.toPrisma(entity);
      const created = await this.prisma.project.create({
        data: {
          ...data,
          highlights: {
            create: highlights.map((h) => ({
              id: IdentifierValue.v7(),
              challenge: h.challenge as unknown as Prisma.InputJsonValue,
              approach: h.approach as unknown as Prisma.InputJsonValue,
              outcome: h.outcome as unknown as Prisma.InputJsonValue,
              codeUrl: h.codeUrl ?? null,
              displayOrder: h.displayOrder,
            })),
          },
          images: {
            create: imageIds.map((mediaId, index) => ({
              id: IdentifierValue.v7(),
              mediaId,
              displayOrder: index,
            })),
          },
          skills: {
            create: skillIds.map((skillId) => ({ skillId })),
          },
        },
      });
      return created.id;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw ConflictError('Project with this slug already exists', {
          errorCode: ProjectErrorCode.SLUG_CONFLICT,
          layer: ErrorLayer.INFRASTRUCTURE,
        });
      }
      throw err;
    }
  }

  async update(id: string, input: ProjectUpdateInput): Promise<void> {
    const { entity, highlights, imageIds, skillIds } = input;

    await this.prisma.$transaction(async (tx) => {
      await tx.technicalHighlight.deleteMany({ where: { projectId: id } });
      await tx.projectImage.deleteMany({ where: { projectId: id } });
      await tx.projectSkill.deleteMany({ where: { projectId: id } });
      await tx.project.update({
        where: { id },
        data: {
          slug: entity.slug,
          title: entity.title,
          oneLiner: entity.oneLiner as unknown as Prisma.InputJsonValue,
          description: entity.description as unknown as Prisma.InputJsonValue,
          motivation: entity.motivation as unknown as Prisma.InputJsonValue,
          role: entity.role as unknown as Prisma.InputJsonValue,
          startDate: entity.startDate,
          endDate: entity.endDate,
          status: entity.status,
          featured: entity.featured,
          displayOrder: entity.displayOrder,
          sourceUrl: entity.sourceUrl,
          projectUrl: entity.projectUrl,
          thumbnailId: entity.thumbnailId,
          updatedById: entity.updatedById,
          highlights: {
            create: highlights.map((h) => ({
              id: IdentifierValue.v7(),
              challenge: h.challenge as unknown as Prisma.InputJsonValue,
              approach: h.approach as unknown as Prisma.InputJsonValue,
              outcome: h.outcome as unknown as Prisma.InputJsonValue,
              codeUrl: h.codeUrl ?? null,
              displayOrder: h.displayOrder,
            })),
          },
          images: {
            create: imageIds.map((mediaId, index) => ({
              id: IdentifierValue.v7(),
              mediaId,
              displayOrder: index,
            })),
          },
          skills: {
            create: skillIds.map((skillId) => ({ skillId })),
          },
        },
      });
    });
  }

  async findById(id: string): Promise<ProjectReadResult | null> {
    const raw = await this.prisma.project.findFirst({
      where: { id, deletedAt: null },
      include: fullInclude,
    });
    return raw ? ProjectMapper.toReadResult(raw as PrismaProjectWithRelations) : null;
  }

  async findByIdIncludeDeleted(id: string): Promise<ProjectReadResult | null> {
    const raw = await this.prisma.project.findFirst({
      where: { id },
      include: fullInclude,
    });
    return raw ? ProjectMapper.toReadResult(raw as PrismaProjectWithRelations) : null;
  }

  async findBySlug(slug: string): Promise<ProjectReadResult | null> {
    const raw = await this.prisma.project.findFirst({
      where: { slug, deletedAt: null },
      include: fullInclude,
    });
    return raw ? ProjectMapper.toReadResult(raw as PrismaProjectWithRelations) : null;
  }

  async findAll(options: ProjectFindAllOptions): Promise<PaginatedResult<ProjectReadResult>> {
    const { page, limit, search, includeDeleted, status } = options;
    const where: Prisma.ProjectWhereInput = includeDeleted ? {} : { deletedAt: null };

    if (status) {
      where.status = status as Prisma.EnumContentStatusFilter;
    }

    if (search) {
      where.OR = [{ title: { contains: search, mode: 'insensitive' } }];
    }

    const [data, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
        include: fullInclude,
      }),
      this.prisma.project.count({ where }),
    ]);

    return {
      data: (data as PrismaProjectWithRelations[]).map(ProjectMapper.toReadResult),
      total,
    };
  }

  async findPublished(): Promise<ProjectReadResult[]> {
    const data = await this.prisma.project.findMany({
      where: { status: 'PUBLISHED', deletedAt: null },
      orderBy: [{ displayOrder: 'asc' }],
      include: fullInclude,
    });
    return (data as PrismaProjectWithRelations[]).map(ProjectMapper.toReadResult);
  }

  async findFeatured(): Promise<ProjectReadResult[]> {
    const data = await this.prisma.project.findMany({
      where: { featured: true, status: 'PUBLISHED', deletedAt: null },
      orderBy: [{ displayOrder: 'asc' }],
      include: fullInclude,
    });
    return (data as PrismaProjectWithRelations[]).map(ProjectMapper.toReadResult);
  }

  async softDelete(id: string, entity: Project): Promise<void> {
    await this.prisma.project.update({
      where: { id },
      data: {
        deletedAt: entity.deletedAt,
        deletedById: entity.deletedById,
        updatedById: entity.updatedById,
      },
    });
  }

  async restore(id: string, entity: Project): Promise<void> {
    await this.prisma.project.update({
      where: { id },
      data: {
        deletedAt: null,
        deletedById: null,
        updatedById: entity.updatedById,
      },
    });
  }

  async slugExists(slug: string, excludeId?: string): Promise<boolean> {
    const where: Prisma.ProjectWhereInput = { slug };
    if (excludeId) {
      where.id = { not: excludeId };
    }
    const count = await this.prisma.project.count({ where });
    return count > 0;
  }

  async batchUpdateOrder(items: { id: string; displayOrder: number }[]): Promise<void> {
    await this.prisma.$transaction(
      items.map(({ id, displayOrder }) => this.prisma.project.update({ where: { id }, data: { displayOrder } }))
    );
  }
}
