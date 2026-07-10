import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, input, model } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { STATUS_ICONS } from '../scrollspy-rail/scrollspy-rail.constants';
import type { SectionDescriptor, SectionStatus } from '../scrollspy-rail/scrollspy-rail.types';
import type { SectionTabGroup } from './section-tabs.types';

/**
 * Vertical-tab section navigation for long console forms. Replaces the
 * `LongFormLayout + ScrollspyRail` long-form chassis: instead of scrolling to a
 * section, the rail (desktop) / horizontal strip (mobile) swaps to show one at a
 * time. See ADR-024.
 *
 * The consumer keeps ownership of the section bodies and projects them as content,
 * gating each with `[hidden]="!showAll() && activeId() !== '<id>'"` so they stay
 * mounted (unsaved edits + per-section status survive tab switches). `activeId` is
 * two-way and also deep-links via the URL fragment.
 *
 * A **Show all** toggle flips to a stacked view (every section at once) for forms
 * whose sections are small. The choice is remembered per route in localStorage;
 * `showAll` is two-way, so the consumer sets the code default.
 *
 * Pass `groups` for a grouped rail, or the flat `sections` convenience for a single
 * ungrouped list.
 */
@Component({
  selector: 'console-section-tabs',
  standalone: true,
  templateUrl: './section-tabs.html',
  styleUrl: './section-tabs.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionTabsLayout implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);

  /** Flat, ungrouped tabs. Ignored when `groups` is provided. */
  readonly sections = input<SectionDescriptor[]>([]);
  /** Grouped tabs. Takes precedence over `sections`. */
  readonly groups = input<SectionTabGroup[] | null>(null);
  /** Optional header shown at the top of the rail. */
  readonly title = input<string>('');
  /** Show the Previous / Next stepper below the content (tabbed mode only). */
  readonly showStepper = input<boolean>(true);

  /** Active section id (two-way; also synced to the URL fragment). */
  readonly activeId = model<string>('');
  /** Stacked "show all sections" mode (two-way; consumer sets the default). */
  readonly showAll = model<boolean>(false);

  protected readonly effectiveGroups = computed<SectionTabGroup[]>(
    () => this.groups() ?? [{ sections: this.sections() }]
  );

  protected readonly allTabs = computed<SectionDescriptor[]>(() => this.effectiveGroups().flatMap((g) => g.sections));

  protected readonly activeLabel = computed(() => this.allTabs().find((t) => t.id === this.activeId())?.label ?? '');
  private readonly activeIndex = computed(() => this.allTabs().findIndex((t) => t.id === this.activeId()));
  protected readonly isFirst = computed(() => this.activeIndex() <= 0);
  protected readonly isLast = computed(() => this.activeIndex() >= this.allTabs().length - 1);
  protected readonly stepperVisible = computed(() => this.showStepper() && !this.showAll());

  private storageKey = '';

  ngOnInit(): void {
    // Remember the show-all choice per route.
    this.storageKey = `console-section-tabs:showAll:${this.router.url.split('#')[0]}`;
    const saved = this.readSavedShowAll();
    if (saved !== null) this.showAll.set(saved);

    // Deep-link: `/route#section-id` opens that tab; reactive so back/forward works.
    this.route.fragment.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((frag) => {
      if (frag && this.allTabs().some((t) => t.id === frag)) this.activeId.set(frag);
    });
    // Default to the first tab when the consumer supplied no initial id / fragment.
    if (!this.activeId()) {
      const first = this.allTabs()[0]?.id;
      if (first) this.activeId.set(first);
    }
  }

  protected select(id: string): void {
    this.activeId.set(id);
    this.router.navigate([], { relativeTo: this.route, fragment: id, replaceUrl: true });
    // In stacked mode the section is already on screen — scroll it into view.
    if (this.showAll()) {
      this.document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  protected toggleShowAll(): void {
    const next = !this.showAll();
    this.showAll.set(next);
    this.saveShowAll(next);
  }

  protected next(): void {
    const tabs = this.allTabs();
    const i = this.activeIndex();
    if (i < tabs.length - 1) this.select(tabs[i + 1].id);
  }

  protected prev(): void {
    const tabs = this.allTabs();
    const i = this.activeIndex();
    if (i > 0) this.select(tabs[i - 1].id);
  }

  protected resolveStatus(section: SectionDescriptor): SectionStatus | null {
    return section.status ? section.status() : null;
  }

  protected statusIcon(status: SectionStatus): string {
    return STATUS_ICONS[status] ?? '○';
  }

  private readSavedShowAll(): boolean | null {
    try {
      const v = this.document.defaultView?.localStorage.getItem(this.storageKey);
      return v === null || v === undefined ? null : v === 'true';
    } catch {
      return null;
    }
  }

  private saveShowAll(value: boolean): void {
    try {
      this.document.defaultView?.localStorage.setItem(this.storageKey, String(value));
    } catch {
      // ignore storage failures (private mode, quota)
    }
  }
}
