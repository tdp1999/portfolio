import type { PublicSkill } from '@portfolio/landing/shared/data-access';
import type { RingNode } from './ddl-depth-map.v2.types';
import { CX, CY } from './ddl-depth-map.v2.data';

export function placeOnRing(skill: PublicSkill, index: number, total: number, radius: number): RingNode {
  const angle = (index / Math.max(total, 1)) * 2 * Math.PI - Math.PI / 2;
  const x = CX + radius * Math.cos(angle);
  const y = CY + radius * Math.sin(angle);
  // Anchor text away from the center so long labels don't overlap the rings.
  const cosA = Math.cos(angle);
  const anchor: RingNode['anchor'] = cosA > 0.3 ? 'start' : cosA < -0.3 ? 'end' : 'middle';
  return {
    id: skill.id,
    name: skill.name,
    iconUrl: skill.iconUrl,
    proficiencyNote: skill.proficiencyNote,
    x,
    y,
    anchor,
  };
}
