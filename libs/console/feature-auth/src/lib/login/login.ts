import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthStore } from '@portfolio/console/shared/data-access';
import { ToastService } from '@portfolio/console/shared/ui';

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

    const { email, password, rememberMe } = this.form.getRawValue();

    this.authStore.login(email, password, rememberMe).subscribe({
      next: () => {
        this.toast.success('Signed in successfully');
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err: {
        status?: number;
        error?: { message?: { remainingAttempts?: number; retryAfterSeconds?: number } };
      }) => {
        this.submitting.set(false);

        // 429 is handled by the global error interceptor — don't show a second toast
        if (err.status === 429) return;

        const msg = err.error?.message;
        if (msg && typeof msg === 'object') {
          if (msg.remainingAttempts != null) this.remainingAttempts.set(msg.remainingAttempts);
          if (msg.retryAfterSeconds != null) {
            this.retryAfterSeconds.set(msg.retryAfterSeconds);
            this.startCountdown();
          }
        }
        this.toast.error('Invalid email or password');
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
