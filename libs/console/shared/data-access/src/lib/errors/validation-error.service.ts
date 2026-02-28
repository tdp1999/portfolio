import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ValidationErrorService {
  private readonly _fieldErrors = signal<Record<string, string[]> | null>(null);
  readonly fieldErrors = this._fieldErrors.asReadonly();

  push(errors: Record<string, string[]>): void {
    this._fieldErrors.set(errors);
  }

  clear(): void {
    this._fieldErrors.set(null);
  }
}
