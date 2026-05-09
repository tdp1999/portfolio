import { Component, inject, signal, computed, effect } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { toSignal } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';
import {
  ContainerComponent,
  SectionComponent,
  IconComponent,
  BadgeComponent,
  LandingBackLinkComponent,
  LandingEmptyStateComponent,
} from '@portfolio/landing/shared/ui';
import { ProjectDataService } from '@portfolio/landing/shared/data-access';
import { getLocalized } from '@portfolio/shared/utils';
import { TranslatablePipe } from '@portfolio/shared/ui/pipes';
import type { Locale } from '@portfolio/shared/types';

function formatMonth(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function formatDateRange(startDate: string, endDate: string | null): string {
  const start = formatMonth(startDate);
  const end = endDate ? formatMonth(endDate) : 'Present';
  return `${start} — ${end}`;
}

@Component({
  selector: 'landing-project-detail',
  imports: [
    RouterLink,
    ContainerComponent,
    SectionComponent,
    IconComponent,
    BadgeComponent,
    TranslatablePipe,
    LandingBackLinkComponent,
    LandingEmptyStateComponent,
  ],
  templateUrl: './project-detail.html',
  styleUrl: './project-detail.scss',
})
export class ProjectDetailComponent {
  private route = inject(ActivatedRoute);
  private projectService = inject(ProjectDataService);
  private titleService = inject(Title);
  private meta = inject(Meta);

  locale = signal<Locale>('en');

  private project$ = this.route.paramMap.pipe(
    switchMap((params) => this.projectService.getBySlug(params.get('slug') ?? ''))
  );

  project = toSignal(this.project$, { initialValue: null });

  dateRange = computed(() => {
    const p = this.project();
    return p ? formatDateRange(p.startDate, p.endDate) : '';
  });

  constructor() {
    effect(() => {
      const p = this.project();
      if (p) {
        this.titleService.setTitle(`${p.title} | Phuong Tran`);
        this.meta.updateTag({
          name: 'description',
          content: getLocalized(p.oneLiner, this.locale()),
        });
        if (p.thumbnailUrl) {
          this.meta.updateTag({ property: 'og:image', content: p.thumbnailUrl });
        }
      }
    });
  }

  sourceUrl = computed(() => this.project()?.links?.find((l) => l.type === 'repo')?.url ?? null);
  projectUrl = computed(() => this.project()?.links?.find((l) => l.type === 'demo')?.url ?? null);
}
