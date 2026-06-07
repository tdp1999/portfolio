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
  type InPageSection,
  type SegmentOption,
} from '@portfolio/landing/shared/ui';

type AspectRatio = '4-3' | '3-2' | '16-9' | '21-9' | 'natural-capped';
type Layout = 'current' | 'toc-right-strip' | 'toc-right-bundled' | 'three-col';

const ASPECT_OPTIONS: readonly SegmentOption[] = [
  { id: '4-3', label: '4 : 3' },
  { id: '3-2', label: '3 : 2' },
  { id: '16-9', label: '16 : 9' },
  { id: '21-9', label: '21 : 9' },
  { id: 'natural-capped', label: 'Natural · capped' },
];

const LAYOUT_OPTIONS: readonly SegmentOption[] = [
  { id: 'current', label: 'Current · meta+TOC left' },
  { id: 'toc-right-strip', label: 'TOC right · meta strip' },
  { id: 'toc-right-bundled', label: 'TOC right · meta bundled' },
  { id: 'three-col', label: '3-col · meta L · TOC R' },
];

const SECTIONS: readonly InPageSection[] = [
  { id: 'overview', title: 'Overview', level: 2 },
  { id: 'overview-context', title: 'Context', level: 3 },
  { id: 'overview-scope', title: 'Scope', level: 3 },
  { id: 'motivation', title: 'Motivation', level: 2 },
  { id: 'role', title: 'My role', level: 2 },
  { id: 'role-backend', title: 'Backend', level: 3 },
  { id: 'role-backend-api', title: 'API layer', level: 4 },
  { id: 'role-backend-db', title: 'Database', level: 4 },
  { id: 'role-frontend', title: 'Frontend', level: 3 },
  { id: 'role-frontend-state', title: 'State machine', level: 4 },
  { id: 'highlights', title: 'Highlights', level: 2 },
  { id: 'stack-notes', title: 'Stack notes', level: 2 },
  { id: 'lessons', title: 'Lessons', level: 2 },
];

const LOREM =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean euismod bibendum laoreet. Proin gravida dolor sit amet lacus accumsan et viverra justo commodo. Proin sodales pulvinar sic tempor. Nam fermentum, nulla luctus pharetra vulputate, felis tellus mollis orci, sed rhoncus pronin sapien nunc accuan eget.';

const SKILLS: readonly string[] = ['TypeScript', 'Angular', 'Nx', 'Tailwind', 'NestJS', 'Postgres'];

const COVER_URL = 'https://picsum.photos/id/180/2400/1350';

const META_ROWS = [
  { label: 'Role', value: 'Lead developer · solo' },
  { label: 'Stack', value: 'TypeScript · Angular · Nx · Tailwind · NestJS · Postgres' },
  { label: 'Year', value: '2025 → Present' },
  { label: 'Status', value: 'Live' },
] as const;

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
  private readonly scrollspy = inject(LandingScrollspyService);

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
