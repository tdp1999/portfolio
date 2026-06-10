import { ChangeDetectionStrategy, Component, computed, inject, input, linkedSignal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  Container,
  EmphasisText,
  Link,
  SectionHeader,
  Segmented,
  type SegmentOption,
} from '@portfolio/landing/shared/ui';
import { ProjectDataService, type ProjectDetailData } from '@portfolio/landing/shared/data-access';
import type { Locale } from '@portfolio/shared/types';
import { HomeSelectedWorkTab } from './home.selected-work-tab';
import { HomeSelectedWorkFallback } from './home.selected-work-fallback';
import { MAX_TABS } from './home.selected-work.data';

@Component({
  selector: 'landing-home-selected-work',
  standalone: true,
  imports: [Container, EmphasisText, Link, SectionHeader, Segmented, HomeSelectedWorkTab, HomeSelectedWorkFallback],
  templateUrl: './home.selected-work.html',
  styleUrl: './home.selected-work.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeSelectedWork {
  readonly locale = input<Locale>('en');
  /**
   * Owner-authored §4 intro (TranslatableJson markdown). Split at the first
   * sentence boundary: lead sentence → heading, remainder → deck. Empty string
   * (profile not loaded) hides both lines.
   */
  readonly intro = input<string>('');

  private readonly projectService = inject(ProjectDataService);

  private readonly introSplit = computed<readonly [string, string]>(() => {
    const raw = this.intro().trim();
    if (!raw) return ['', ''];
    const match = raw.match(/^([\s\S]+?[.!?])\s+([\s\S]+)$/);
    if (match) return [match[1].trim(), match[2].replace(/\s+/g, ' ').trim()];
    return [raw, ''];
  });

  protected readonly introHeading = computed(() => this.introSplit()[0]);
  protected readonly introDeck = computed(() => this.introSplit()[1]);

  protected readonly projects = toSignal(this.projectService.getFeatured(), {
    initialValue: [] as ProjectDetailData[],
  });

  /** Server returns featured projects ordered by `displayOrder asc`; we just cap at MAX_TABS. */
  protected readonly tabs = computed<readonly ProjectDetailData[]>(() => this.projects().slice(0, MAX_TABS));

  protected readonly segments = computed<readonly SegmentOption[]>(() =>
    this.tabs().map((p) => ({ id: p.slug, label: p.title.toUpperCase() }))
  );

  protected readonly activeId = linkedSignal<string>(() => this.tabs()[0]?.slug ?? '');

  protected readonly activeProject = computed<ProjectDetailData | null>(() => {
    const list = this.tabs();
    if (list.length === 0) return null;
    return list.find((p) => p.slug === this.activeId()) ?? list[0] ?? null;
  });

  /**
   * Fallback only when the project has zero imagery. Any image at all → render
   * the gallery and let empty cells show hairline placeholders. (Earlier rule
   * `< 4` hid real screenshots when fewer than 4 existed.)
   */
  protected readonly useFallback = computed(() => {
    const p = this.activeProject();
    return !p || (p.images?.length ?? 0) === 0;
  });
}
