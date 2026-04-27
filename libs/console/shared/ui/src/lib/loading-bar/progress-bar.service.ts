import { Injectable, signal } from '@angular/core';

export interface ProgressBarHandle {
  complete(): void;
}

/**
 * Ref-counted progress bar service. Multiple concurrent `start()` calls keep the
 * bar visible until every handle has been completed. Used by the router (auto-wired)
 * and by list pages calling `start()` for background refresh after mutations.
 */
@Injectable({ providedIn: 'root' })
export class ProgressBarService {
  private count = 0;
  readonly active = signal(false);

  start(): ProgressBarHandle {
    this.count++;
    if (this.count === 1) this.active.set(true);

    let completed = false;
    return {
      complete: () => {
        if (completed) return;
        completed = true;
        this.count = Math.max(0, this.count - 1);
        if (this.count === 0) this.active.set(false);
      },
    };
  }

  reset(): void {
    this.count = 0;
    this.active.set(false);
  }
}
