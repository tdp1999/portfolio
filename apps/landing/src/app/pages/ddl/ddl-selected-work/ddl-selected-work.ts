import { ChangeDetectionStrategy, Component, computed, linkedSignal, signal } from '@angular/core';
import { Segmented, type SegmentOption } from '@portfolio/landing/shared/ui';

import { DdlDecisionRecord } from '../ddl-decision-record/ddl-decision-record';
import { DdlDocPage } from '../ddl-doc-page/ddl-doc-page';
import { DdlSection } from '../ddl-section/ddl-section';
import { PROJECTS, SELECTED_WORK_VARIANTS } from './ddl-selected-work.data';

@Component({
  selector: 'landing-ddl-selected-work',
  standalone: true,
  imports: [Segmented, DdlDocPage, DdlSection, DdlDecisionRecord],
  templateUrl: './ddl-selected-work.html',
  styleUrl: './ddl-selected-work.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DdlSelectedWork {
  // ── Properties ─────────────────────────────────────────────────────
  protected readonly variants = SELECTED_WORK_VARIANTS;
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
