import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { ContainerSize } from './container.types';

@Component({
  selector: 'landing-container',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [class]="containerClasses()">
      <ng-content />
    </div>
  `,
  styleUrl: './container.scss',
})
export class Container {
  // ── Inputs ────────────────────────────────────────────────────────
  readonly size = input<ContainerSize>('content');

  // ── Derived ───────────────────────────────────────────────────────
  protected readonly containerClasses = computed(() => {
    switch (this.size()) {
      case 'wide':
        return 'landing-container landing-container--wide';
      case 'full':
        return 'landing-container landing-container--full';
      case 'content':
      default:
        return 'landing-container';
    }
  });
}

export type { ContainerSize } from './container.types';
