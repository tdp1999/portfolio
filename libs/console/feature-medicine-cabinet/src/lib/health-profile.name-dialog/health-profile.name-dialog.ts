import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ToastService } from '@portfolio/console/shared/ui';
import {
  extractApiError,
  FormErrorPipe,
  resolveErrorMessage,
  ServerErrorDirective,
} from '@portfolio/console/shared/util';
import { HealthProfileErrorCode } from '@portfolio/shared/errors';
import { LIMITS } from '@portfolio/shared/validation';
import { map, Observable } from 'rxjs';
import { MedicineCabinetService } from '../medicine-cabinet.service';
import { fieldMessages, maxText, requiredText } from '../medicine-cabinet.validator';

export type HealthProfileNameDialogData = { mode: 'add' } | { mode: 'rename'; id: string; name: string };

/** The saved person, `'missing'` when the person was deleted elsewhere (R13.12), or nothing on Cancel. */
export type HealthProfileNameDialogResult = { id: string; name: string } | 'missing' | undefined;

/** 'S10 Hộp tên người': adds a person, or renames one. Opened from S2 and S4. */
@Component({
  selector: 'console-health-profile-name-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    FormErrorPipe,
    ServerErrorDirective,
  ],
  templateUrl: './health-profile.name-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class HealthProfileNameDialog {
  private readonly data = inject<HealthProfileNameDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef =
    inject<MatDialogRef<HealthProfileNameDialog, HealthProfileNameDialogResult>>(MatDialogRef);
  private readonly service = inject(MedicineCabinetService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  protected readonly isRename = this.data.mode === 'rename';
  protected readonly nameMessages = fieldMessages('Name');
  protected readonly submitting = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    name: [
      this.data.mode === 'rename' ? this.data.name : '',
      [requiredText(), maxText(LIMITS.HEALTH_PROFILE_NAME_MAX)],
    ],
  });

  protected cancel(): void {
    this.dialogRef.close(undefined);
  }

  protected submit(): void {
    if (this.submitting()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    const { name } = this.form.getRawValue();
    const data = this.data;
    const request: Observable<{ id: string }> =
      data.mode === 'rename'
        ? this.service.renameProfile(data.id, { name }).pipe(map(() => ({ id: data.id })))
        : this.service.createProfile({ name });

    request.subscribe({
      next: ({ id }) => {
        this.toast.success('Person saved');
        this.dialogRef.close({ id, name });
      },
      error: (err: HttpErrorResponse) => this.onError(err),
    });
  }

  private onError(err: HttpErrorResponse): void {
    this.submitting.set(false);
    const { errorCode } = extractApiError(err);
    if (err.status === 404) {
      this.toast.warning('This person no longer exists');
      this.dialogRef.close('missing');
      return;
    }
    if (errorCode === HealthProfileErrorCode.NAME_TAKEN) {
      const control = this.form.controls.name;
      control.setErrors({ server: resolveErrorMessage(errorCode) });
      control.markAsTouched();
    }
  }
}
