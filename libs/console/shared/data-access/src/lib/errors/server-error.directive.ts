import { ChangeDetectorRef, Directive, effect, inject, input, DestroyRef } from '@angular/core';
import { FormGroupDirective } from '@angular/forms';
import { ValidationErrorService } from './validation-error.service';

export interface ServerErrorFallback {
  showError(message: string): void;
}

/** Injection token allowing the directive to toast unmatched field errors. */
import { InjectionToken } from '@angular/core';
export const SERVER_ERROR_FALLBACK = new InjectionToken<ServerErrorFallback>('SERVER_ERROR_FALLBACK');

@Directive({
  selector: '[formGroup][serverErrorMap]',
  standalone: true,
})
export class ServerErrorDirective {
  private readonly formGroupDir = inject(FormGroupDirective);
  private readonly validationErrorService = inject(ValidationErrorService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly fallback = inject(SERVER_ERROR_FALLBACK, { optional: true });

  /** Maps API field names to form control names. Default: identity (API name = control name). */
  serverErrorMap = input<Record<string, string>>({});

  constructor() {
    const destroyRef = inject(DestroyRef);
    let cleared = false;

    // Auto-clear validation errors when directive is destroyed (navigation away)
    destroyRef.onDestroy(() => {
      if (!cleared) {
        this.validationErrorService.clear();
        cleared = true;
      }
    });

    effect(() => {
      const fieldErrors = this.validationErrorService.fieldErrors();
      if (!fieldErrors) return;

      const map = this.serverErrorMap();
      const form = this.formGroupDir.form;
      const unmatchedMessages: string[] = [];

      for (const [apiField, messages] of Object.entries(fieldErrors)) {
        const controlName = map[apiField] ?? apiField;
        const control = form.get(controlName);
        if (control) {
          control.setErrors({ server: messages[0] });
          control.markAsTouched();
        } else {
          unmatchedMessages.push(messages[0]);
        }
      }

      if (unmatchedMessages.length > 0 && this.fallback) {
        this.fallback.showError(unmatchedMessages.join('. '));
      }

      this.cdr.markForCheck();
    });
  }
}
