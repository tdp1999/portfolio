import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type LandingBackgroundPattern = 'blueprint' | 'topo' | 'hatch' | 'dots' | 'crosshair' | 'aurora';

/**
 * Decorative full-bleed background patterns rendered with pure CSS.
 * Drop inside a `position: relative` host; the component fills its parent.
 *
 * Patterns:
 * - `blueprint` — perspective grid floor receding to a vanishing point.
 * - `topo`      — concentric ring contour map (topographic feel).
 * - `hatch`     — thin diagonal hatching, draftsman's pencil.
 * - `dots`      — dot matrix at intersections, star-field feel.
 * - `crosshair` — radial crosshair sweep, radar / compass feel.
 * - `aurora`    — three blurred accent blobs, glass / mesh feel.
 *
 * `bleedDown` modifier: lifts the bottom clip so the pattern extends below
 * the host section, useful for soft transitions into the next section.
 * The receiving section needs a transparent top band for the bleed to be
 * visible (e.g. `linear-gradient(transparent 0, ink-1 120px)`).
 */
@Component({
  selector: 'landing-background',
  standalone: true,
  template: `
    <div [class]="rootClass()" aria-hidden="true">
      @if (pattern() === 'aurora') {
        <span class="landing-bg__blob landing-bg__blob--1"></span>
        <span class="landing-bg__blob landing-bg__blob--2"></span>
        <span class="landing-bg__blob landing-bg__blob--3"></span>
      }
    </div>
  `,
  styleUrl: './background.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.is-bleed-down]': 'bleedDown()',
  },
})
export class LandingBackgroundComponent {
  readonly pattern = input<LandingBackgroundPattern>('blueprint');
  /** Allow the pattern to extend below the host section bounds. Default false. */
  readonly bleedDown = input<boolean>(false);

  protected readonly rootClass = computed(() => {
    const parts = ['landing-bg', `landing-bg--${this.pattern()}`];
    if (this.bleedDown()) parts.push('landing-bg--bleed-down');
    return parts.join(' ');
  });
}
