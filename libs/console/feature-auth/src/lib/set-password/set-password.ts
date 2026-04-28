import { ChangeDetectionStrategy, Component, effect, inject, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs';
import { ApiService } from '@portfolio/console/shared/data-access';
import {
  ErrorDataService,
  FormErrorPipe,
  passwordsMatchValidator,
  passwordValidator,
  ServerErrorDirective,
} from '@portfolio/console/shared/util';
import { ToastService } from '@portfolio/console/shared/ui';
import { AuthErrorCode } from '@portfolio/shared/errors';

@Component({
  selector: 'console-set-password',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    ServerErrorDirective,
    FormErrorPipe,
  ],
  templateUrl: './set-password.html',
  styleUrl: './set-password.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SetPasswordComponent implements OnInit {
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
        validators: [Validators.required, passwordValidator()],
      }),
      confirmPassword: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    },
    { validators: [passwordsMatchValidator()] }
  );

  constructor() {
    effect(() => {
      const err = this.errorDataService.lastError();
      if (!err) return;

      if (
        err.errorCode === AuthErrorCode.INVALID_INVITE_TOKEN ||
        err.errorCode === AuthErrorCode.INVITE_TOKEN_EXPIRED
      ) {
        this.tokenError.set(true);
      }
    });
  }

  private static readonly TOKEN_REGEX = /^[0-9a-f]{64}$/i;

  ngOnInit(): void {
    this.errorDataService.clear();
    const params = this.route.snapshot.queryParamMap;
    this.token = params.get('token') ?? '';
    this.userId = params.get('userId') ?? '';

    if (!this.token || !this.userId || !SetPasswordComponent.TOKEN_REGEX.test(this.token)) {
      this.tokenError.set(true);
    }
  }

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }

    this.submitting.set(true);
    this.errorDataService.clear();
    const { password } = this.form.getRawValue();

    this.api
      .post('/auth/set-password', {
        token: this.token,
        userId: this.userId,
        newPassword: password,
      })
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          this.toast.success('Password set successfully. You can now log in.');
          this.router.navigateByUrl('/auth/login');
        },
        error: () => {
          // Known errors (invalid/expired token) handled by global handler + effect above
        },
      });
  }
}
