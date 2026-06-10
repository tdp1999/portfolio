import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ValidationErrorService {
  private readonly fieldErrorsSignal = signal<Record<string, string[]> | null>(null);
  readonly fieldErrors = this.fieldErrorsSignal.asReadonly();

  push(errors: Record<string, string[]>): void {
    this.fieldErrorsSignal.set(errors);
  }

  clear(): void {
    this.fieldErrorsSignal.set(null);
  }
}
