import { ChangeDetectionStrategy, Component, effect, inject, OnInit, signal } from '@angular/core';
import {
  ReactiveFormsModule,
  FormControl,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs';
import { ApiService, ErrorDataService } from '@portfolio/console/shared/data-access';
import { ToastService } from '@portfolio/console/shared/ui';
import { AuthErrorCode } from '@portfolio/shared/errors';

@Component({
  selector: 'console-reset-password',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ResetPasswordComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly errorDataService = inject(ErrorDataService);

  readonly submitting = signal(false);
  readonly showPassword = signal(false);
  readonly tokenError = signal(false);

  private token = '';
  private userId = '';

  readonly form = new FormGroup(
    {
      password: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(8)],
      }),
      confirmPassword: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    },
    { validators: [this.passwordsMatchValidator] }
  );

  constructor() {
    effect(() => {
      const err = this.errorDataService.lastError();
      if (!err) return;

      if (err.errorCode === AuthErrorCode.INVALID_RESET_TOKEN || err.errorCode === AuthErrorCode.RESET_TOKEN_EXPIRED) {
        this.tokenError.set(true);
      }
    });
  }

  private static readonly TOKEN_REGEX = /^[0-9a-f]{64}$/;

  ngOnInit(): void {
    this.errorDataService.clear();
    const params = this.route.snapshot.queryParamMap;
    this.token = params.get('token') ?? '';
    this.userId = params.get('userId') ?? '';

    if (!this.token || !this.userId || !ResetPasswordComponent.TOKEN_REGEX.test(this.token)) {
      this.tokenError.set(true);
    }
  }

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.hasError('passwordsMismatch')) {
      this.form.controls.confirmPassword.setErrors({ passwordsMismatch: true });
    }
    if (this.form.invalid) {
      return;
    }

    this.submitting.set(true);
    this.errorDataService.clear();
    const { password } = this.form.getRawValue();

    this.api
      .post('/auth/reset-password', {
        token: this.token,
        userId: this.userId,
        newPassword: password,
      })
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          this.toast.success('Password reset successfully. Please sign in.');
          this.router.navigateByUrl('/auth/login');
        },
        error: () => {
          // Known errors (invalid/expired token) handled by global handler + effect above
        },
      });
  }

  private passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirm = control.get('confirmPassword');
    if (password && confirm && password.value !== confirm.value) {
      return { passwordsMismatch: true };
    }
    return null;
  }
}
