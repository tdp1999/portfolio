import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { toSignal } from '@angular/core/rxjs-interop';
import { ContainerComponent, SectionComponent, IconComponent, BadgeComponent } from '@portfolio/landing/shared/ui';
import { ProjectDataService } from '@portfolio/landing/shared/data-access';
import { getLocalized } from '@portfolio/shared/utils';
import type { Locale } from '@portfolio/shared/types';
import type { ProjectListItem } from '@portfolio/landing/shared/data-access';

function formatMonth(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

@Component({
  selector: 'landing-projects-page',
  imports: [RouterLink, ContainerComponent, SectionComponent, IconComponent, BadgeComponent],
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

  getOneLiner(project: ProjectListItem): string {
    return getLocalized(project.oneLiner, this.locale());
  }

  formatDate(dateStr: string): string {
    return formatMonth(dateStr);
  }
}
