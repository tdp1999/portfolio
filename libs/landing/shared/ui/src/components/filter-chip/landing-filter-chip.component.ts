import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/**
 * Toggleable filter pill. Visually echoes `<landing-chip>` (same mono-caps, same chip silhouette)
 * but is rendered as a real `<button>` because it carries semantic interaction — per the project
 * rule "chips are metadata, not buttons; promote to button if genuinely interactive."
 *
 * Use inside filter bars on feed pages (/projects, /blog). Emits `(toggle)` with the next intended
 * state — parent owns the source of truth and re-binds `selected`.
 *
 * ```html
 * <landing-filter-chip
 *   label="TypeScript"
 *   [count]="9"
 *   [selected]="isSelected('typescript')"
 *   (selectionChange)="onToggle('typescript', $event)"
 * />
 * ```
 */
@Component({
  selector: 'landing-filter-chip',
  standalone: true,
  template: `
    <button
      type="button"
      class="lfc"
      [class.lfc--selected]="selected()"
      [attr.aria-pressed]="selected() ? 'true' : 'false'"
      [disabled]="disabled()"
      (click)="onClick()"
    >
      <span class="lfc__label">{{ label() }}</span>
      @if (count() !== null) {
        <span class="lfc__count" aria-hidden="true">{{ count() }}</span>
      }
    </button>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
      }
      .lfc {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 6px 12px;
        font-family: var(--landing-font-mono);
        font-size: var(--landing-mono-sm);
        line-height: 16px;
        letter-spacing: var(--landing-tracking-mono);
        text-transform: uppercase;
        color: var(--landing-text-500);
        background: transparent;
        border: 1px solid var(--landing-border);
        border-radius: 4px;
        cursor: pointer;
        transition:
          color 160ms ease,
          border-color 160ms ease,
          background-color 160ms ease;
      }
      .lfc:hover:not(:disabled) {
        color: var(--landing-text-300);
        border-color: var(--landing-text-500);
      }
      .lfc:focus-visible {
        outline: 2px solid var(--landing-accent);
        outline-offset: 2px;
      }
      .lfc:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
      .lfc--selected {
        color: var(--landing-accent);
        border-color: var(--landing-accent);
        background: color-mix(in srgb, var(--landing-accent) 8%, transparent);
      }
      .lfc--selected:hover:not(:disabled) {
        color: var(--landing-accent);
        border-color: var(--landing-accent);
      }
      .lfc__count {
        font-size: var(--landing-mono-sm);
        color: inherit;
        opacity: 0.6;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingFilterChipComponent {
  readonly label = input.required<string>();
  readonly selected = input<boolean>(false);
  readonly disabled = input<boolean>(false);
  /** Optional count badge — pass `null` to hide. */
  readonly count = input<number | null>(null);

  /** Emits the intended next selection state (i.e. `!selected`). Parent owns the truth. */
  readonly selectionChange = output<boolean>();

  protected onClick(): void {
    this.selectionChange.emit(!this.selected());
  }
}
