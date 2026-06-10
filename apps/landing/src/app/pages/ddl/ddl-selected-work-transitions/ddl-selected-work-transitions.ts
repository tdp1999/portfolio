import { ChangeDetectionStrategy, Component, computed, linkedSignal, signal } from '@angular/core';
import {
  Container,
  Breadcrumb,
  Segmented,
  type BreadcrumbItem,
  type SegmentOption,
} from '@portfolio/landing/shared/ui';
import { PROJECTS } from './ddl-selected-work-transitions.data';

@Component({
  selector: 'landing-ddl-selected-work-transitions',
  standalone: true,
  imports: [Container, Breadcrumb, Segmented],
  templateUrl: './ddl-selected-work-transitions.html',
  styleUrl: './ddl-selected-work-transitions.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DdlSelectedWorkTransitions {
  // ── Properties ─────────────────────────────────────────────────────
  protected readonly breadcrumb: readonly BreadcrumbItem[] = [
    { label: 'DDL', href: '/ddl' },
    { label: 'Selected Work — Transitions' },
  ];
  protected readonly projects = PROJECTS;

  // ── Computed ───────────────────────────────────────────────────────
  protected readonly segments = computed<readonly SegmentOption[]>(() =>
    this.projects.map((p) => ({ id: p.slug, label: p.title.toUpperCase() }))
  );

  // ── State ──────────────────────────────────────────────────────────
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

  // ── Methods ────────────────────────────────────────────────────────
  setActiveV4(slug: string): void {
    this.prevIndexV4.set(this.indexV4());
    this.activeV4.set(slug);
  }
}
