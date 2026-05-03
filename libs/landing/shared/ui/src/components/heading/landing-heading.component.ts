import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Section heading with a hover-revealed anchor link (`#`), like modern docs sites
 * (Docusaurus, MDN, GitHub READMEs). Clicking copies a deep-link to the section to the URL.
 *
 * Usage:
 * ```html
 * <landing-heading id="intro" level="2" class="font-display text-display-sm text-landing-text-300">
 *   Introduction
 * </landing-heading>
 * ```
 *
 * Apply visual classes (font-display, text-..., margin/etc) directly to `<landing-heading>` —
 * they apply to the host wrapper and the inner heading inherits font/color via CSS.
 *
 * Set `[anchor]="false"` to suppress the link icon (useful for h1 page titles).
 */
@Component({
  selector: 'landing-heading',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, NgTemplateOutlet],
  template: `
    <ng-template #content>
      <ng-content />
      @if (anchor() && id()) {
        <a
          [routerLink]="[]"
          [fragment]="id()"
          [attr.aria-label]="ariaLabel()"
          [title]="title()"
          class="opacity-0 group-hover/heading:opacity-100 text-landing-text-500 hover:text-landing-accent transition-opacity duration-motion-base font-mono text-body-md no-underline ml-2"
          >#</a
        >
      }
    </ng-template>

    @switch (level()) {
      @case (1) {
        <h1 [id]="id()" class="group/heading inline-flex items-center scroll-mt-20">
          <ng-container [ngTemplateOutlet]="content" />
        </h1>
      }
      @case (2) {
        <h2 [id]="id()" class="group/heading inline-flex items-center scroll-mt-20">
          <ng-container [ngTemplateOutlet]="content" />
        </h2>
      }
      @case (3) {
        <h3 [id]="id()" class="group/heading inline-flex items-center scroll-mt-20">
          <ng-container [ngTemplateOutlet]="content" />
        </h3>
      }
      @case (4) {
        <h4 [id]="id()" class="group/heading inline-flex items-center scroll-mt-20">
          <ng-container [ngTemplateOutlet]="content" />
        </h4>
      }
      @case (5) {
        <h5 [id]="id()" class="group/heading inline-flex items-center scroll-mt-20">
          <ng-container [ngTemplateOutlet]="content" />
        </h5>
      }
      @default {
        <h6 [id]="id()" class="group/heading inline-flex items-center scroll-mt-20">
          <ng-container [ngTemplateOutlet]="content" />
        </h6>
      }
    }
  `,
})
export class LandingHeadingComponent {
  readonly level = input<HeadingLevel>(2);
  readonly id = input<string>('');
  readonly anchor = input(true);

  readonly ariaLabel = computed(() => `Anchor link to ${this.id()}`);
  readonly title = computed(() => 'Copy link to this section');
}
