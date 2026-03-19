import { Skill as PrismaSkill } from '@prisma/client';
import { Skill } from '../../domain/entities/skill.entity';
import { ISkillProps, SkillCategory } from '../../domain/skill.types';

export class SkillMapper {
  static toDomain(raw: PrismaSkill): Skill {
    const props: ISkillProps = {
      id: raw.id,
      name: raw.name,
      slug: raw.slug,
      description: raw.description,
      category: raw.category as SkillCategory,
      isLibrary: raw.isLibrary,
      parentSkillId: raw.parentSkillId,
      yearsOfExperience: raw.yearsOfExperience,
      iconUrl: raw.iconUrl,
      proficiencyNote: raw.proficiencyNote,
      isFeatured: raw.isFeatured,
      displayOrder: raw.displayOrder,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      createdById: raw.createdById,
      updatedById: raw.updatedById,
      deletedAt: raw.deletedAt,
      deletedById: raw.deletedById,
    };
    return Skill.load(props);
  }

  static toPrisma(skill: Skill): Omit<PrismaSkill, 'createdAt' | 'updatedAt'> {
    return {
      id: skill.id,
      name: skill.name,
      slug: skill.slug,
      description: skill.description,
      category: skill.category as PrismaSkill['category'],
      isLibrary: skill.isLibrary,
      parentSkillId: skill.parentSkillId,
      yearsOfExperience: skill.yearsOfExperience,
      iconUrl: skill.iconUrl,
      proficiencyNote: skill.proficiencyNote,
      isFeatured: skill.isFeatured,
      displayOrder: skill.displayOrder,
      createdById: skill.createdById,
      updatedById: skill.updatedById,
      deletedAt: skill.deletedAt,
      deletedById: skill.deletedById,
    };
  }
}
