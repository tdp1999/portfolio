import type { DdlVariant } from '../ddl.types';
import { buildIconUrl } from './ddl-stack.util';

export interface Skill {
  readonly name: string;
  readonly icon: string;
}

// Open decision (exploring): the center-aligned intro above the chip rack — three
// takes, no winner yet. Tier grouping, brand-color icons, and the L3 stagger are
// already decided (noted in the lead prose); this record tracks only the intro pick.
export const STACK_VARIANTS: readonly DdlVariant[] = [
  {
    id: 'ci',
    label: 'ci — eyebrow + tagline, center',
    note: 'Most cohesive with the rest of the home (eyebrow stays consistent across sections). Quiet — leaves the chips to do the talking. The proposal default.',
  },
  {
    id: 'cii',
    label: 'cii — display heading center + italic accent',
    note: 'Strongest editorial register, closest to the reference portfolio. Costs vertical space and pressures other sections to also display-heading.',
  },
  {
    id: 'ciii',
    label: 'ciii — condensed center, one line, no eyebrow',
    note: 'Purest minimalism; drops the section-number eyebrow entirely. Risks losing wayfinding (the eyebrow is the "where am I" cue elsewhere on the page).',
  },
];

export const SKILLS = {
  daily: [
    { name: 'Angular', icon: buildIconUrl('logos:angular-icon') },
    { name: 'TypeScript', icon: buildIconUrl('logos:typescript-icon') },
    { name: 'Angular Material', icon: buildIconUrl('logos:material-design-icon') },
  ] as readonly Skill[],
  frequent: [
    { name: 'RxJS', icon: buildIconUrl('logos:reactivex') },
    { name: 'Signals', icon: buildIconUrl('simple-icons:angular', 'DD0031') },
    { name: 'SSR', icon: buildIconUrl('simple-icons:webcomponentsdotorg', 'A78BFA') },
    { name: 'TipTap', icon: buildIconUrl('simple-icons:tldraw', 'FFFFFF') },
    { name: 'Tailwind', icon: buildIconUrl('logos:tailwindcss-icon') },
    { name: 'SCSS', icon: buildIconUrl('logos:sass') },
    { name: 'NestJS', icon: buildIconUrl('logos:nestjs') },
    { name: 'Prisma', icon: buildIconUrl('simple-icons:prisma', 'B8C5D6') },
    { name: 'Postgres', icon: buildIconUrl('logos:postgresql') },
  ] as readonly Skill[],
  shipped: [
    { name: 'Nx', icon: buildIconUrl('logos:nx') },
    { name: 'Jest', icon: buildIconUrl('logos:jest') },
    { name: 'Playwright', icon: buildIconUrl('logos:playwright') },
    { name: 'Claude Code', icon: buildIconUrl('simple-icons:anthropic', 'D97757') },
  ] as readonly Skill[],
} as const;
