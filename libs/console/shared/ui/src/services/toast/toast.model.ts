export type ToastType = 'success' | 'error' | 'warning' | 'info';

/** A link button inside the toast, e.g. "View run" after starting one. Clicking it also closes the toast. */
export interface ToastAction {
  label: string;
  /** A router link, as `routerLink` takes it. */
  link: string | readonly unknown[];
}

export interface ToastOptions {
  duration?: number;
  action?: ToastAction;
}

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
  action?: ToastAction;
}
