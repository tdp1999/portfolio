import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { BackLink, Container, EmptyState, Icon, LandingMetaService } from '@portfolio/landing/shared/ui';
import type { ChecklistDocSummary } from '@portfolio/shared/types';

import { ChecklistService } from '../checklist.service';

/**
 * Templates (`/checklist/templates`): the live templates a new run can start from, each opening a
 * read-only view. Nothing is edited here; the files live in the workflow repo and arrive by push.
 */
@Component({
  selector: 'landing-checklist-template-list',
  imports: [DatePipe, RouterLink, BackLink, Container, EmptyState, Icon],
  templateUrl: './checklist-template.list.html',
  styleUrl: './checklist-template.list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ChecklistTemplateList {
  private readonly api = inject(ChecklistService);

  /** Null until the first load answers. */
  private readonly templates = signal<ChecklistDocSummary[] | null>(null);
  protected readonly loadFailed = signal(false);
  /** By title, so a lane is found where its name says. */
  protected readonly sorted = computed(() => {
    const all = this.templates();
    return all ? [...all].sort((a, b) => a.title.localeCompare(b.title)) : null;
  });

  constructor() {
    inject(LandingMetaService).apply({ title: 'Templates', noindex: true });
    // Live docs only: an archived template cannot start a run (CHK-002), so it is not listed.
    this.api.listDocs('TEMPLATE').subscribe({
      next: (docs) => this.templates.set(docs),
      error: () => {
        this.templates.set([]);
        this.loadFailed.set(true);
      },
    });
  }
}
