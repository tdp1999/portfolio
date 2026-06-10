import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { ArrowDirection } from './icon-arrow.types';

export type { ArrowDirection } from './icon-arrow.types';

@Component({
  selector: 'landing-icon-arrow',
  standalone: true,
  template: `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      [attr.aria-hidden]="ariaHidden() ? 'true' : null"
      focusable="false"
    >
      @switch (direction()) {
        @case ('right') {
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="13 6 19 12 13 18" />
        }
        @case ('left') {
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="11 6 5 12 11 18" />
        }
        @default {
          <line x1="7" y1="17" x2="17" y2="7" />
          <polyline points="9 7 17 7 17 15" />
        }
      }
    </svg>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
        line-height: 0;
        color: currentColor;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconArrow {
  readonly direction = input<ArrowDirection>('right');
  readonly size = input(16);
  readonly ariaHidden = input(true);
}
