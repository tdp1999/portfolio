import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Lightweight placeholder used while sister sections are still being built.
 * Reserves vertical rhythm so neighboring sections (notably Section 6 — The Story)
 * land in their final scroll position before tasks 283/284/(stack) ship.
 *
 * Replace each instance as the corresponding feature task lands.
 */
@Component({
  selector: 'landing-home-section-placeholder',
  standalone: true,
  template: `
    <section class="placeholder" [attr.aria-label]="label()">
      <div class="placeholder__inner">
        <span class="placeholder__label">{{ label() }}</span>
        <span class="placeholder__task">{{ task() }}</span>
      </div>
    </section>
  `,
  styleUrl: './home-section-placeholder.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeSectionPlaceholderComponent {
  readonly label = input.required<string>();
  readonly task = input.required<string>();
}
