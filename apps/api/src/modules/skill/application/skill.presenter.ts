import { Skill } from '../domain/entities/skill.entity';
import { SkillResponseDto } from './skill.dto';

export class SkillPresenter {
  static toResponse(skill: Skill): SkillResponseDto {
    return {
      id: skill.id,
      name: skill.name,
      slug: skill.slug,
      description: skill.description,
      category: skill.category,
      isLibrary: skill.isLibrary,
      parentSkillId: skill.parentSkillId,
      yearsOfExperience: skill.yearsOfExperience,
      iconUrl: skill.iconUrl,
      proficiencyNote: skill.proficiencyNote,
      isFeatured: skill.isFeatured,
      displayOrder: skill.displayOrder,
      createdAt: skill.createdAt,
      updatedAt: skill.updatedAt,
    };
  }
}
