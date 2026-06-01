import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  PLATFORM_ID,
  computed,
  forwardRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IconComponent } from '../icon/icon.component';
import type { SelectAlign, SelectOption, SelectTriggerValue } from './select.types';

const OPEN_DELAY_MS = 80;
const CLOSE_DELAY_MS = 200;
/** After a hover-open, clicks within this window are treated as "keep open"
 *  (defeats the hover→click-toggle-off race). Past this window, click toggles
 *  off normally — otherwise users feel like they need to click twice to close. */
const HOVER_GRACE_MS = 250;

/**
 * Generic dropdown select. Works two ways:
 *
 * **Standalone (imperative):**
 * ```html
 * <landing-select
 *   [options]="LANGS"
 *   [value]="lang()"
 *   (valueChange)="lang.set($event)"
 *   triggerIconName="globe"
 *   triggerValue="code"
 * />
 * ```
 *
 * **Reactive forms / ngModel (via ControlValueAccessor):**
 * ```html
 * <landing-select [options]="LANGS" formControlName="language" triggerIconName="globe" />
 * ```
 *
 * The trigger renders the active option's label (or code/sublabel — see `triggerValue`)
 * with an optional left-icon and chevron. The panel renders every option as a row with
 * label + sublabel + a checkmark on the active one. Keyboard: ↑↓ navigate, Enter selects,
 * Esc closes.
 */
@Component({
  selector: 'landing-select',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => LandingSelectComponent),
      multi: true,
    },
  ],
  host: {
    class: 'landing-select',
    '(mouseenter)': 'onMouseEnter()',
    '(mouseleave)': 'onMouseLeave()',
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'close()',
  },
  template: `
    <button
      #triggerBtn
      type="button"
      class="landing-select__trigger"
      [class.landing-select__trigger--open]="open()"
      [class.landing-select__trigger--icon-only]="!showTriggerLabel()"
      [disabled]="effectiveDisabled()"
      [attr.aria-haspopup]="'listbox'"
      [attr.aria-expanded]="open()"
      [attr.aria-controls]="panelId()"
      [attr.aria-label]="ariaLabel() || (selectedOption()?.label ?? placeholder())"
      (click)="toggle($event)"
      (keydown)="onTriggerKeydown($event)"
    >
      @if (triggerIconName(); as icon) {
        <landing-icon [name]="icon" [size]="14" class="landing-select__icon" aria-hidden="true" />
      }
      @if (showTriggerLabel()) {
        <span class="landing-select__value">{{ triggerDisplay() }}</span>
      }
      @if (showChevron()) {
        <landing-icon name="chevron-down" [size]="10" class="landing-select__chevron" aria-hidden="true" />
      }
    </button>

    @if (open()) {
      <div
        class="landing-select__panel"
        [class.landing-select__panel--align-left]="align() === 'left'"
        [class.landing-select__panel--align-right]="align() === 'right'"
        [class.landing-select__panel--up]="placement() === 'up'"
        [id]="panelId()"
        role="listbox"
        [attr.aria-label]="ariaLabel() || placeholder()"
      >
        @for (option of options(); track option.value; let i = $index) {
          <button
            type="button"
            class="landing-select__option"
            [class.landing-select__option--active]="cursor() === i"
            [class.landing-select__option--selected]="isSelected(option.value)"
            [disabled]="option.disabled"
            role="option"
            [attr.aria-selected]="isSelected(option.value)"
            (click)="pick(option, $event)"
            (mouseenter)="cursor.set(i)"
          >
            @if (option.iconName) {
              <landing-icon
                [name]="option.iconName"
                [size]="14"
                class="landing-select__option-icon"
                aria-hidden="true"
              />
            }
            <span class="landing-select__option-label">
              <span class="landing-select__option-name">{{ option.label }}</span>
              @if (option.sublabel) {
                <span class="landing-select__option-sub">{{ option.sublabel }}</span>
              }
            </span>
            @if (isSelected(option.value)) {
              <landing-icon name="check" [size]="12" class="landing-select__check" aria-hidden="true" />
            }
          </button>
        }
      </div>
    }
  `,
  styleUrl: './select.component.scss',
})
export class LandingSelectComponent<T = string> implements ControlValueAccessor {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  constructor() {
    this.destroyRef.onDestroy(() => this.clearTimers());
  }

  readonly options = input.required<readonly SelectOption<T>[]>();
  readonly value = input<T | null>(null);
  readonly placeholder = input<string>('Select…');
  readonly disabled = input(false);
  readonly ariaLabel = input<string>('');

  /** Lucide icon name shown on the left of the trigger (e.g., `globe`). */
  readonly triggerIconName = input<string | null>(null);
  /** Trigger value shape: `label` (default) | `code` | `sublabel`. */
  readonly triggerValue = input<SelectTriggerValue>('label');
  /** Hide the text label inside the trigger (icon-only mode). */
  readonly showTriggerLabel = input<boolean>(true);
  /** Render a chevron after the trigger label. Default true. */
  readonly showChevron = input<boolean>(true);
  /** Panel alignment relative to trigger. */
  readonly align = input<SelectAlign>('right');
  /** Vertical placement: `down` (default) opens below the trigger; `up` opens above
   *  — use when the trigger sits near the bottom of the viewport (e.g. a bottom sheet). */
  readonly placement = input<'down' | 'up'>('down');
  /** Stable id used for `aria-controls`. */
  readonly panelId = input<string>(`landing-select-${nextSelectId()}`);

  readonly valueChange = output<T>();

  protected readonly open = signal(false);
  protected readonly cursor = signal(0);

