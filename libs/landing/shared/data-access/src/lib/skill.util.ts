import type { PublicSkill, SkillTierGroup } from './skill.types';
import { SKILL_TIERS } from './skill.types';
import { TIER_LABEL } from './skill.data';

export function groupByTier(skills: readonly PublicSkill[]): readonly SkillTierGroup[] {
  const memberSort = (a: PublicSkill, b: PublicSkill): number =>
    a.displayOrder - b.displayOrder || a.name.localeCompare(b.name);

  return SKILL_TIERS.map((tier) => ({
    tier,
    label: TIER_LABEL[tier],
    members: skills.filter((s) => s.parentSkillId !== null && s.tier === tier).sort(memberSort),
  }));
}
