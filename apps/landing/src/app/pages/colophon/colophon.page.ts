import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import {
  ContainerComponent,
  LandingBreadcrumbComponent,
  LandingContentSectionComponent,
  LandingPageHeroComponent,
  SectionComponent,
  type BreadcrumbItem,
  type ContentSection,
} from '@portfolio/landing/shared/ui';

// /colophon content. Voice consistent with /uses and home: specific (Procida 4),
// honest about influence (Procida 9). Each entry names the thing + 1-line reason
// + link. Moodboard pins credited as the references they are (E4 epic locked them).
const COLOPHON_SECTIONS: readonly ContentSection[] = [
  {
    num: '01',
    id: 'stack',
    title: 'Stack',
    entries: [
      {
        monogram: 'Ag',
        name: 'Angular 21',
        reason: 'Signals + standalone + SSR. The landing pre-renders; the console hydrates.',
        href: 'https://angular.dev',
      },
      {
        monogram: 'Ns',
        name: 'NestJS 11',
        reason: 'DDD-per-module — domain / application / infrastructure / presentation. Boring is the goal.',
        href: 'https://nestjs.com',
      },
      {
        monogram: 'Pr',
        name: 'Prisma',
        reason: 'Type-safe Postgres access. Migrations live in repo; schema is the contract.',
        href: 'https://www.prisma.io',
      },
      {
        monogram: 'Pg',
        name: 'Postgres',
        reason: 'Single managed Postgres for landing data + auth. Same DB the admin console edits.',
        href: 'https://www.postgresql.org',
      },
      {
        monogram: 'Nx',
        name: 'Nx 22',
        reason: 'Monorepo orchestrator. `nx affected` keeps CI honest as the workspace grows.',
        href: 'https://nx.dev',
      },
      {
        monogram: 'Tw',
        name: 'Tailwind + SCSS',
        reason: 'Utility-first for layout, SCSS modules for component contracts. No global rules.',
        href: 'https://tailwindcss.com',
      },
      {
        monogram: 'Rl',
        name: 'Railway',
        reason: 'Hosting + Postgres + SSR app. One platform; Cloudflare in front for DNS + edge cache.',
        href: 'https://railway.com',
      },
      {
        monogram: 'Cd',
        name: 'Cloudinary',
        reason: 'Image host + transforms. Reached by media picker in the console; URL-only on landing.',
        href: 'https://cloudinary.com',
      },
    ],
  },
  {
    num: '02',
    id: 'tools',
    title: 'Tools',
    entries: [
      {
        monogram: 'Ex',
        name: 'Excalidraw',
        reason: 'Architecture diagrams + figure annotations. Hand-drawn aesthetic matches the voice.',
        href: 'https://excalidraw.com',
      },
      {
        monogram: 'Ob',
        name: 'Obsidian',
        reason: 'Engineering journal + draft writing. Drafts move to repo when they earn it.',
        href: 'https://obsidian.md',
      },
      {
        monogram: 'Cl',
        name: 'Claude Code',
        reason: 'Primary AI pair. Slash-commands from TDP plugins drive the project workflow.',
        href: 'https://claude.com/claude-code',
      },
      {
        monogram: 'Fg',
        name: 'Figma',
        reason: 'Low-fidelity layout sketches before code. Final design lives in the DDL route, not Figma.',
        href: 'https://www.figma.com',
      },
      {
        monogram: 'Ss',
        name: 'macOS screenshot',
        reason: 'Captures for case study figures. Beautified with a small ImageMagick script, not a SaaS.',
        href: 'https://support.apple.com/guide/mac-help/take-a-screenshot-mh26782/mac',
      },
    ],
  },
  {
    num: '03',
    id: 'sources',
    title: 'Sources & credits',
    entries: [
      {
        monogram: 'Ln',
        name: 'Linear',
        reason: 'Quiet confidence on dark; hairline borders; mono-flavored UI labels. The reference for tone.',
        href: 'https://linear.app',
      },
      {
        monogram: 'Sp',
        name: 'Stripe Press',
        reason: 'Editorial serif logo + italic tagline. Where the dark-but-not-black palette idea came from.',
        href: 'https://press.stripe.com',
      },
      {
        monogram: 'Rw',
        name: 'Railway',
        reason: 'Technical density with calm voice ("Ship software peacefully"). Validates restraint over polish.',
        href: 'https://railway.com',
      },
      {
        monogram: 'Vc',
        name: 'Vercel Docs',
        reason: 'Mature dark UI + right-rail navigation. Pattern lifted directly for the project case-study layout.',
        href: 'https://vercel.com/docs',
      },
      {
        monogram: 'Ds',
        name: 'Design Systems Surf',
        reason: 'Editorial-magazine-of-products framing. Inspiration for the /projects index density.',
        href: 'https://designsystems.surf',
      },
      {
        monogram: 'Ki',
        name: 'Kiro',
        reason: 'Big bold sans hero on dark; product mock embedded. Reference for the home hero composition.',
        href: 'https://kiro.dev',
      },
      {
        monogram: 'Pa',
        name: 'Parth Sharma',
        reason:
          'Direction validator — sans display + serif italic emphasis rhythm. The closest published proof the direction ships.',
        href: 'https://parthh.in',
      },
    ],
  },
  {
    num: '04',
    id: 'type',
    title: 'Type',
    entries: [
      {
        monogram: 'In',
        name: 'Inter',
        reason: 'UI sans bound to `--landing-font-body`. Sharp at small sizes, neutral voice for long-form reading.',
        href: 'https://rsms.me/inter',
      },
      {
        monogram: 'Nr',
        name: 'Newsreader',
        reason: 'Display serif italic — used for accent words inside section headers (display-xl/lg).',
        href: 'https://fonts.google.com/specimen/Newsreader',
      },
      {
        monogram: 'Jb',
        name: 'JetBrains Mono',
        reason: 'Code + metadata + landing-link. Ligatures on; NF variant in the terminal.',
        href: 'https://www.jetbrains.com/lp/mono',
      },
    ],
  },
];

@Component({
  selector: 'landing-colophon-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    ContainerComponent,
    SectionComponent,
    LandingBreadcrumbComponent,
    LandingPageHeroComponent,
    LandingContentSectionComponent,
  ],
  templateUrl: './colophon.page.html',
  styleUrls: ['./colophon.page.scss'],
})
export class ColophonPage {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  constructor() {
    this.title.setTitle('Colophon | Phuong Tran');
    this.meta.updateTag({
      name: 'description',
      content: 'Stack, tools, and sources behind this site — credited honestly.',
    });
  }

  readonly breadcrumb: readonly BreadcrumbItem[] = [{ label: 'Home', href: '/' }, { label: 'Colophon' }];
  readonly sections = COLOPHON_SECTIONS;
  readonly lastUpdated = '2026-05';
}
