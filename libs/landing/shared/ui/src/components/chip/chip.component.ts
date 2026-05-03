import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type LandingChipSize = 'sm' | 'md';

@Component({
  selector: 'landing-chip',
  standalone: true,
  template: `<span [class]="chipClasses()">{{ label() }}</span>`,
  styleUrl: './chip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChipComponent {
  readonly label = input<string>('');
  readonly size = input<LandingChipSize>('md');

  protected readonly chipClasses = computed(() => `landing-chip landing-chip--${this.size()}`);
}
