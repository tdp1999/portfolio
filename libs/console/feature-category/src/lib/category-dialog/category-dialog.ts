import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { extractApiError, FormErrorPipe } from '@portfolio/console/shared/util';
import { AdminCategory, CategoryService } from '../category.service';

export interface CategoryDialogData {
  category?: AdminCategory;
}

@Component({
  selector: 'console-category-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    FormErrorPipe,
  ],
  template: `
    <h2 mat-dialog-title>{{ isEdit ? 'Edit Category' : 'Create Category' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="flex flex-col gap-4">
        <mat-form-field>
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" placeholder="e.g. Frontend" />
          <mat-error>{{ form.controls.name | formError }}</mat-error>
        </mat-form-field>

        <mat-form-field>
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" placeholder="Optional description" rows="3"></textarea>
          <mat-error>{{ form.controls.description | formError }}</mat-error>
        </mat-form-field>

        <mat-form-field>
          <mat-label>Display Order</mat-label>
          <input matInput type="number" formControlName="displayOrder" placeholder="0" />
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
export default class CategoryDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<CategoryDialogComponent>);
  private readonly categoryService = inject(CategoryService);
  private readonly fb = inject(FormBuilder);
  private readonly data = inject<CategoryDialogData>(MAT_DIALOG_DATA, { optional: true });

  readonly isEdit = !!this.data?.category;
  readonly form = this.fb.nonNullable.group({
    name: [this.data?.category?.name ?? '', [Validators.required, Validators.maxLength(100)]],
    description: [this.data?.category?.description ?? '', [Validators.maxLength(500)]],
    displayOrder: [this.data?.category?.displayOrder ?? 0],
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
    const { name, description, displayOrder } = this.form.getRawValue();

    const onError = (err: HttpErrorResponse) => {
      this.submitting.set(false);
      const apiError = extractApiError(err);
      this.serverError.set(apiError?.message ?? 'Failed to save category');
    };

    const editCategory = this.data?.category;
    if (this.isEdit && editCategory) {
      this.categoryService
        .update(editCategory.id, {
          name,
          description: description || null,
          displayOrder,
        })
        .subscribe({
          next: () => this.dialogRef.close(true),
          error: onError,
        });
    } else {
      this.categoryService
        .create({
          name,
          description: description || undefined,
          displayOrder,
        })
        .subscribe({
          next: () => this.dialogRef.close(true),
          error: onError,
        });
    }
  }
}
