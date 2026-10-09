import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, concatMap, debounceTime, defer, EMPTY, Subject, tap } from 'rxjs';

import { BackLink, Button, EmptyState, Icon, LandingMetaService, Tooltip } from '@portfolio/landing/shared/ui';
import type {
  ChecklistDocContent,
  ChecklistRunBody,
  ChecklistRunDetail as RunDetail,
  ChecklistSectionedContent,
} from '@portfolio/shared/types';

import { ChecklistBoard } from '../checklist.board/checklist.board';
import { CHECKLIST_LOOKUP_SLUG, CHECKLIST_SAVE_STATES } from '../checklist.constants';
import { ChecklistService } from '../checklist.service';
import type { ChecklistSaveState } from '../checklist.types';

/**
 * A run (`/checklist/:id`): the board on the run's body, saved as it changes. Saves wait for a
 * short pause in the edits and go one at a time, each carrying the version the last one returned.
 * A 409 means another tab or device saved first: saving stops and the page offers a reload rather
 * than overwrite that work.
 */
@Component({
  selector: 'landing-checklist-run-detail',
  imports: [RouterLink, BackLink, Button, EmptyState, Icon, Tooltip, ChecklistBoard],
  templateUrl: './checklist-run.detail.html',
  styleUrl: './checklist-run.detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(window:beforeunload)': 'onBeforeUnload($event)' },
})
export default class ChecklistRunDetail {
  private static readonly SAVE_DELAY_MS = 800;

  private readonly api = inject(ChecklistService);
  private readonly meta = inject(LandingMetaService);
  private readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';

  protected readonly run = signal<RunDetail | null>(null);
  protected readonly body = signal<ChecklistRunBody | null>(null);
  protected readonly notFound = signal(false);
  protected readonly loadFailed = signal(false);
  protected readonly saveState = signal<ChecklistSaveState>('saved');
  /** The save state as an icon in the lead, its words in the tooltip and for screen readers. */
  protected readonly saveInfo = computed(() => CHECKLIST_SAVE_STATES[this.saveState()]);
  protected readonly lookup = signal<ChecklistSectionedContent | null>(null);
  protected readonly project = signal<ChecklistSectionedContent | null>(null);

  /** The version the server holds for what this page last saved. */
  private version = 0;
  /** The newest body not yet saved, or null when everything is saved. */
  private unsaved: ChecklistRunBody | null = null;
  private readonly edits = new Subject<ChecklistRunBody>();

  constructor() {
    // Not cut off when the page goes: a save on its way finishes, and what is still waiting follows it.
    this.edits
      .pipe(
        debounceTime(ChecklistRunDetail.SAVE_DELAY_MS),
        concatMap((body) => this.save(body))
      )
      .subscribe();
    // Leaving the run: closing the queue sends the edit waiting out its pause at once (debounceTime
    // flushes on complete), queued behind any save still on its way so it carries that save's version.
    // A failed edit goes back in first, so leaving retries it once.
    inject(DestroyRef).onDestroy(() => {
      if (this.unsaved && this.saveState() === 'failed') this.edits.next(this.unsaved);
      this.edits.complete();
    });
    this.load();
    this.api.getDoc('LOOKUP', CHECKLIST_LOOKUP_SLUG).subscribe({
      next: (doc) => this.lookup.set(ChecklistRunDetail.sectioned(doc.content)),
      error: () => undefined,
    });
  }

  /** Every board change: shown at once, saved after the pause. Nothing is saved after a conflict. */
  protected onBodyChange(body: ChecklistRunBody): void {
    this.body.set(body);
    if (this.saveState() === 'conflict') return;
    this.unsaved = body;
    this.saveState.set('pending');
    this.edits.next(body);
  }

  protected retry(): void {
    if (this.unsaved) this.edits.next(this.unsaved);
  }

  /** After a conflict: the run as the server has it now; edits made here since are dropped. */
  protected reload(): void {
    this.unsaved = null;
    this.load();
  }

  protected onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.unsaved && this.saveState() !== 'conflict') event.preventDefault();
  }

  private load(): void {
    this.api.getRun(this.id).subscribe({
      next: (run) => {
        this.run.set(run);
        this.body.set(run.body);
        this.version = run.version;
        this.saveState.set('saved');
        this.meta.apply({ title: run.name, noindex: true });
        this.api.getDoc('PROJECT', run.projectSlug).subscribe({
          next: (doc) => this.project.set(ChecklistRunDetail.sectioned(doc.content)),
          error: () => undefined,
        });
      },
      error: (error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 404) this.notFound.set(true);
        else this.loadFailed.set(true);
      },
    });
  }

  private save(body: ChecklistRunBody) {
    return defer(() => {
      if (this.saveState() === 'conflict') return EMPTY;
      this.saveState.set('saving');
      return this.api.saveBody(this.id, this.version, body).pipe(
        tap(({ version }) => {
          this.version = version;
          // A newer edit may have come in while this one was on its way; it is queued behind.
          if (this.unsaved === body) {
            this.unsaved = null;
            this.saveState.set('saved');
          } else {
            this.saveState.set('pending');
          }
        }),
        catchError((error: unknown) => {
          const conflict = error instanceof HttpErrorResponse && error.status === 409;
          this.saveState.set(conflict ? 'conflict' : 'failed');
          return EMPTY;
        })
      );
    });
  }

  /** A lookup table or project profile; a template's content has no sections. */
  private static sectioned(content: ChecklistDocContent): ChecklistSectionedContent | null {
    return 'sections' in content ? content : null;
  }
}
