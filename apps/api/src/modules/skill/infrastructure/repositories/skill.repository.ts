import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ConflictError, ErrorLayer, SkillErrorCode } from '@portfolio/shared/errors';
import { PaginatedResult } from '@portfolio/shared/types';
import { PrismaService } from '../../../../infrastructure/prisma';
import { ISkillRepository, SkillFindAllOptions } from '../../application/ports/skill.repository.port';
import { Skill } from '../../domain/entities/skill.entity';
import { SkillCategory } from '../../domain/skill.types';
import { SkillMapper } from '../mapper/skill.mapper';

@Injectable()
export class SkillRepository implements ISkillRepository {
  constructor(private readonly prisma: PrismaService) {}

  async add(skill: Skill): Promise<string> {
    try {
      const data = SkillMapper.toPrisma(skill);
      const created = await this.prisma.skill.create({ data });
      return created.id;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw ConflictError('Skill with this name already exists', {
          errorCode: SkillErrorCode.NAME_TAKEN,
          layer: ErrorLayer.INFRASTRUCTURE,
        });
      }
      throw err;
    }
  }

  async update(id: string, skill: Skill): Promise<void> {
    try {
      await this.prisma.skill.update({
        where: { id },
        data: {
          name: skill.name,
          slug: skill.slug,
          description: skill.description,
          category: skill.category as Prisma.EnumSkillCategoryFieldUpdateOperationsInput['set'],
          isLibrary: skill.isLibrary,
          parentSkillId: skill.parentSkillId,
          yearsOfExperience: skill.yearsOfExperience,
          iconUrl: skill.iconUrl,
          proficiencyNote: skill.proficiencyNote,
          isFeatured: skill.isFeatured,
          displayOrder: skill.displayOrder,
          updatedById: skill.updatedById,
        },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw ConflictError('Skill with this name already exists', {
          errorCode: SkillErrorCode.NAME_TAKEN,
          layer: ErrorLayer.INFRASTRUCTURE,
        });
      }
      throw err;
    }
  }

  async remove(id: string, skill: Skill): Promise<void> {
    await this.prisma.skill.update({
      where: { id },
      data: {
        deletedAt: skill.deletedAt,
        deletedById: skill.deletedById,
        updatedById: skill.updatedById,
      },
    });
  }

  async findById(id: string): Promise<Skill | null> {
    const raw = await this.prisma.skill.findFirst({ where: { id, deletedAt: null } });
    return raw ? SkillMapper.toDomain(raw) : null;
  }

  async findBySlug(slug: string): Promise<Skill | null> {
    const raw = await this.prisma.skill.findFirst({ where: { slug, deletedAt: null } });
    return raw ? SkillMapper.toDomain(raw) : null;
  }

  async findByName(name: string): Promise<Skill | null> {
    const raw = await this.prisma.skill.findFirst({ where: { name, deletedAt: null } });
    return raw ? SkillMapper.toDomain(raw) : null;
  }

  async findByCategory(category: SkillCategory): Promise<Skill[]> {
    const raw = await this.prisma.skill.findMany({
      where: { category, deletedAt: null },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    });
    return raw.map(SkillMapper.toDomain);
  }

  async findChildren(parentId: string): Promise<Skill[]> {
    const raw = await this.prisma.skill.findMany({
      where: { parentSkillId: parentId, deletedAt: null },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    });
    return raw.map(SkillMapper.toDomain);
  }

  async hasChildren(skillId: string): Promise<boolean> {
    const count = await this.prisma.skill.count({
      where: { parentSkillId: skillId, deletedAt: null },
    });
    return count > 0;
  }

  async findAllNoLimit(): Promise<Skill[]> {
    const raw = await this.prisma.skill.findMany({
      where: { deletedAt: null },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    });
    return raw.map(SkillMapper.toDomain);
  }

  async findAll(options: SkillFindAllOptions): Promise<PaginatedResult<Skill>> {
    const { page, limit, search, includeDeleted, category, isLibrary, parentSkillId } = options;
    const where: Prisma.SkillWhereInput = includeDeleted ? {} : { deletedAt: null };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (isLibrary !== undefined) {
      where.isLibrary = isLibrary;
    }

    if (parentSkillId !== undefined) {
      where.parentSkillId = parentSkillId;
    }

    const [data, total] = await Promise.all([
      this.prisma.skill.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      }),
      this.prisma.skill.count({ where }),
    ]);

    return {
      data: data.map(SkillMapper.toDomain),
      total,
    };
  }
}
