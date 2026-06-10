import { Injectable, signal } from '@angular/core';
import { ApiError } from './api-error';

@Injectable({ providedIn: 'root' })
export class ErrorDataService {
  private readonly lastErrorSignal = signal<ApiError | null>(null);
  readonly lastError = this.lastErrorSignal.asReadonly();

  push(error: ApiError): void {
    this.lastErrorSignal.set(error);
  }

  clear(): void {
    this.lastErrorSignal.set(null);
  }
}
