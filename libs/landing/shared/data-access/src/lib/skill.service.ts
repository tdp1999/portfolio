import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, shareReplay } from 'rxjs';
import { type PublicSkill, type SkillGroup, UMBRELLA_SLUGS, type UmbrellaSlug } from './skill.types';

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
   * Groups public skills under the 6 seeded umbrella slugs (E2 §4 Tier 2).
   * Order follows `UMBRELLA_SLUGS`. Members sorted by `displayOrder` then `name`.
   * Umbrellas with no members are still emitted so the structure stays visible.
   */
  getGroupedSkills(): Observable<readonly SkillGroup[]> {
    return this.getPublicSkills().pipe(map((skills) => groupByUmbrella(skills)));
  }
}

function groupByUmbrella(skills: readonly PublicSkill[]): readonly SkillGroup[] {
  const umbrellas = new Map<UmbrellaSlug, PublicSkill>();
  for (const s of skills) {
    if (s.parentSkillId === null && (UMBRELLA_SLUGS as readonly string[]).includes(s.slug)) {
      umbrellas.set(s.slug as UmbrellaSlug, s);
    }
  }

  const memberSort = (a: PublicSkill, b: PublicSkill): number =>
    a.displayOrder - b.displayOrder || a.name.localeCompare(b.name);

  return UMBRELLA_SLUGS.map((slug) => {
    const umbrella = umbrellas.get(slug);
    if (!umbrella) return { slug, label: prettyLabel(slug), members: [] as readonly PublicSkill[] };
    const members = skills.filter((s) => s.parentSkillId === umbrella.id).sort(memberSort);
    return { slug, label: umbrella.name, members };
  });
}

function prettyLabel(slug: UmbrellaSlug): string {
  switch (slug) {
    case 'languages':
      return 'Languages';
    case 'frontend':
      return 'Frontend';
    case 'library-work':
      return 'Library work';
    case 'backend':
      return 'Backend';
    case 'tooling':
      return 'Tooling';
    case 'workflow-and-ai':
      return 'Workflow & AI';
  }
}
