import type { ProjectListItem, ProjectSkillRef } from './project.types';

/**
 * Category-grouped top-N skill aggregation (Algorithm 5).
 *
 * Counts how often each skill appears across the given projects, groups counts by
 * `Skill.category`, then keeps the top-N highest-count skills per category. Ensures the
 * filter bar surfaces a *diverse* set rather than letting one category (e.g. TECHNICAL)
 * dominate every slot.
 *
 * Total cost: O(n) tally + O(m log m) sort, where n = total skill occurrences and
 * m = distinct skills. Portfolio scale (n ≲ 200, m ≲ 50) → essentially instant.
 *
 * @example
 * ```ts
 * const top = groupedTopSkills(projects, { perCategory: 3 });
 * // → { TECHNICAL: [TypeScript, Angular, Prisma], TOOL: [Docker, Figma], ... }
 * ```
 */
export interface SkillGroupingOptions {
  /** How many top skills to keep per category. */
  readonly perCategory: number;
  /** Optional ordering of categories — if omitted, sort by total category count desc. */
  readonly categoryOrder?: readonly string[];
}

export interface SkillFrequency {
  readonly skill: ProjectSkillRef;
  readonly count: number;
}

export interface SkillGroup {
  readonly category: string;
  readonly skills: readonly SkillFrequency[];
  /** Total count across all skills in this category (used for category-level ordering). */
  readonly totalCount: number;
}

/** Tally raw skill occurrences across projects. O(n). */
function tallySkills(projects: readonly ProjectListItem[]): Map<string, SkillFrequency> {
  const counts = new Map<string, SkillFrequency>();
  for (const project of projects) {
    for (const skill of project.skills) {
      const existing = counts.get(skill.slug);
      if (existing) {
        counts.set(skill.slug, { skill: existing.skill, count: existing.count + 1 });
      } else {
        counts.set(skill.slug, { skill, count: 1 });
      }
    }
  }
  return counts;
}

/**
 * Returns category-grouped top-N skills, ready to drive a filter UI.
 *
 * Categories with zero skills are omitted from the result. When two skills tie on count
 * within a category, ordering falls back to alphabetical slug for determinism.
 */
export function groupedTopSkills(
  projects: readonly ProjectListItem[],
  options: SkillGroupingOptions
): readonly SkillGroup[] {
  const counts = tallySkills(projects);

  // Bucket by category — O(m).
  const byCategory = new Map<string, SkillFrequency[]>();
  for (const entry of counts.values()) {
    const bucket = byCategory.get(entry.skill.category) ?? [];
    bucket.push(entry);
    byCategory.set(entry.skill.category, bucket);
  }

  // Within each category: sort desc by count, alphabetical on tie, slice top-N. O(c × bᵢ log bᵢ).
  const groups: SkillGroup[] = [];
  for (const [category, bucket] of byCategory) {
    const sorted = [...bucket].sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.skill.slug.localeCompare(b.skill.slug);
    });
    const top = sorted.slice(0, options.perCategory);
    const totalCount = bucket.reduce((sum, e) => sum + e.count, 0);
    groups.push({ category, skills: top, totalCount });
  }

  // Order categories by `categoryOrder` if supplied, else by totalCount desc.
  if (options.categoryOrder) {
    const indexOf = new Map(options.categoryOrder.map((c, i) => [c, i]));
    groups.sort((a, b) => (indexOf.get(a.category) ?? 999) - (indexOf.get(b.category) ?? 999));
  } else {
    groups.sort((a, b) => b.totalCount - a.totalCount);
  }

  return groups;
}

/** Distinct project years derived from `startDate`, sorted desc. */
export function distinctYears(projects: readonly ProjectListItem[]): readonly number[] {
  const years = new Set<number>();
  for (const p of projects) {
    const y = new Date(p.startDate).getFullYear();
    if (Number.isFinite(y)) years.add(y);
  }
  return [...years].sort((a, b) => b - a);
}
