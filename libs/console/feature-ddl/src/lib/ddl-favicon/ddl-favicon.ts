import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FAVICON_SIZES, FIT, INK_OPTIONS, SHIPPED, TAB_STRIP } from './ddl-favicon.data';

/**
 * DDL — CONSOLE FAVICON (living record of the shipped icon).
 *
 * Every preview here loads `/brand/favicon.svg` itself, so this page cannot
 * drift from what console ships and costs the repo zero extra image assets.
 *
 * The two-state preview relies on one browser behaviour worth knowing: an SVG
 * loaded through `<img>` resolves its own `prefers-color-scheme` against the
 * *used* colour-scheme of the element around it, so wrapping the same file in
 * `color-scheme: light` and `color-scheme: dark` shows both states side by
 * side. Inlining the SVG does NOT work — an inline `<style>` media query
 * evaluates against the document, so both copies would render identically.
 */
@Component({
  selector: 'console-ddl-favicon',
  standalone: true,
  templateUrl: './ddl-favicon.html',
  styleUrl: './ddl-favicon.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DdlFavicon {
  protected readonly shipped = SHIPPED;
  protected readonly sizes = FAVICON_SIZES;
  protected readonly tabStrip = TAB_STRIP;
  protected readonly fit = FIT;
  protected readonly inks = INK_OPTIONS;
}
