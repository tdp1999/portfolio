import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type ContainerSize = 'content' | 'wide' | 'full';

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
  size = input<ContainerSize>('content');

  containerClasses = computed(() => {
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
