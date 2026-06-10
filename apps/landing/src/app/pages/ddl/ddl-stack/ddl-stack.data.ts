import { buildIconUrl } from './ddl-stack.util';

export interface Skill {
  readonly name: string;
  readonly icon: string;
}

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
