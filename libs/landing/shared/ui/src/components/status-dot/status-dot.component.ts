import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type LandingStatusDotState = 'available' | 'busy' | 'away';
export type LandingStatusDotVariant = 'pill' | 'bare';

@Component({
  selector: 'landing-status-dot',
  standalone: true,
  template: `
    <span [class]="rootClasses()" [attr.aria-label]="ariaLabel()" role="status">
      <span class="landing-status-dot__dot" aria-hidden="true"></span>
      <span class="landing-status-dot__label">{{ label() }}</span>
    </span>
  `,
  styleUrl: './status-dot.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusDotComponent {
  readonly state = input<LandingStatusDotState>('available');
  readonly variant = input<LandingStatusDotVariant>('pill');
  readonly label = input<string>('');
  readonly ariaLabel = input<string>('');

  protected readonly rootClasses = computed(
    () => `landing-status-dot landing-status-dot--${this.state()} landing-status-dot--${this.variant()}`
  );
}
