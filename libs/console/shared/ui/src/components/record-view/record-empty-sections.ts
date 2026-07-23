import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';

/**
 * The tail of a record page: every section that is absent in full, folded into
 * a single line.
 *
 * ```html
 * <console-record-empty-sections [sections]="['Media', 'Links']" />
 * ```
 *
 * Rendering an empty section header teaches nothing, and rendering a row of
 * em-dashes per missing field turns a sparse record into a ladder of
 * punctuation — which is what the page this replaces did. The count is the
 * signal; the list is there for when the author needs to know exactly what is
 * missing.
 *
 * Pass **section-level** absences only. A field that is empty inside a section
 * that is on screen already shows its own "Not set" line via
 * `console-record-field`; listing it here too would report the same gap twice.
 */
@Component({
  selector: 'console-record-empty-sections',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (sections().length) {
      <div class="rv-empty">
        <button type="button" class="rv-linkbtn" (click)="expanded.set(!expanded())">
          {{ expanded() ? 'Hide' : 'Show' }} {{ sections().length }} empty
          {{ sections().length === 1 ? 'section' : 'sections' }}
        </button>
        @if (expanded()) {
          <ul class="rv-empty__list">
            @for (name of sections(); track name) {
              <li>
                {{ name }}
                <span class="rv-absent">Not set</span>
              </li>
            }
          </ul>
        }
      </div>
    }
  `,
})
export class RecordEmptySections {
  readonly sections = input.required<readonly string[]>();
  protected readonly expanded = signal(false);
}
