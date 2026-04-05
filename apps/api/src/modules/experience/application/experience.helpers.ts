import { ISkillRepository } from '../../skill/application/ports/skill.repository.port';
import { SkillRef } from './experience.presenter';

export async function resolveSkills(skillIds: string[], skillRepo: ISkillRepository): Promise<SkillRef[]> {
  if (skillIds.length === 0) return [];
  const skills = await Promise.all(skillIds.map((id) => skillRepo.findById(id)));
  return skills
    .filter((s): s is NonNullable<typeof s> => s !== null)
    .map((s) => ({ id: s.id, name: { en: s.name, vi: s.name }, slug: s.slug }));
}
