import { Injectable, signal } from '@angular/core';
import { Toast, ToastType } from './toast.model';
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
    this.toastsSignal.update((toasts) => toasts.filter((t) => t.id !== id));
  }

  private add(message: string, type: ToastType, duration: number): void {
    const id = getNextToastId();
    const toast: Toast = { id, message, type, duration };
    this.toastsSignal.update((toasts) => [...toasts, toast]);
  }
}
