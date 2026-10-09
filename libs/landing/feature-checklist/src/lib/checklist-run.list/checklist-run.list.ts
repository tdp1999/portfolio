import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of } from 'rxjs';

import { LandingMetaService } from '@portfolio/landing/shared/ui';
import type { ChecklistRunSummary } from '@portfolio/shared/types';

import { CHECKLIST_API_PREFIX } from '../checklist.constants';

/**
 * Runs list. A plain listing for now: it proves the signed-in calls work end to end. Task 433 turns
 * it into the real page (create run, status, progress).
 */
@Component({
  selector: 'landing-checklist-run-list',
  templateUrl: './checklist-run.list.html',
  styleUrl: './checklist-run.list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ChecklistRunList {
  private readonly http = inject(HttpClient);

  protected readonly runs = toSignal(
    this.http.get<ChecklistRunSummary[]>(`${CHECKLIST_API_PREFIX}/runs`).pipe(
      map((runs) => ({ runs, failed: false })),
      catchError(() => of({ runs: [] as ChecklistRunSummary[], failed: true }))
    )
  );

  constructor() {
    inject(LandingMetaService).apply({ title: 'Checklist', noindex: true });
  }
}
