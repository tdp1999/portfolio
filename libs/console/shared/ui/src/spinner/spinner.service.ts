import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SpinnerService {
  private readonly visibleSignal = signal(false);
  readonly visible = this.visibleSignal.asReadonly();

  show(): void {
    this.visibleSignal.set(true);
  }

  hide(): void {
    this.visibleSignal.set(false);
  }
}
