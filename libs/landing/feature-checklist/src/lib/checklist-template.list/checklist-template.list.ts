import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { BackLink, Button, Container, EmptyState, Icon, LandingMetaService } from '@portfolio/landing/shared/ui';
import type { ChecklistDocSummary } from '@portfolio/shared/types';

import { ChecklistService } from '../checklist.service';

/**
 * Templates (`/checklist/templates`): the live templates a new run can start from, each opening a
 * read-only view. Nothing is edited here; the files live in the ctx plugin repo. The list refreshes
 * itself every 10 minutes; "Update checklist" reads the repo now and shows why when it cannot.
 */
@Component({
  selector: 'landing-checklist-template-list',
  imports: [DatePipe, RouterLink, BackLink, Button, Container, EmptyState, Icon],
  templateUrl: './checklist-template.list.html',
  styleUrl: './checklist-template.list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ChecklistTemplateList {
  private readonly api = inject(ChecklistService);

  /** Null until the first load answers. */
  private readonly templates = signal<ChecklistDocSummary[] | null>(null);
  protected readonly loadFailed = signal(false);
  /** By title, so a size is found where its name says. */
  protected readonly sorted = computed(() => {
    const all = this.templates();
    return all ? [...all].sort((a, b) => a.title.localeCompare(b.title)) : null;
  });

  protected readonly refreshing = signal(false);
  /** What the last "Update checklist" did, or why it failed. */
  protected readonly refreshNote = signal<{ ok: boolean; text: string } | null>(null);

  constructor() {
    inject(LandingMetaService).apply({ title: 'Templates', noindex: true });
    this.load();
  }

  protected refresh(): void {
    this.refreshing.set(true);
    this.refreshNote.set(null);
    this.api.refreshDocs().subscribe({
      next: ({ created, updated, archived }) => {
        const changed = created.length + updated.length + archived.length;
        this.refreshNote.set({ ok: true, text: changed ? `Updated ${changed} file(s).` : 'Already up to date.' });
        this.refreshing.set(false);
        this.load();
      },
      error: (error: unknown) => {
        const reason = error instanceof HttpErrorResponse ? error.error?.message : null;
        this.refreshNote.set({
          ok: false,
          text: `Not updated: ${reason || 'the repo could not be read'}. The current copy stays.`,
        });
        this.refreshing.set(false);
      },
    });
  }

  private load(): void {
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
