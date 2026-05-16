import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  ContainerComponent,
  EyebrowComponent,
  IconComponent,
  LandingBreadcrumbComponent,
  LandingIconArrowComponent,
  LandingSectionHeaderComponent,
  SectionRuleComponent,
  type BreadcrumbItem,
} from '@portfolio/landing/shared/ui';

const ICONIFY = 'https://api.iconify.design';
const brand = (slug: string, color?: string) =>
  color ? `${ICONIFY}/${slug}.svg?color=${encodeURIComponent('#' + color)}` : `${ICONIFY}/${slug}.svg`;

type ToolEntry = {
  readonly monogram: string;
  readonly icon: string; // iconify slug (brand colour pre-baked)
  readonly lucide: string; // outline lucide name registered in icon provider
  readonly name: string;
  readonly reason: string;
  readonly href: string;
};

type ToolCategory = {
  readonly num: string;
  readonly id: string;
  readonly title: string;
  readonly entries: readonly ToolEntry[];
};

const SAMPLE_CATEGORIES: readonly ToolCategory[] = [
  {
    num: '02',
    id: 'editor',
    title: 'Editor',
    entries: [
      {
        monogram: 'VS',
        icon: brand('logos:visual-studio-code'),
        lucide: 'code',
        name: 'VS Code',
        reason: 'Primary editor. GitHub Dark theme, format-on-save, Vim keymap off.',
        href: 'https://code.visualstudio.com',
      },
      {
        monogram: 'Cu',
        icon: brand('simple-icons:cursor', 'D4D4D4'),
        lucide: 'code',
        name: 'Cursor',
        reason: 'When a refactor needs Claude in the loop — opens the same workspace as VS Code.',
        href: 'https://cursor.sh',
      },
    ],
  },
  {
    num: '04',
    id: 'cli',
    title: 'CLI',
    entries: [
      {
        monogram: 'pn',
        icon: brand('logos:pnpm'),
        lucide: 'briefcase',
        name: 'pnpm',
        reason: 'Workspace package manager — tighter disk usage than npm, faster cold installs.',
        href: 'https://pnpm.io',
      },
      {
        monogram: 'nx',
        icon: brand('logos:nx'),
        lucide: 'layout-grid',
        name: 'Nx',
        reason: 'Monorepo orchestrator. `nx affected` is the daily workhorse for tests and builds.',
        href: 'https://nx.dev',
      },
      {
        monogram: 'gh',
        icon: brand('simple-icons:github', 'F0F6FC'),
        lucide: 'github',
        name: 'gh',
        reason: 'GitHub CLI — PR review and check status without leaving the terminal.',
        href: 'https://cli.github.com',
      },
    ],
  },
];

@Component({
  selector: 'landing-uses-card-variants-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ContainerComponent,
    EyebrowComponent,
    IconComponent,
    LandingBreadcrumbComponent,
    LandingIconArrowComponent,
    LandingSectionHeaderComponent,
    SectionRuleComponent,
  ],
  templateUrl: './uses-card-variants.page.html',
  styleUrl: './uses-card-variants.page.scss',
})
export class UsesCardVariantsPage {
  readonly breadcrumb: readonly BreadcrumbItem[] = [{ label: 'DDL', href: '/ddl' }, { label: 'Uses — card variants' }];
  readonly categories = SAMPLE_CATEGORIES;
  readonly sampleEntry = SAMPLE_CATEGORIES[0].entries[0];
}
