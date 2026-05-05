import { ChangeDetectionStrategy, Component, computed, inject, input, linkedSignal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  ContainerComponent,
  EyebrowComponent,
  LandingHeadingComponent,
  LandingLinkComponent,
  SegmentedComponent,
  type SegmentOption,
} from '@portfolio/landing/shared/ui';
import { ProjectDataService, type ProjectDetail } from '@portfolio/landing/shared/data-access';
import type { Locale } from '@portfolio/shared/types';
import { HomeSelectedWorkTabComponent } from './home-selected-work-tab.component';
import { HomeSelectedWorkFallbackComponent } from './home-selected-work-fallback.component';

const MAX_TABS = 3;

@Component({
  selector: 'landing-home-selected-work',
  standalone: true,
  imports: [
    ContainerComponent,
    LandingHeadingComponent,
    LandingLinkComponent,
    SegmentedComponent,
    HomeSelectedWorkTabComponent,
    HomeSelectedWorkFallbackComponent,
  ],
  templateUrl: './home-selected-work.component.html',
  styleUrl: './home-selected-work.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeSelectedWorkComponent {
  readonly locale = input<Locale>('en');

  private readonly projectService = inject(ProjectDataService);

  protected readonly projects = toSignal(this.projectService.getFeatured(), {
    initialValue: [] as ProjectDetail[],
  });

  /** Server returns featured projects ordered by `displayOrder asc`; we just cap at MAX_TABS. */
  protected readonly tabs = computed<readonly ProjectDetail[]>(() => this.projects().slice(0, MAX_TABS));

  protected readonly segments = computed<readonly SegmentOption[]>(() =>
    this.tabs().map((p) => ({ id: p.slug, label: p.title.toUpperCase() }))
  );

  protected readonly activeId = linkedSignal<string>(() => this.tabs()[0]?.slug ?? '');

  protected readonly activeProject = computed<ProjectDetail | null>(() => {
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
