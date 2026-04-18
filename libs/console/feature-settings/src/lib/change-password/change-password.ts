import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs';
import { AuthStore } from '@portfolio/console/shared/data-access';
import {
  ErrorDataService,
  FormErrorPipe,
  passwordsMatchValidator,
  ServerErrorDirective,
} from '@portfolio/console/shared/util';
import { ToastService } from '@portfolio/console/shared/ui';

@Component({
  selector: 'console-change-password',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    ServerErrorDirective,
    FormErrorPipe,
  ],
  templateUrl: './change-password.html',
  styleUrl: './change-password.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ChangePasswordComponent {
  private readonly authStore = inject(AuthStore);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly errorDataService = inject(ErrorDataService);

  readonly submitting = signal(false);
  readonly showCurrentPassword = signal(false);
  readonly showNewPassword = signal(false);
  readonly showConfirmPassword = signal(false);

  readonly form = new FormGroup(
    {
      currentPassword: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      newPassword: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(8)],
      }),
      confirmPassword: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    },
    { validators: [passwordsMatchValidator('newPassword', 'confirmPassword')] }
  );

  toggleCurrentPassword(): void {
    this.showCurrentPassword.update((v) => !v);
  }

  toggleNewPassword(): void {
    this.showNewPassword.update((v) => !v);
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword.update((v) => !v);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorDataService.clear();
    const { currentPassword, newPassword } = this.form.getRawValue();

    this.authStore
      .changePassword(currentPassword, newPassword)
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          this.toast.success('Password changed successfully');
          this.router.navigateByUrl('/');
        },
        error: () => {
          // Known errors handled by global handler (toast) + directive (validation)
        },
      });
  }
}
