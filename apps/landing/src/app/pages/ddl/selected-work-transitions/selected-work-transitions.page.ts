import { ChangeDetectionStrategy, Component, computed, linkedSignal, signal } from '@angular/core';
import {
  ContainerComponent,
  LandingBreadcrumbComponent,
  SegmentedComponent,
  type BreadcrumbItem,
  type SegmentOption,
} from '@portfolio/landing/shared/ui';

type MockProject = {
  readonly slug: string;
  readonly title: string;
  readonly year: string;
  readonly role: string;
  readonly description: string;
  readonly skills: readonly string[];
  readonly imageUrls: readonly string[];
};

const PROJECTS: readonly MockProject[] = [
  {
    slug: 'audit-console',
    title: 'Audit Console',
    year: '2024',
    role: 'Frontend lead',
    description:
      'A permission-grade audit dashboard for fintech ops — built around column-aware tables, ' +
      'replayable filter state, and predictable empty states. The kind of console you trust at 2am.',
    skills: ['Angular', 'NgRx', 'Postgres', 'Nx'],
    imageUrls: [
      'https://picsum.photos/seed/audit-1/960/720',
      'https://picsum.photos/seed/audit-2/960/720',
      'https://picsum.photos/seed/audit-3/960/720',
    ],
  },
  {
    slug: 'doc-engine',
    title: 'Document Engine',
    year: '2023',
    role: 'IC engineer',
    description:
      'A template + variable engine that renders Singapore-market loan documents at compile time. ' +
      'Plugin-extensible, fault-injecting test rig, full audit trail per render.',
    skills: ['TypeScript', 'NestJS', 'TipTap', 'Playwright'],
    imageUrls: ['https://picsum.photos/seed/doc-1/960/720', 'https://picsum.photos/seed/doc-2/960/720'],
  },
  {
    slug: 'rte',
    title: 'Rich Text Editor',
    year: '2025',
    role: 'Solo build',
    description:
      'Self-shipped TipTap extension powering this very portfolio. Custom block schema, inline marks, ' +
      'and a markdown serializer that I had to write because the off-the-shelf ones lied about coverage.',
    skills: ['TipTap', 'ProseMirror', 'Angular signals'],
    imageUrls: [
      'https://picsum.photos/seed/rte-1/960/720',
      'https://picsum.photos/seed/rte-2/960/720',
      'https://picsum.photos/seed/rte-3/960/720',
      'https://picsum.photos/seed/rte-4/960/720',
    ],
  },
];

@Component({
  selector: 'landing-selected-work-transitions-page',
  standalone: true,
  imports: [ContainerComponent, LandingBreadcrumbComponent, SegmentedComponent],
  templateUrl: './selected-work-transitions.page.html',
  styleUrl: './selected-work-transitions.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectedWorkTransitionsPage {
  protected readonly breadcrumb: readonly BreadcrumbItem[] = [
    { label: 'DDL', href: '/ddl' },
    { label: 'Selected Work — Transitions' },
  ];

  protected readonly projects = PROJECTS;
  protected readonly segments = computed<readonly SegmentOption[]>(() =>
    this.projects.map((p) => ({ id: p.slug, label: p.title.toUpperCase() }))
  );

  /** Independent active id per variant so users can compare side-by-side without the segmented controls fighting each other. */
  protected readonly activeV1 = linkedSignal<string>(() => this.projects[0]?.slug ?? '');
  protected readonly activeV2 = linkedSignal<string>(() => this.projects[0]?.slug ?? '');
  protected readonly activeV3 = linkedSignal<string>(() => this.projects[0]?.slug ?? '');
  protected readonly activeV4 = linkedSignal<string>(() => this.projects[0]?.slug ?? '');

  protected readonly projectV1 = computed(
    () => this.projects.find((p) => p.slug === this.activeV1()) ?? this.projects[0]
  );
  protected readonly projectV2 = computed(
    () => this.projects.find((p) => p.slug === this.activeV2()) ?? this.projects[0]
  );
  protected readonly projectV3 = computed(
    () => this.projects.find((p) => p.slug === this.activeV3()) ?? this.projects[0]
  );
  protected readonly projectV4 = computed(
    () => this.projects.find((p) => p.slug === this.activeV4()) ?? this.projects[0]
  );

  /** Index of the active project per variant — used by V4 to decide slide direction (forward vs back). */
  protected readonly indexV4 = computed(() => this.projects.findIndex((p) => p.slug === this.activeV4()));
  private readonly prevIndexV4 = signal<number>(0);
  protected readonly directionV4 = computed<'forward' | 'back'>(() => {
    const cur = this.indexV4();
    const prev = this.prevIndexV4();
    return cur >= prev ? 'forward' : 'back';
  });

  setActiveV4(slug: string): void {
    this.prevIndexV4.set(this.indexV4());
    this.activeV4.set(slug);
  }
}
