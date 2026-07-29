import { LEFT_ARROW, RIGHT_ARROW } from '@angular/cdk/keycodes';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ChipSelect } from './chip-select';
import type { ChipSelectOption } from './chip-select.types';

const OPTIONS: ChipSelectOption[] = [
  { value: 'grid', label: 'Grid view', icon: 'grid_view' },
  { value: 'list', label: 'List view', icon: 'view_list' },
];

@Component({
  standalone: true,
  imports: [ChipSelect, FormsModule],
  template: `<console-chip-select
    aria-label="View mode"
    [options]="options"
    [iconOnly]="iconOnly"
    [(ngModel)]="value"
  />`,
})
class Host {
  options = OPTIONS;
  iconOnly = false;
  value: string | null = 'grid';
}

/**
 * Two things this component gets wrong easily, both of them invisible to a test that selects by
 * class or test id.
 *
 * **The accessible name.** `MatChipOption` renders an inner `<button role="option">` that owns the
 * name, and forwards `[attr.aria-label]="ariaLabel"` onto it — where `ariaLabel` is its
 * `@Input('aria-label')`. So the label must be bound as the **input** (`[aria-label]`). Written as
 * `[attr.aria-label]` it lands on the `<mat-chip-option>` host instead, which is not the node the
 * accessibility tree exposes, and an icon-only chip then has *no* accessible name at all. Confirmed
 * from a Playwright ARIA snapshot of `/media` before it was fixed —
 *
 *     - radiogroup:
 *       - option [selected]:
 *         - img: grid_view
 *       - option:
 *         - img: view_list
 *
 * — two unnamed options, a WCAG 4.1.2 failure rather than a test-selector problem.
 *
 * **The container role.** That same snapshot shows the second bug: a `radiogroup` whose children
 * are `option`s. `role="option"` is hard-coded in `MatChipOption`'s template and cannot be
 * overridden from outside, so the hand-written `role="radiogroup"` on a plain `<div>` — plus
 * `[attr.role]="'radio'"` and `[attr.aria-checked]` on each chip host — could never take effect.
 * `mat-chip-listbox` owns the role now, which also brings the roving tabindex and arrow-key
 * navigation a bare `<div role="listbox">` would only claim to have.
 */
