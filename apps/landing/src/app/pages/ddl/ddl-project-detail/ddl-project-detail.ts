import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import {
  Chip,
  Container,
  Eyebrow,
  BrowserWindow,
  Heading,
  LandingScrollspyService,
  TocSidebar,
  Segmented,
  ShowMore,
} from '@portfolio/landing/shared/ui';
import type { AspectRatio, Layout } from './ddl-project-detail.types';
import {
  ASPECT_OPTIONS,
  LAYOUT_OPTIONS,
  SECTIONS,
  LOREM,
  SKILLS,
  COVER_URL,
  META_ROWS,
  PROJECT_DETAIL_VARIANTS,
} from './ddl-project-detail.data';

import { DdlDecisionRecord } from '../ddl-decision-record/ddl-decision-record';
import { DdlDocPage } from '../ddl-doc-page/ddl-doc-page';
import { DdlSection } from '../ddl-section/ddl-section';
import { DdlStage } from '../ddl-stage/ddl-stage';

@Component({
  selector: 'landing-ddl-project-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [LandingScrollspyService],
  imports: [
    NgTemplateOutlet,
    Container,
    Segmented,
    Chip,
    Eyebrow,
    BrowserWindow,
    Heading,
    TocSidebar,
    ShowMore,
    DdlDocPage,
    DdlDecisionRecord,
    DdlSection,
    DdlStage,
  ],
  templateUrl: './ddl-project-detail.html',
  styleUrl: './ddl-project-detail.scss',
})
export class DdlProjectDetail {
  // ── DI ────────────────────────────────────────────────────────────
  private readonly scrollspy = inject(LandingScrollspyService);

  // ── Properties ─────────────────────────────────────────────────────
  protected readonly variants = PROJECT_DETAIL_VARIANTS;
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
