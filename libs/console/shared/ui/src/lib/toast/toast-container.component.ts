import { Component, DestroyRef, effect, inject } from '@angular/core';
import { ToastService } from './toast.service';
import { ToastType } from './toast.model';

@Component({
  selector: 'console-toast-container',
  standalone: true,
  template: `
    <div class="fixed top-4 right-4 z-50 flex flex-col gap-2 w-80">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="toast-item flex items-start gap-3 rounded-lg px-4 py-3 shadow-lg text-sm"
          [class]="typeClasses(toast.type)"
        >
          <span class="flex-1">{{ toast.message }}</span>
          <button
            class="shrink-0 opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
            (click)="toastService.dismiss(toast.id)"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      }
    </div>
  `,
  styles: `
    .toast-item {
      animation: toast-in 0.3s ease-out;
    }

    @keyframes toast-in {
      from {
        opacity: 0;
        transform: translateX(1rem);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
  `,
})
export class ToastContainerComponent {
  protected readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor() {
    effect(() => {
      const toasts = this.toastService.toasts();
      for (const toast of toasts) {
        if (!this.timers.has(toast.id)) {
          const timer = setTimeout(() => {
            this.toastService.dismiss(toast.id);
            this.timers.delete(toast.id);
          }, toast.duration);
          this.timers.set(toast.id, timer);
        }
      }
    });

    this.destroyRef.onDestroy(() => {
      for (const timer of this.timers.values()) {
        clearTimeout(timer);
      }
    });
  }

  protected typeClasses(type: ToastType): string {
    switch (type) {
      case 'success':
        return 'bg-green-600 text-white';
      case 'error':
        return 'bg-red-600 text-white';
      case 'warning':
        return 'bg-amber-500 text-white';
      case 'info':
        return 'bg-blue-600 text-white';
    }
  }
}
