import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Icon } from '../icon/icon';
import { Tooltip } from '../tooltip';

export interface ViewToggleOption {
  readonly id: string;
  readonly label: string;
  /** Icon name registered in the icon provider. */
  readonly icon: string;
  /** Longer description shown in the hover/focus tooltip. Falls back to `label` if omitted. */
  readonly description?: string;
}

/**
 * Icon segmented control for switching between feed layouts (row / grid / timeline).
 * Renders as a radio-group of icon-only buttons; tooltip + aria-label carry the label text.
 *
 * Parent owns the selected value and emits `(valueChange)` on click.
 *
 * ```html
 * <landing-view-toggle
 *   [options]="[
 *     { id: 'row', label: 'Row', icon: 'list' },
 *     { id: 'grid', label: 'Grid', icon: 'layout-grid' },
 *     { id: 'timeline', label: 'Timeline', icon: 'history' }
 *   ]"
 *   [value]="viewMode()"
 *   (valueChange)="setView($event)"
 * />
 * ```
 */
@Component({
  selector: 'landing-view-toggle',
  standalone: true,
  imports: [Icon, Tooltip],
  template: `
    <div class="lvt" role="radiogroup" [attr.aria-label]="ariaLabel()">
      @for (option of options(); track option.id) {
        <!--
          align="end" → bubbles open leftward (right edge pinned to the trigger).
          This control is right-anchored in every toolbar that uses it (margin-left:auto),
          so a centered/leftward-opening bubble escapes the viewport's right edge on
          narrow screens. Opening left keeps it on-screen.
        -->
        <landing-tooltip [text]="option.description ?? option.label" position="bottom" align="end">
          <button
            type="button"
            class="lvt__btn"
            role="radio"
            [class.lvt__btn--active]="value() === option.id"
            [attr.aria-checked]="value() === option.id ? 'true' : 'false'"
            [attr.aria-label]="option.label"
            (click)="onSelect(option.id)"
          >
            <landing-icon [name]="option.icon" [size]="16" />
          </button>
        </landing-tooltip>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
      }
      .lvt {
        display: inline-flex;
        gap: 2px;
        padding: 2px;
        background: var(--landing-ink-1);
        border: 1px solid var(--landing-border);
        border-radius: 4px;
      }
      .lvt__btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 28px;
        color: var(--landing-text-500);
        background: transparent;
        border: none;
        border-radius: 2px;
        cursor: pointer;
        transition:
          color 160ms ease,
          background-color 160ms ease;
      }
      .lvt__btn:hover {
        color: var(--landing-text-300);
      }
      .lvt__btn:focus-visible {
        outline: 2px solid var(--landing-accent);
        outline-offset: 2px;
      }
      .lvt__btn--active {
        color: var(--landing-accent);
        background: var(--landing-ink-0);
        box-shadow: 0 0 0 1px var(--landing-border);
      }
      .lvt__btn--active:hover {
        color: var(--landing-accent);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewToggle {
  readonly options = input.required<readonly ViewToggleOption[]>();
  readonly value = input.required<string>();
  readonly ariaLabel = input<string>('View layout');

  readonly valueChange = output<string>();

  protected onSelect(id: string): void {
    if (id === this.value()) return;
    this.valueChange.emit(id);
  }
}
