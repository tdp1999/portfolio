import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type LandingCardVariant = 'plain' | 'glass';

/**
 * Generic card surface. Two visual variants:
 * - `plain` (default) — solid surface, soft shadow, used in console / dashboard contexts.
 * - `glass`            — translucent + backdrop-blur, used on landing sections that sit
 *                        above decorative backgrounds (aurora, blueprint).
 *
 * Optional modifiers:
 * - `elevated`         — bumps shadow + border weight (plain only).
 * - `tilt`             — 3D rotate-on-hover with a deeper shadow stack; honours
 *                        `prefers-reduced-motion`. Pairs with `glass` for landing.
 */
@Component({
  selector: 'landing-card',
  standalone: true,
  template: `
    <div [class]="cardClasses()">
      <ng-content />
    </div>
  `,
  styleUrl: './card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardComponent {
  readonly variant = input<LandingCardVariant>('plain');
  readonly elevated = input<boolean>(false);
  readonly tilt = input<boolean>(false);

  readonly cardClasses = computed(() => {
    const classes = ['card'];
    if (this.variant() === 'glass') classes.push('card--glass');
    if (this.elevated()) classes.push('card--elevated');
    if (this.tilt()) classes.push('card--tilt');
    return classes.join(' ');
  });
}
