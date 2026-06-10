import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, shareReplay } from 'rxjs';
import type { PublicSkill, SkillTierGroup } from './skill.types';
import { groupByTier } from './skill.util';

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
