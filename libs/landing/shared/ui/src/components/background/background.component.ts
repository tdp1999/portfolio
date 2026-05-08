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
})
export class LandingBackgroundComponent {
  readonly pattern = input<LandingBackgroundPattern>('blueprint');

  protected readonly rootClass = computed(() => `landing-bg landing-bg--${this.pattern()}`);
}
