import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'landing-badge',
  standalone: true,
  template: `
    <span [class]="badgeClasses()">
      <ng-content />
    </span>
  `,
  styleUrl: './badge.component.scss',
})
export class BadgeComponent {
  color = input<'primary' | 'success' | 'warning' | 'error'>('primary');

  badgeClasses = computed(() => `badge badge--${this.color()}`);
}
