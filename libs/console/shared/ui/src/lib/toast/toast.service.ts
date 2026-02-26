import { Injectable, signal } from '@angular/core';
import { Toast, ToastType } from './toast.model';

const DEFAULT_DURATION = 5000;

let nextId = 0;

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  success(message: string, duration = DEFAULT_DURATION): void {
    this.add(message, 'success', duration);
  }

  error(message: string, duration = DEFAULT_DURATION): void {
    this.add(message, 'error', duration);
  }

  warning(message: string, duration = DEFAULT_DURATION): void {
    this.add(message, 'warning', duration);
  }

  info(message: string, duration = DEFAULT_DURATION): void {
    this.add(message, 'info', duration);
  }

  dismiss(id: string): void {
    this._toasts.update((toasts) => toasts.filter((t) => t.id !== id));
  }

  private add(message: string, type: ToastType, duration: number): void {
    const id = `toast-${++nextId}`;
    const toast: Toast = { id, message, type, duration };
    this._toasts.update((toasts) => [...toasts, toast]);
  }
}
