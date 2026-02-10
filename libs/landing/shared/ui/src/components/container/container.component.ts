import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'landing-container',
  standalone: true,
  template: `
    <div [class]="containerClasses()">
      <ng-content />
    </div>
  `,
  styleUrl: './container.component.scss',
})
export class ContainerComponent {
  wide = input(false);

  containerClasses = computed(() => `container ${this.wide() ? 'container--wide' : ''}`.trim());
}
