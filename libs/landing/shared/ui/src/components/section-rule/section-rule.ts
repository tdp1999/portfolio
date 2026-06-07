import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type LandingSectionRuleVariant = 'plain' | 'lift';

@Component({
  selector: 'landing-section-rule',
  standalone: true,
  template: `<div [class]="ruleClasses()" [attr.data-lift]="variant() === 'lift' ? '' : null" role="separator"></div>`,
  styleUrl: './section-rule.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionRule {
  readonly variant = input<LandingSectionRuleVariant>('plain');

  protected readonly ruleClasses = computed(() => `landing-section-rule landing-section-rule--${this.variant()}`);
}