describe('ChipSelect', () => {
  let fixture: ComponentFixture<Host>;

  async function mount(iconOnly: boolean): Promise<void> {
    fixture = TestBed.createComponent(Host);
    fixture.componentInstance.iconOnly = iconOnly;
    fixture.detectChanges();
    // `ngModel` pushes the initial value through `writeValue` in a microtask, and
    // `MatChipListbox` defers its own `_setSelectionByValue` to a resolved promise as well.
    await fixture.whenStable();
    fixture.detectChanges();
  }

  /** The element the a11y tree actually exposes, not the `<mat-chip-option>` wrapper. */
  function optionButtons(): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('button[role="option"]'));
  }

  function listbox(): HTMLElement {
    return fixture.nativeElement.querySelector('mat-chip-listbox');
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Host],
      providers: [provideNoopAnimations()],
    }).compileComponents();
  });

  describe('ARIA structure', () => {
    beforeEach(() => mount(true));

    it('is a listbox of options, the only pairing valid for the role Material renders', () => {
      expect(listbox().getAttribute('role')).toBe('listbox');
      expect(optionButtons()).toHaveLength(2);
    });

    it('marks each chip host as presentational, so the tree reads listbox → option', () => {
      const hosts: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('mat-chip-option'));
      expect(hosts.map((h) => h.getAttribute('role'))).toEqual(['presentation', 'presentation']);
    });

    it('declares single-select, so nothing announces multi-selectability', () => {
      expect(listbox().getAttribute('aria-multiselectable')).toBe('false');
    });

    /**
     * Material's chip accessibility guidance puts the `aria-label` on the *container*, and this
     * component shipped without one, so the group announced as a bare "listbox".
     */
    it('names the group on the container', () => {
      expect(listbox().getAttribute('aria-label')).toBe('View mode');
    });
  });

  /**
   * Reaching for an MDC class name in a test is normally a smell, but there is no public hook for
   * this and it is the only way to catch `hideSingleSelectionIndicator` being reintroduced. That
   * attribute used to sit on `mat-chip-option`, where it is not an input and therefore inert; moving
   * it to the listbox — where it works — would silently strip the check affordance that the family
   * doc uses to tell `chip-select` apart from `console-segmented-control`, and that Material's docs
   * warn against hiding.
   */
  describe('selection indicator', () => {
    it('keeps the checkmark affordance on every chip', async () => {
      await mount(true);
      expect(fixture.nativeElement.querySelectorAll('.mdc-evolution-chip__checkmark')).toHaveLength(2);
    });
  });

  describe('naming', () => {
    it('names each icon-only option on the inner button, where assistive tech reads it', async () => {
      await mount(true);
      expect(optionButtons().map((b) => b.getAttribute('aria-label'))).toEqual(['Grid view', 'List view']);
    });

    it('renders no visible label text when icon-only', async () => {
      await mount(true);
      expect(fixture.nativeElement.querySelector('.chip-select__chip span:not([class])')).toBeNull();
    });

    it('leaves aria-label off with labels, so the name comes from the visible text', async () => {
      await mount(false);
      expect(optionButtons().map((b) => b.getAttribute('aria-label'))).toEqual([null, null]);
      expect(fixture.nativeElement.textContent).toContain('Grid view');
      expect(fixture.nativeElement.textContent).toContain('List view');
    });
  });

  describe('selection', () => {
    beforeEach(() => mount(true));

    it('reflects the bound value as the selected option', () => {
      expect(optionButtons().map((b) => b.getAttribute('aria-selected'))).toEqual(['true', 'false']);
    });

    it('writes the clicked option back through ngModel', async () => {
      optionButtons()[1].click();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(fixture.componentInstance.value).toBe('list');
      expect(optionButtons().map((b) => b.getAttribute('aria-selected'))).toEqual(['false', 'true']);
    });

    /**
     * `MatChipOption._handlePrimaryActionInteraction` calls `toggleSelected(true)`, so Material's
     * own behaviour for a click on the selected chip is to **deselect** it and propagate
     * `undefined`. For a single-select toggle — a grid/list switch, a status picker — "nothing
     * selected" is not a reachable state, so the component refuses it.
     */
    it('keeps the selection when the already-selected option is clicked again', async () => {
      optionButtons()[0].click();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(fixture.componentInstance.value).toBe('grid');
      expect(optionButtons().map((b) => b.getAttribute('aria-selected'))).toEqual(['true', 'false']);
    });
  });

  describe('keyboard', () => {
    beforeEach(() => mount(true));

    /**
     * `MatChipSet._handleKeydown` forwards to its `FocusKeyManager` only when the event
     * `_originatesFromChip`, so the press has to start on the focused option and bubble. And the
     * key manager reads `keyCode`, which a jsdom `KeyboardEvent` leaves at 0 no matter what `key`
     * says — hence the explicit override rather than `{ key: 'ArrowRight' }`.
     */
    function arrowFrom(button: HTMLElement, keyCode: number): void {
      const event = new KeyboardEvent('keydown', { bubbles: true });
      Object.defineProperty(event, 'keyCode', { get: () => keyCode });
      button.dispatchEvent(event);
      fixture.detectChanges();
    }

    it('moves focus between options with the arrow keys', () => {
      optionButtons()[0].focus();
      expect(document.activeElement).toBe(optionButtons()[0]);

      arrowFrom(optionButtons()[0], RIGHT_ARROW);
      expect(document.activeElement).toBe(optionButtons()[1]);

      arrowFrom(optionButtons()[1], LEFT_ARROW);
      expect(document.activeElement).toBe(optionButtons()[0]);
    });

    it('holds one tab stop for the whole group, on the container', () => {
      // Roving tabindex: Tab enters the group once and lands on the listbox, which forwards focus
      // to the selected chip; the arrows above move between options from there. Every option being
      // separately tabbable — which is what a bare `<div>` of chips gives — would make a two-option
      // toggle cost two Tab presses to pass.
      expect(listbox().getAttribute('tabindex')).toBe('0');
      expect(optionButtons().map((b) => b.getAttribute('tabindex'))).toEqual(['-1', '-1']);
    });

    it('drops out of the tab order entirely when disabled', () => {
      fixture.debugElement.children[0].injector.get(ChipSelect).setDisabledState(true);
      fixture.detectChanges();

      expect(listbox().getAttribute('tabindex')).toBe('-1');
    });
  });

  describe('disabled', () => {
    it('ignores clicks and reports itself disabled once the control is', async () => {
      await mount(true);
      const control = fixture.debugElement.children[0].injector.get(ChipSelect);
      control.setDisabledState(true);
      fixture.detectChanges();

      optionButtons()[1].click();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(listbox().getAttribute('aria-disabled')).toBe('true');
      expect(fixture.componentInstance.value).toBe('grid');
    });
  });
});
