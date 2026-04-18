import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { extractApiError, FormErrorPipe } from '@portfolio/console/shared/util';
import { AdminUserService } from '../admin-user.service';

@Component({
  selector: 'console-invite-dialog',
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
    <h2 mat-dialog-title>Invite User</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="flex flex-col gap-4">
        <mat-form-field>
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" />
          <mat-error>{{ form.controls.name | formError }}</mat-error>
        </mat-form-field>

        <mat-form-field>
          <mat-label>Email</mat-label>
          <input matInput formControlName="email" type="email" />
          <mat-error>{{ form.controls.email | formError }}</mat-error>
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
          Invite
        }
      </button>
    </mat-dialog-actions>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class InviteDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<InviteDialogComponent>);
  private readonly adminUserService = inject(AdminUserService);
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
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

    const { name, email } = this.form.getRawValue();
    this.adminUserService.invite({ name, email }).subscribe({
      next: () => this.dialogRef.close(true),
      error: (err) => {
        this.submitting.set(false);
        const apiError = extractApiError(err);
        this.serverError.set(apiError?.message ?? 'Failed to invite user');
      },
    });
  }
}
