import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { Button, Icon, Input, Tooltip } from '@portfolio/landing/shared/ui';
import type { ChecklistRunStatus, ChecklistRunSummary } from '@portfolio/shared/types';

import { ChecklistProgress } from '../checklist.progress/checklist.progress';

/**
 * One run in the runs list: its name (the link into the run), template and project, progress, last
 * update, and the Owner's actions. Rename edits in place; delete asks once before it emits.
 */
@Component({
  selector: 'landing-checklist-run-row',
  imports: [DatePipe, ReactiveFormsModule, RouterLink, Button, Icon, Input, Tooltip, ChecklistProgress],
  templateUrl: './checklist-run.row.html',
  styleUrl: './checklist-run.row.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'listitem' },
})
export class ChecklistRunRow {
  readonly run = input.required<ChecklistRunSummary>();
  /** An action on this run is in flight: its buttons wait. */
  readonly busy = input(false);

  readonly renamed = output<string>();
  readonly statusChange = output<ChecklistRunStatus>();
  readonly deleted = output<void>();

  protected readonly editing = signal(false);
  protected readonly confirming = signal(false);
  protected readonly name = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.pattern(/\S/)],
  });
  /** The group gives the rename `<form>` its `ngSubmit` (no native submit, no page reload). */
  protected readonly renameForm = new FormGroup({ name: this.name });

  protected readonly done = computed(() => this.run().status === 'DONE');
  protected readonly archived = computed(() => this.run().status === 'ARCHIVED');

  protected startRename(): void {
    this.name.setValue(this.run().name);
    this.editing.set(true);
  }

  protected saveRename(): void {
    const next = this.name.value.trim();
    if (this.name.invalid) return;
    if (next !== this.run().name) this.renamed.emit(next);
    this.editing.set(false);
  }

  protected cancelRename(): void {
    this.editing.set(false);
  }
}
