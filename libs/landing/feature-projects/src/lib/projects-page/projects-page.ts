import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  ContainerComponent,
  SectionComponent,
  IconComponent,
  ChipComponent,
  LandingBackLinkComponent,
  LandingEmptyStateComponent,
} from '@portfolio/landing/shared/ui';
import { ProjectDataService } from '@portfolio/landing/shared/data-access';
import { MonthYearPipe, TranslatablePipe } from '@portfolio/shared/ui/pipes';
import type { Locale } from '@portfolio/shared/types';

@Component({
  selector: 'landing-projects-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    ContainerComponent,
    SectionComponent,
    IconComponent,
    ChipComponent,
    LandingBackLinkComponent,
    LandingEmptyStateComponent,
    MonthYearPipe,
    TranslatablePipe,
  ],
  templateUrl: './projects-page.html',
  styleUrl: './projects-page.scss',
})
export class ProjectsPage {
  private projectService = inject(ProjectDataService);
  private title = inject(Title);
  private meta = inject(Meta);

  constructor() {
    this.title.setTitle('Projects | Phuong Tran');
    this.meta.updateTag({
      name: 'description',
      content: 'Side projects and open-source work by Phuong Tran — design, code, and technical highlights.',
    });
  }

  locale = signal<Locale>('en');
  projects = toSignal(this.projectService.getPublicProjects(), { initialValue: [] });
}
