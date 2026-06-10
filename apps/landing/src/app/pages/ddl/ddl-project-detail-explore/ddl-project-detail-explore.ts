import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import {
  Chip,
  Container,
  Eyebrow,
  Breadcrumb,
  BrowserWindow,
  Heading,
  LandingScrollspyService,
  SectionHeader,
  TocSidebar,
  Section,
  Segmented,
  ShowMore,
  type BreadcrumbItem,
} from '@portfolio/landing/shared/ui';
import type { AspectRatio, Layout } from './ddl-project-detail-explore.types';
import {
  ASPECT_OPTIONS,
  LAYOUT_OPTIONS,
  SECTIONS,
  LOREM,
  SKILLS,
  COVER_URL,
  META_ROWS,
} from './ddl-project-detail-explore.data';

@Component({
  selector: 'landing-ddl-project-detail-explore',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [LandingScrollspyService],
  imports: [
    NgTemplateOutlet,
    Container,
    Section,
    Segmented,
    Chip,
    Eyebrow,
    Breadcrumb,
    BrowserWindow,
    Heading,
    SectionHeader,
    TocSidebar,
    ShowMore,
  ],
  templateUrl: './ddl-project-detail-explore.html',
  styleUrl: './ddl-project-detail-explore.scss',
})
export class DdlProjectDetailExplore {
  // ── DI ────────────────────────────────────────────────────────────
  private readonly scrollspy = inject(LandingScrollspyService);

  // ── Properties ─────────────────────────────────────────────────────
  readonly aspectOptions = ASPECT_OPTIONS;
  readonly layoutOptions = LAYOUT_OPTIONS;
  readonly sections = SECTIONS;
  /** Shorter body for the tablet frames so each preview stays a reasonable height. */
  readonly articleSections = SECTIONS.slice(0, 5);
  readonly lorem = LOREM;
  readonly skills = SKILLS;
  readonly metaRows = META_ROWS;
  readonly links: readonly { label: string; href: string }[] = [
    { label: 'Repository', href: '#' },
    { label: 'Live demo', href: '#' },
    { label: 'Case study', href: '#' },
  ];
  readonly coverUrl = COVER_URL;
  readonly breadcrumb: readonly BreadcrumbItem[] = [
    { label: 'Home', href: '/' },
    { label: 'DDL', href: '/ddl' },
    { label: 'Project Detail Explore' },
  ];

  // ── State ──────────────────────────────────────────────────────────
  readonly aspect = signal<AspectRatio>('16-9');
  readonly layout = signal<Layout>('toc-right-strip');

  readonly heroClass = computed(() => `project-hero project-hero--${this.aspect()}`);
  readonly bodyClass = computed(() => `project-body project-body--${this.layout()}`);

  /** Show metadata in left sidebar (current + 3-col layouts). */
  readonly showMetaLeft = computed(() => this.layout() === 'current' || this.layout() === 'three-col');
  /** Show metadata as a horizontal strip below the hero. */
  readonly showMetaStrip = computed(() => this.layout() === 'toc-right-strip');
  /** Show metadata bundled with TOC on the right. */
  readonly showMetaRight = computed(() => this.layout() === 'toc-right-bundled');
  /** Show TOC on left (current layout only). */
  readonly showTocLeft = computed(() => this.layout() === 'current');
  /** Show TOC on right (all other layouts). */
  readonly showTocRight = computed(() => this.layout() !== 'current');

  constructor() {
    this.scrollspy.setSections(SECTIONS);
  }

  setAspect(value: string): void {
    if (ASPECT_OPTIONS.some((o) => o.id === value)) {
      this.aspect.set(value as AspectRatio);
    }
  }

  setLayout(value: string): void {
    if (LAYOUT_OPTIONS.some((o) => o.id === value)) {
      this.layout.set(value as Layout);
    }
  }
}
