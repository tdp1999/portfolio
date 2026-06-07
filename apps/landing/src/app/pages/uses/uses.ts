import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import {
  Container,
  ContentSection,
  PageShell,
  type BreadcrumbItem,
  type ContentSectionData,
} from '@portfolio/landing/shared/ui';

// Procida Rule 4 (specific, not generic). Tool name + 1-line reason + link per entry.
const USES_SECTIONS: readonly ContentSectionData[] = [
  {
    num: '01',
    id: 'hardware',
    title: 'Hardware',
    entries: [
      {
        monogram: 'X1',
        name: 'ThinkPad X1 Carbon Gen 10',
        reason: '14" Intel i7, 32 GB RAM — daily driver since 2023. Sturdy keyboard, runs Windows 11.',
        href: 'https://www.lenovo.com/us/en/p/laptops/thinkpad/thinkpadx1/x1-carbon-gen-10/22tp2x1x1c0',
      },
    ],
  },
  {
    num: '02',
    id: 'editor',
    title: 'Editor',
    entries: [
      {
        monogram: 'Vs',
        name: 'VS Code',
        reason: 'Primary editor. GitHub Dark theme, format-on-save, Vim keymap off.',
        href: 'https://code.visualstudio.com',
      },
      {
        monogram: 'Cu',
        name: 'Cursor',
        reason: 'When a refactor needs Claude in the loop — opens the same workspace as VS Code.',
        href: 'https://cursor.sh',
      },
    ],
  },
  {
    num: '03',
    id: 'terminal',
    title: 'Terminal',
    entries: [
      {
        monogram: 'Wt',
        name: 'Windows Terminal',
        reason: 'PowerShell 7 host with WSL2 (Ubuntu) and Git Bash as side tabs.',
        href: 'https://aka.ms/terminal',
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
        name: 'pnpm',
        reason: 'Workspace package manager — tighter disk usage than npm, faster cold installs.',
        href: 'https://pnpm.io',
      },
      {
        monogram: 'nx',
        name: 'Nx',
        reason: 'Monorepo orchestrator. `nx affected` is the daily workhorse for tests and builds.',
        href: 'https://nx.dev',
      },
      {
        monogram: 'gh',
        name: 'gh',
        reason: 'GitHub CLI — PR review and check status without leaving the terminal.',
        href: 'https://cli.github.com',
      },
    ],
  },
  {
    num: '05',
    id: 'browser',
    title: 'Browser',
    entries: [
      {
        monogram: 'Cr',
        name: 'Chrome',
        reason: 'Daily browser. DevTools + Lighthouse is where I tune landing performance.',
        href: 'https://www.google.com/chrome',
      },
      {
        monogram: 'Fx',
        name: 'Firefox Developer Edition',
        reason: 'Second opinion on render quirks and color-space behaviour.',
        href: 'https://www.mozilla.org/firefox/developer',
      },
    ],
  },
  {
    num: '06',
    id: 'fonts',
    title: 'Fonts',
    entries: [
      {
        monogram: 'In',
        name: 'Inter',
        reason: 'UI sans — bound to `--landing-font-body`. Sharp at small sizes, neutral voice.',
        href: 'https://rsms.me/inter',
      },
      {
        monogram: 'Ns',
        name: 'Newsreader',
        reason: 'Display serif italic — used for accent words inside section headers (display-xl/lg).',
        href: 'https://fonts.google.com/specimen/Newsreader',
      },
      {
        monogram: 'Jb',
        name: 'JetBrains Mono',
        reason: 'Terminal + code + landing `landing-link`. Ligatures on; NF variant for icons.',
        href: 'https://www.jetbrains.com/lp/mono',
      },
    ],
  },
  {
    num: '07',
    id: 'other',
    title: 'Other',
    entries: [
      {
        monogram: 'Ex',
        name: 'Excalidraw',
        reason: 'System diagrams. Hand-drawn aesthetic matches the human/specific voice.',
        href: 'https://excalidraw.com',
      },
      {
        monogram: 'Ob',
        name: 'Obsidian',
        reason: 'Engineering journal — daily note plus literature notes synced to a private repo.',
        href: 'https://obsidian.md',
      },
    ],
  },
];

@Component({
  selector: 'landing-uses',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Container, PageShell, ContentSection],
  templateUrl: './uses.html',
  styleUrls: ['./uses.scss'],
})
export class Uses {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  constructor() {
    this.title.setTitle('Uses | Phuong Tran');
    this.meta.updateTag({
      name: 'description',
      content: 'Hardware, editor, terminal, CLI, browser, and fonts I reach for daily.',
    });
  }

  readonly breadcrumb: readonly BreadcrumbItem[] = [{ label: 'Home', href: '/' }, { label: 'Uses' }];
  readonly sections = USES_SECTIONS;
  readonly lastUpdated = '2026-05';
}
