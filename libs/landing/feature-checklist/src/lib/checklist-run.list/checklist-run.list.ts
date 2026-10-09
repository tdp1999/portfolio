import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import type { Observable } from 'rxjs';

import { Button, Container, EmptyState, LandingMetaService, Link } from '@portfolio/landing/shared/ui';
import type { ChecklistDocSummary, ChecklistRunStatus, ChecklistRunSummary } from '@portfolio/shared/types';

import { ChecklistRunCreateDialog } from '../checklist-run.create-dialog/checklist-run.create-dialog';
import { ChecklistRunRow } from '../checklist-run.row/checklist-run.row';
import { ChecklistService } from '../checklist.service';
import type { CreateChecklistRunInput } from '../checklist.types';

/**
 * Runs list (`/checklist`): active runs first, done and archived ones behind a toggle, and the "New
 * run" dialog that creates a run from a live template and a project.
 */
@Component({
  selector: 'landing-checklist-run-list',
  imports: [Button, Container, EmptyState, Link, ChecklistRunCreateDialog, ChecklistRunRow],
  templateUrl: './checklist-run.list.html',
  styleUrl: './checklist-run.list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ChecklistRunList {
  private readonly api = inject(ChecklistService);
  private readonly router = inject(Router);

  /** Null until the first load answers. */
  protected readonly runs = signal<ChecklistRunSummary[] | null>(null);
  protected readonly loadFailed = signal(false);
  protected readonly templates = signal<ChecklistDocSummary[]>([]);
  protected readonly projects = signal<ChecklistDocSummary[]>([]);

  protected readonly formOpen = signal(false);
  protected readonly creating = signal(false);
  protected readonly createError = signal<string | null>(null);

  protected readonly showClosed = signal(false);
  /** The run an action is running on, so only its buttons wait. */
  protected readonly busyId = signal<string | null>(null);
  protected readonly actionError = signal<string | null>(null);

  /** The API sends most recently updated first; that order is kept inside each group. */
  protected readonly active = computed(() => (this.runs() ?? []).filter((run) => run.status === 'ACTIVE'));
  protected readonly closed = computed(() => (this.runs() ?? []).filter((run) => run.status !== 'ACTIVE'));

  constructor() {
    inject(LandingMetaService).apply({ title: 'Checklist', noindex: true });
    this.api.listRuns().subscribe({
      next: (runs) => this.runs.set(runs),
      error: () => {
        this.runs.set([]);
        this.loadFailed.set(true);
      },
    });
    // Live docs only, so an archived template is never offered (CHK-002).
    this.api.listDocs('TEMPLATE').subscribe({ next: (docs) => this.templates.set(docs), error: () => undefined });
    this.api.listDocs('PROJECT').subscribe({ next: (docs) => this.projects.set(docs), error: () => undefined });
  }

  protected openForm(): void {
    this.createError.set(null);
    this.formOpen.set(true);
  }

  protected create(input: CreateChecklistRunInput): void {
    this.creating.set(true);
    this.createError.set(null);
    this.api.createRun(input).subscribe({
      next: ({ id }) => void this.router.navigate(['/checklist', id]),
      error: () => {
        this.creating.set(false);
        this.createError.set('Could not create the run. Check the template and project still exist, then try again.');
      },
    });
  }

  protected rename(run: ChecklistRunSummary, name: string): void {
    this.act(run, this.api.updateRun(run.id, { name }), { name });
  }

  protected setStatus(run: ChecklistRunSummary, status: ChecklistRunStatus): void {
    this.act(run, this.api.updateRun(run.id, { status }), { status });
  }

  protected remove(run: ChecklistRunSummary): void {
    this.busyId.set(run.id);
    this.actionError.set(null);
    this.api.deleteRun(run.id).subscribe({
      next: () => {
        this.runs.update((runs) => (runs ?? []).filter((r) => r.id !== run.id));
        this.busyId.set(null);
      },
      error: () => this.fail(),
    });
  }

  /** Apply a patch locally once the API took it; a run touched now moves to the top of its group. */
  private act(run: ChecklistRunSummary, request: Observable<unknown>, patch: Partial<ChecklistRunSummary>): void {
    this.busyId.set(run.id);
    this.actionError.set(null);
    request.subscribe({
      next: () => {
        const updated = { ...run, ...patch, updatedAt: new Date().toISOString() };
        this.runs.update((runs) => [updated, ...(runs ?? []).filter((r) => r.id !== run.id)]);
        this.busyId.set(null);
      },
      error: () => this.fail(),
    });
  }

  private fail(): void {
    this.busyId.set(null);
    this.actionError.set('That change did not save. Reload the page and try again.');
  }
}
