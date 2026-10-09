import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { Button, FormField, Input, Select, type SelectOption } from '@portfolio/landing/shared/ui';
import type { ChecklistDocSummary } from '@portfolio/shared/types';

import type { CreateChecklistRunInput } from '../checklist.types';

/**
 * Create a run: a name, a live template (CHK-002: the parent only passes non-archived ones) and the
 * project whose profile the run's `📁 §N` refs open. Nothing is sent while a field is empty.
 */
@Component({
  selector: 'landing-checklist-run-form',
  imports: [ReactiveFormsModule, Button, FormField, Input, Select],
  templateUrl: './checklist-run.form.html',
  styleUrl: './checklist-run.form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChecklistRunForm {
  readonly templates = input.required<readonly ChecklistDocSummary[]>();
  readonly projects = input.required<readonly ChecklistDocSummary[]>();
  readonly submitting = input(false);
  /** A failed create, shown under the form. */
  readonly error = input<string | null>(null);

  readonly submitted = output<CreateChecklistRunInput>();
  readonly cancelled = output<void>();

  /** Required and not blank: a name of spaces would pass `required` and fail the API's trim. */
  private static readonly filled = [Validators.required, Validators.pattern(/\S/)];

  protected readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: ChecklistRunForm.filled }),
    templateSlug: new FormControl('', { nonNullable: true, validators: ChecklistRunForm.filled }),
    projectSlug: new FormControl('', { nonNullable: true, validators: ChecklistRunForm.filled }),
  });

  protected readonly templateOptions = computed<SelectOption[]>(() =>
    this.templates().map((doc) => ({ value: doc.slug, label: doc.title }))
  );
  protected readonly projectOptions = computed<SelectOption[]>(() =>
    this.projects().map((doc) => ({ value: doc.slug, label: doc.title }))
  );

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { name, templateSlug, projectSlug } = this.form.getRawValue();
    this.submitted.emit({ name: name.trim(), templateSlug, projectSlug });
  }
}
