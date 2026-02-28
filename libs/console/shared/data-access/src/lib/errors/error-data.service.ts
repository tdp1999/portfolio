import { Injectable, signal } from '@angular/core';
import { ApiError } from './api-error';

@Injectable({ providedIn: 'root' })
export class ErrorDataService {
  private readonly _lastError = signal<ApiError | null>(null);
  readonly lastError = this._lastError.asReadonly();

  push(error: ApiError): void {
    this._lastError.set(error);
  }

  clear(): void {
    this._lastError.set(null);
  }
}