  private openTimer: ReturnType<typeof setTimeout> | null = null;
  private closeTimer: ReturnType<typeof setTimeout> | null = null;
  /** Tracks WHICH gesture opened the panel so a click that follows a hover-open
   *  doesn't get misread as "toggle off". `null` while closed. */
  private openedBy: 'hover' | 'click' | null = null;
  /** Timestamp of the last hover-open. Bounds the grace window in which a
   *  click is treated as "keep open" instead of toggling off. */
  private hoverOpenedAt = 0;

  // ─── ControlValueAccessor state ────────────────────────────────
  private readonly cvaValue = signal<T | null>(null);
  private readonly cvaDisabled = signal(false);
  private onChange: (value: T | null) => void = () => {};
  private onTouched: () => void = () => {};

  /** Effective value combines imperative `value` input + CVA-written value. */
  protected readonly effectiveValue = computed<T | null>(() => this.value() ?? this.cvaValue());
  protected readonly effectiveDisabled = computed(() => this.disabled() || this.cvaDisabled());

  protected readonly selectedOption = computed<SelectOption<T> | null>(() => {
    const v = this.effectiveValue();
    if (v == null) return null;
    return this.options().find((o) => o.value === v) ?? null;
  });

  protected readonly triggerDisplay = computed<string>(() => {
    const opt = this.selectedOption();
    if (!opt) return this.placeholder();
    switch (this.triggerValue()) {
      case 'code':
        return String(opt.value).toUpperCase();
      case 'sublabel':
        return opt.sublabel ?? opt.label;
      case 'label':
      default:
        return opt.label;
    }
  });

  // ─── CVA implementation ────────────────────────────────────────
  writeValue(value: T | null): void {
    this.cvaValue.set(value);
  }
  registerOnChange(fn: (value: T | null) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.cvaDisabled.set(isDisabled);
  }

  // ─── UI handlers ───────────────────────────────────────────────
  protected isSelected(v: T): boolean {
    return this.effectiveValue() === v;
  }

  protected toggle(event: MouseEvent): void {
    if (this.effectiveDisabled()) return;
    event.stopPropagation();
    this.clearTimers();
    if (!this.open()) {
      this.openAs('click');
      return;
    }
    // Only swallow the close if we're inside the brief grace window after a
    // hover-open (defeats the hover→click race). Past that window the user
    // means "close" and we must respect it on the first click.
    if (this.openedBy === 'hover' && Date.now() - this.hoverOpenedAt < HOVER_GRACE_MS) {
      this.openedBy = 'click';
      return;
    }
    this.doClose();
  }

  protected close(): void {
    this.clearTimers();
    if (this.open()) this.doClose();
  }

  protected onDocumentClick(event: MouseEvent): void {
    if (!this.open()) return;
    const target = event.target as Node | null;
    if (target && this.elementRef.nativeElement.contains(target)) return;
    this.clearTimers();
    this.doClose();
    this.onTouched();
  }

  protected pick(option: SelectOption<T>, event: MouseEvent): void {
    event.stopPropagation();
    if (option.disabled) return;
    this.cvaValue.set(option.value);
    this.onChange(option.value);
    this.valueChange.emit(option.value);
    this.clearTimers();
    this.doClose();
    this.onTouched();
  }

  protected onMouseEnter(): void {
    if (this.effectiveDisabled()) return;
    if (!this.supportsHover()) return;
    if (this.closeTimer !== null) {
      clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }
    if (this.open() || this.openTimer !== null) return;
    this.openTimer = setTimeout(() => {
      this.openTimer = null;
      this.openAs('hover');
    }, OPEN_DELAY_MS);
  }

  protected onMouseLeave(): void {
    if (!this.supportsHover()) return;
    if (this.openTimer !== null) {
      clearTimeout(this.openTimer);
      this.openTimer = null;
    }
    if (!this.open() || this.closeTimer !== null) return;
    this.closeTimer = setTimeout(() => {
      this.closeTimer = null;
      this.doClose();
    }, CLOSE_DELAY_MS);
  }

  protected onTriggerKeydown(event: KeyboardEvent): void {
    if (this.effectiveDisabled()) return;
    if (!this.open()) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        this.clearTimers();
        this.openAs('click');
      }
      return;
    }
    const total = this.options().length;
    if (total === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.cursor.update((c) => (c + 1) % total);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.cursor.update((c) => (c - 1 + total) % total);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const opt = this.options()[this.cursor()];
      if (opt) this.pick(opt, new MouseEvent('click'));
    } else if (event.key === 'Home') {
      event.preventDefault();
      this.cursor.set(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      this.cursor.set(total - 1);
    }
  }

  private openAs(source: 'hover' | 'click'): void {
    this.openedBy = source;
    if (source === 'hover') this.hoverOpenedAt = Date.now();
    // Seed the keyboard cursor with the current value's index so arrow keys
    // start from the active option.
    const i = this.options().findIndex((o) => o.value === this.effectiveValue());
    this.cursor.set(i >= 0 ? i : 0);
    this.open.set(true);
  }

  private doClose(): void {
    this.open.set(false);
    this.openedBy = null;
  }

  private supportsHover(): boolean {
    if (!this.isBrowser) return false;
    return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  }

  private clearTimers(): void {
    if (this.openTimer !== null) {
      clearTimeout(this.openTimer);
      this.openTimer = null;
    }
    if (this.closeTimer !== null) {
      clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }
  }
}

let selectSeq = 0;
function nextSelectId(): string {
  return (++selectSeq).toString(36);
}
