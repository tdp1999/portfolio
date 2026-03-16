import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { extractApiError } from '@portfolio/console/shared/data-access';
import { AdminTag, TagService } from '../tag.service';

export interface TagDialogData {
  tag?: AdminTag;
}

@Component({
  selector: 'console-tag-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ isEdit ? 'Edit Tag' : 'Create Tag' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="flex flex-col gap-4">
        <mat-form-field>
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" placeholder="e.g. TypeScript" />
          @if (form.controls.name.hasError('required')) {
            <mat-error>Name is required</mat-error>
          }
          @if (form.controls.name.hasError('maxlength')) {
            <mat-error>Name must be 50 characters or less</mat-error>
          }
        </mat-form-field>
        @if (serverError()) {
          <p class="text-sm text-red-500">{{ serverError() }}</p>
        }
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" [disabled]="submitting()" (click)="submit()">
        @if (submitting()) {
          <mat-spinner diameter="20" />
        } @else {
          {{ isEdit ? 'Update' : 'Create' }}
        }
      </button>
    </mat-dialog-actions>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TagDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<TagDialogComponent>);
  private readonly tagService = inject(TagService);
  private readonly fb = inject(FormBuilder);
  private readonly data = inject<TagDialogData>(MAT_DIALOG_DATA, { optional: true });

  readonly isEdit = !!this.data?.tag;
  readonly form = this.fb.nonNullable.group({
    name: [this.data?.tag?.name ?? '', [Validators.required, Validators.maxLength(50)]],
  });
  readonly submitting = signal(false);
  readonly serverError = signal('');

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.serverError.set('');
    const { name } = this.form.getRawValue();

    const onError = (err: HttpErrorResponse) => {
      this.submitting.set(false);
      const apiError = extractApiError(err);
      this.serverError.set(apiError?.message ?? 'Failed to save tag');
    };

    const editTag = this.data?.tag;
    if (this.isEdit && editTag) {
      this.tagService.update(editTag.id, { name }).subscribe({
        next: () => this.dialogRef.close(true),
        error: onError,
      });
    } else {
      this.tagService.create({ name }).subscribe({
        next: () => this.dialogRef.close(true),
        error: onError,
      });
    }
  }
}
