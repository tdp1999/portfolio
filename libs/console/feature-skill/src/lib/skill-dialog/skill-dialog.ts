import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { extractApiError, FormErrorPipe } from '@portfolio/console/shared/util';
import { AdminSkill, SkillService } from '../skill.service';

export interface SkillDialogData {
  skill?: AdminSkill;
  parentSkills: AdminSkill[];
}

@Component({
  selector: 'console-skill-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatCheckboxModule,
    FormErrorPipe,
  ],
  template: `
    <h2 mat-dialog-title>{{ isEdit ? 'Edit Skill' : 'Create Skill' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="flex flex-col gap-4">
        <mat-form-field>
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" placeholder="e.g. TypeScript" />
          <mat-error>{{ form.controls.name | formError }}</mat-error>
        </mat-form-field>

        <mat-form-field>
          <mat-label>Category</mat-label>
          <mat-select formControlName="category">
            <mat-option value="TECHNICAL">Technical</mat-option>
            <mat-option value="TOOLS">Tools</mat-option>
            <mat-option value="ADDITIONAL">Additional</mat-option>
          </mat-select>
          <mat-error>{{ form.controls.category | formError }}</mat-error>
        </mat-form-field>

        <mat-form-field>
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" placeholder="Optional description" rows="3"></textarea>
          <mat-error>{{ form.controls.description | formError }}</mat-error>
        </mat-form-field>

        <mat-form-field>
          <mat-label>Parent Skill</mat-label>
          <mat-select formControlName="parentSkillId">
            <mat-option [value]="null">None</mat-option>
            @for (parent of data?.parentSkills ?? []; track parent.id) {
              <mat-option [value]="parent.id">{{ parent.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <div class="flex gap-4">
          <mat-checkbox formControlName="isLibrary">Library / Framework</mat-checkbox>
          <mat-checkbox formControlName="isFeatured">Featured</mat-checkbox>
        </div>

        <div class="flex gap-4">
          <mat-form-field class="flex-1">
            <mat-label>Years of Experience</mat-label>
            <input matInput type="number" formControlName="yearsOfExperience" placeholder="Optional" />
          </mat-form-field>

          <mat-form-field class="flex-1">
            <mat-label>Display Order</mat-label>
            <input matInput type="number" formControlName="displayOrder" placeholder="0" />
          </mat-form-field>
        </div>

        <mat-form-field>
          <mat-label>Icon URL</mat-label>
          <input matInput formControlName="iconUrl" placeholder="https://..." />
        </mat-form-field>

        <mat-form-field>
          <mat-label>Proficiency Note</mat-label>
          <input matInput formControlName="proficiencyNote" placeholder="e.g. TOEIC 970" />
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
export default class SkillDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<SkillDialogComponent>);
  private readonly skillService = inject(SkillService);
  private readonly fb = inject(FormBuilder);
  readonly data = inject<SkillDialogData>(MAT_DIALOG_DATA, { optional: true });

  readonly isEdit = !!this.data?.skill;
  readonly form = this.fb.nonNullable.group({
    name: [this.data?.skill?.name ?? '', [Validators.required, Validators.maxLength(100)]],
    category: [this.data?.skill?.category ?? '', [Validators.required]],
    description: [this.data?.skill?.description ?? '', [Validators.maxLength(1000)]],
    parentSkillId: [this.data?.skill?.parentSkillId ?? (null as string | null)],
    isLibrary: [this.data?.skill?.isLibrary ?? false],
    isFeatured: [this.data?.skill?.isFeatured ?? false],
    yearsOfExperience: [this.data?.skill?.yearsOfExperience ?? (null as number | null)],
    displayOrder: [this.data?.skill?.displayOrder ?? 0],
    iconUrl: [this.data?.skill?.iconUrl ?? ''],
    proficiencyNote: [this.data?.skill?.proficiencyNote ?? ''],
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
    const raw = this.form.getRawValue();

    const onError = (err: HttpErrorResponse) => {
      this.submitting.set(false);
      const apiError = extractApiError(err);
      this.serverError.set(apiError?.message ?? 'Failed to save skill');
    };

    const editSkill = this.data?.skill;
    if (this.isEdit && editSkill) {
      this.skillService
        .update(editSkill.id, {
          name: raw.name,
          category: raw.category,
          description: raw.description || null,
          parentSkillId: raw.parentSkillId || null,
          isLibrary: raw.isLibrary,
          isFeatured: raw.isFeatured,
          yearsOfExperience: raw.yearsOfExperience ?? null,
          displayOrder: raw.displayOrder,
          iconUrl: raw.iconUrl || null,
          proficiencyNote: raw.proficiencyNote || null,
        })
        .subscribe({
          next: () => this.dialogRef.close(true),
          error: onError,
        });
    } else {
      this.skillService
        .create({
          name: raw.name,
          category: raw.category,
          description: raw.description || undefined,
          parentSkillId: raw.parentSkillId || undefined,
          isLibrary: raw.isLibrary,
          isFeatured: raw.isFeatured,
          yearsOfExperience: raw.yearsOfExperience ?? undefined,
          displayOrder: raw.displayOrder,
          iconUrl: raw.iconUrl || undefined,
          proficiencyNote: raw.proficiencyNote || undefined,
        })
        .subscribe({
          next: () => this.dialogRef.close(true),
          error: onError,
        });
    }
  }
}
