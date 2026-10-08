import { Injectable, signal } from '@angular/core';
import { Toast, ToastOptions, ToastType } from './toast.model';
import { DEFAULT_DURATION } from './toast.data';
import { getNextToastId } from './toast.util';

@Injectable({ providedIn: 'root' })
export class ToastService {
  // ── DI ───────────────────────────────────────────────────────────────

  // ── Inputs ────────────────────────────────────────────────────────────

  // ── Outputs ───────────────────────────────────────────────────────────

  // ── Queries ───────────────────────────────────────────────────────────

  // ── Writable signals ──────────────────────────────────────────────────
  private readonly toastsSignal = signal<Toast[]>([]);
  readonly toasts = this.toastsSignal.asReadonly();

  // ── Derived ───────────────────────────────────────────────────────────

  // ── Forms ─────────────────────────────────────────────────────────────

  // ── Plain state ───────────────────────────────────────────────────────

  success(message: string, options: number | ToastOptions = DEFAULT_DURATION): void {
    this.add(message, 'success', options);
  }

  error(message: string, options: number | ToastOptions = DEFAULT_DURATION): void {
    this.add(message, 'error', options);
  }

  warning(message: string, options: number | ToastOptions = DEFAULT_DURATION): void {
    this.add(message, 'warning', options);
  }

  info(message: string, options: number | ToastOptions = DEFAULT_DURATION): void {
    this.add(message, 'info', options);
  }

  dismiss(id: string): void {
    this.toastsSignal.update((toasts) => toasts.filter((t) => t.id !== id));
  }

  /** `options` is the duration in ms, or an object that can also carry an action link. */
  private add(message: string, type: ToastType, options: number | ToastOptions): void {
    const id = getNextToastId();
    const { duration = DEFAULT_DURATION, action } = typeof options === 'number' ? { duration: options } : options;
    const toast: Toast = { id, message, type, duration, ...(action ? { action } : {}) };
    this.toastsSignal.update((toasts) => [...toasts, toast]);
  }
}
