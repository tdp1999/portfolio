import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { BackLink, EmptyState, Icon, LandingMetaService } from '@portfolio/landing/shared/ui';
import type { ChecklistDocDetail, ChecklistSectionedContent, ChecklistTemplateContent } from '@portfolio/shared/types';

import { ChecklistBoard } from '../checklist.board/checklist.board';
import { CHECKLIST_LOOKUP_SLUG } from '../checklist.constants';
import { ChecklistService } from '../checklist.service';

/**
 * A template, read only (`/checklist/templates/:slug`): the run board in `viewOnly`, so it reads
 * like the run it would start, without progress, ticks or edits. Lookup refs open; project refs say
 * which project they wait for, as a template has none yet.
 */
@Component({
  selector: 'landing-checklist-template-detail',
  imports: [BackLink, EmptyState, Icon, ChecklistBoard],
  templateUrl: './checklist-template.detail.html',
  styleUrl: './checklist-template.detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ChecklistTemplateDetail {
  private readonly api = inject(ChecklistService);
  protected readonly slug = inject(ActivatedRoute).snapshot.paramMap.get('slug') ?? '';

  protected readonly doc = signal<ChecklistDocDetail | null>(null);
  protected readonly notFound = signal(false);
  protected readonly loadFailed = signal(false);
  protected readonly lookup = signal<ChecklistSectionedContent | null>(null);
  /** The template's phases, or null for a doc that is not a template. */
  protected readonly content = computed(() => {
    const content = this.doc()?.content;
    return content && 'phases' in content ? (content as ChecklistTemplateContent) : null;
  });

  constructor() {
    const meta = inject(LandingMetaService);
    this.api.getDoc('TEMPLATE', this.slug).subscribe({
      next: (doc) => {
        this.doc.set(doc);
        if (!('phases' in doc.content)) this.notFound.set(true);
        meta.apply({ title: doc.title, noindex: true });
      },
      error: (error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 404) this.notFound.set(true);
        else this.loadFailed.set(true);
      },
    });
    this.api.getDoc('LOOKUP', CHECKLIST_LOOKUP_SLUG).subscribe({
      next: (doc) => this.lookup.set('sections' in doc.content ? doc.content : null),
      error: () => undefined,
    });
  }
}
