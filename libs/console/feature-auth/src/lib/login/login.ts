import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthStore, ErrorDataService } from '@portfolio/console/shared/data-access';
import { ToastService } from '@portfolio/console/shared/ui';
import { AuthErrorCode } from '@portfolio/shared/errors';

@Component({
  selector: 'console-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class LoginComponent {
  private readonly authStore = inject(AuthStore);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly errorDataService = inject(ErrorDataService);
  private countdownInterval: ReturnType<typeof setInterval> | null = null;

  readonly submitting = signal(false);
  readonly showPassword = signal(false);
  readonly remainingAttempts = signal<number | null>(null);
  readonly retryAfterSeconds = signal<number | null>(null);

  readonly form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    rememberMe: new FormControl(false, { nonNullable: true }),
  });

  constructor() {
    effect(() => {
      const err = this.errorDataService.lastError();
      if (!err) return;

      if (err.errorCode === AuthErrorCode.ACCOUNT_LOCKED || err.errorCode === AuthErrorCode.INVALID_CREDENTIALS) {
        const data = err.data as { remainingAttempts?: number; retryAfterSeconds?: number } | undefined;
        if (data?.remainingAttempts != null) this.remainingAttempts.set(data.remainingAttempts);
        if (data?.retryAfterSeconds != null) {
          this.retryAfterSeconds.set(data.retryAfterSeconds);
          this.startCountdown();
        }
      }
    });
  }

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.remainingAttempts.set(null);
    this.retryAfterSeconds.set(null);
    this.clearCountdown();
    this.errorDataService.clear();

    const { email, password, rememberMe } = this.form.getRawValue();

    this.authStore.login(email, password, rememberMe).subscribe({
      next: () => {
        this.toast.success('Signed in successfully');
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/';
        this.router.navigateByUrl(returnUrl);
      },
      error: () => {
        this.submitting.set(false);
        // Known errors are handled by global handler + effect above
      },
    });
  }

  private startCountdown(): void {
    this.clearCountdown();
    this.countdownInterval = setInterval(() => {
      const current = this.retryAfterSeconds();
      if (current != null && current > 1) {
        this.retryAfterSeconds.set(current - 1);
      } else {
        this.retryAfterSeconds.set(null);
        this.remainingAttempts.set(null);
        this.clearCountdown();
      }
    }, 1000);
    this.destroyRef.onDestroy(() => this.clearCountdown());
  }

  private clearCountdown(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  loginWithGoogle(): void {
    this.authStore.loginWithGoogle();
  }
}
