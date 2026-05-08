import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ContainerComponent, EyebrowComponent } from '@portfolio/landing/shared/ui';

/**
 * Lightweight placeholder used while sister sections are still being built.
 * Reserves vertical rhythm so neighboring sections (notably Section 6 — The Story)
 * land in their final scroll position before the corresponding feature tasks ship.
 *
 * Replace each instance as the corresponding feature task lands.
 */
@Component({
  selector: 'landing-home-section-placeholder',
  standalone: true,
  imports: [ContainerComponent, EyebrowComponent],
  template: `
    <section class="placeholder" [attr.aria-label]="label()">
      <landing-container size="wide">
        <div class="placeholder__inner">
          <landing-eyebrow [label]="[number(), label()]" [accentFirst]="true" [trailingRule]="true" />
          <span class="placeholder__task">{{ task() }}</span>
        </div>
      </landing-container>
    </section>
  `,
  styleUrl: './home-section-placeholder.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeSectionPlaceholderComponent {
  readonly number = input.required<string>();
  readonly label = input.required<string>();
  readonly task = input.required<string>();
}
