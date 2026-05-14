import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, shareReplay } from 'rxjs';
import { type PublicSkill, type SkillTier, type SkillTierGroup, SKILL_TIERS } from './skill.types';

/**
 * Narrative labels for tier group eyebrows on the home Stack section. Distinct
 * from `SKILL_TIER_LABELS` in `@portfolio/shared/enum-labels` (which is the
 * concise variant used by the console table/select — "Daily" / "Shipped").
 * Landing wants editorial phrasing ("Daily drivers" / "Shipped with").
 */
const TIER_LABEL: Record<SkillTier, string> = {
  DAILY: 'Daily drivers',
  FREQUENT: 'Frequent',
  SHIPPED: 'Shipped with',
};

@Injectable({ providedIn: 'root' })
export class SkillService {
  private http = inject(HttpClient);

  /** Cached for the lifetime of the singleton service. See ProfileService for rationale. */
  private skills$?: Observable<PublicSkill[]>;

  getPublicSkills(): Observable<PublicSkill[]> {
    this.skills$ ??= this.http.get<PublicSkill[]>(`/api/skills/all`).pipe(
      catchError(() => of([])),
      shareReplay({ bufferSize: 1, refCount: false })
    );
    return this.skills$;
  }

  /**
   * Groups public skills by `tier` (DAILY / FREQUENT / SHIPPED) for the cii stack
   * proposal. Order follows `SKILL_TIERS`. Umbrella skills (parentSkillId === null)
   * are excluded — only leaf skills tier-grouped. Members sorted by `displayOrder`
   * then `name`. Empty tiers are still emitted to keep the structure visible.
   */
  getSkillsByTier(): Observable<readonly SkillTierGroup[]> {
    return this.getPublicSkills().pipe(map((skills) => groupByTier(skills)));
  }
}

function groupByTier(skills: readonly PublicSkill[]): readonly SkillTierGroup[] {
  const memberSort = (a: PublicSkill, b: PublicSkill): number =>
    a.displayOrder - b.displayOrder || a.name.localeCompare(b.name);

  return SKILL_TIERS.map((tier) => ({
    tier,
    label: TIER_LABEL[tier],
    members: skills.filter((s) => s.parentSkillId !== null && s.tier === tier).sort(memberSort),
  }));
}
