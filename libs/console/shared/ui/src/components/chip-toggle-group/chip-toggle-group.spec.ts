import { LEFT_ARROW, RIGHT_ARROW } from '@angular/cdk/keycodes';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ChipToggleGroup } from './chip-toggle-group';
import type { ChipOption } from './chip-toggle-group.types';

const OPTIONS: ChipOption[] = [
  { value: 'contract', label: 'Contract' },
  { value: 'fulltime', label: 'Full time' },
  { value: 'advisory', label: 'Advisory' },
];

@Component({
  standalone: true,
  imports: [ChipToggleGroup, FormsModule],
  template: `<console-chip-toggle-group aria-label="Open to" [options]="options" [(ngModel)]="value" />`,
})
class Host {
  options = OPTIONS;
  value: string[] | null = ['contract'];
}

/**
 * The multi-select sibling of `chip-select`, and it shipped with the same defect: a hand-written
 * `<div role="group">` wrapping `mat-chip-option`s, whose inner `<button role="option">` is what the
 * accessibility tree actually exposes. A `group` full of `option`s is not a valid structure, and the
 * `[attr.aria-pressed]` written on each chip host landed on an element Material marks
 * `role="presentation"` — a dead attribute, not an override.
 *
 * `mat-chip-listbox [multiple]` is Material's own answer for this ("if the user may select more than
 * one option, add the `multiple` attribute"), so the roles come from the primitive and the roving
 * tabindex comes free. The component doc used to demand `aria-pressed`; that was corrected to
 * `aria-selected` rather than worked around, because a multi-select listbox announces the set
 * context that a bag of independent toggle buttons cannot.
 */
describe('ChipToggleGroup', () => {
  let fixture: ComponentFixture<Host>;

  async function mount(initial: string[] | null = ['contract']): Promise<void> {
    fixture = TestBed.createComponent(Host);
    fixture.componentInstance.value = initial;
    fixture.detectChanges();
    // `ngModel` pushes the initial value through `writeValue` in a microtask, and
    // `MatChipListbox` defers its own `_setSelectionByValue` to a resolved promise as well.
    await fixture.whenStable();
    fixture.detectChanges();
  }

  /** The element the a11y tree exposes, not the `<mat-chip-option>` wrapper. */
  function optionButtons(): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('button[role="option"]'));
  }

  function listbox(): HTMLElement {
    return fixture.nativeElement.querySelector('mat-chip-listbox');
  }

  function selectedFlags(): (string | null)[] {
    return optionButtons().map((b) => b.getAttribute('aria-selected'));
  }

  async function click(index: number): Promise<void> {
    optionButtons()[index].click();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Host],
      providers: [provideNoopAnimations()],
    }).compileComponents();
  });

  describe('ARIA structure', () => {
    beforeEach(() => mount());

    it('is a listbox of options, the only pairing valid for the role Material renders', () => {
      expect(listbox().getAttribute('role')).toBe('listbox');
      expect(optionButtons()).toHaveLength(3);
    });

    it('marks each chip host as presentational, so the tree reads listbox → option', () => {
      const hosts: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('mat-chip-option'));
      expect(hosts.map((h) => h.getAttribute('role'))).toEqual(['presentation', 'presentation', 'presentation']);
    });

    it('declares multi-selectability, which is the whole point of this member', () => {
      expect(listbox().getAttribute('aria-multiselectable')).toBe('true');
    });

    /**
     * Material's accessibility guidance for chips is explicit that the *container* takes the
     * `aria-label`. Without it a screen reader announces a bare "listbox" and the user never learns
     * what the set of chips is for, which is why the input is required rather than optional.
     */
    it('names the group on the container', () => {
      expect(listbox().getAttribute('aria-label')).toBe('Open to');
    });
  });

  describe('selection', () => {
    it('reflects the bound array as the selected options', async () => {
      await mount(['contract', 'advisory']);
      expect(selectedFlags()).toEqual(['true', 'false', 'true']);
    });

    it('adds a clicked option to the array', async () => {
      await mount([]);
      await click(1);

      expect(fixture.componentInstance.value).toEqual(['fulltime']);
      expect(selectedFlags()).toEqual(['false', 'true', 'false']);
    });

    /** Unlike `chip-select`, an empty selection is a legitimate value here. */
    it('removes a clicked option and emits an empty array, never null', async () => {
      await mount(['fulltime']);
      await click(1);

      expect(fixture.componentInstance.value).toEqual([]);
      expect(selectedFlags()).toEqual(['false', 'false', 'false']);
    });

    /**
     * The doc commits to option order for stability: a value that reshuffles on every toggle makes
     * dirty-checking and diffing in the parent form meaningless.
     */
    it('emits in option order, not click order', async () => {
      await mount([]);
      await click(2);
      await click(0);

      expect(fixture.componentInstance.value).toEqual(['contract', 'advisory']);
    });

    it('treats a null patch as an empty selection rather than throwing', async () => {
      await mount(null);
      expect(selectedFlags()).toEqual(['false', 'false', 'false']);
    });
  });

  describe('keyboard', () => {
    beforeEach(() => mount());

    /**
     * `MatChipSet._handleKeydown` forwards to its `FocusKeyManager` only when the event
     * `_originatesFromChip`, so the press has to start on the focused option and bubble. And the key
     * manager reads `keyCode`, which a jsdom `KeyboardEvent` leaves at 0 no matter what `key` says.
     */
    function arrowFrom(button: HTMLElement, keyCode: number): void {
      const event = new KeyboardEvent('keydown', { bubbles: true });
      Object.defineProperty(event, 'keyCode', { get: () => keyCode });
      button.dispatchEvent(event);
      fixture.detectChanges();
    }

    it('moves focus between options with the arrow keys', () => {
      optionButtons()[0].focus();

      arrowFrom(optionButtons()[0], RIGHT_ARROW);
      expect(document.activeElement).toBe(optionButtons()[1]);

      arrowFrom(optionButtons()[1], LEFT_ARROW);
      expect(document.activeElement).toBe(optionButtons()[0]);
    });

    /**
     * The old `<div class="chip-row">` made every chip its own tab stop, so a three-option group cost
     * three Tab presses to cross. The doc's checklist asked for arrow navigation all along; the
     * listbox is what finally delivers it.
     */
    it('holds one tab stop for the whole group, on the container', () => {
      expect(listbox().getAttribute('tabindex')).toBe('0');
      expect(optionButtons().map((b) => b.getAttribute('tabindex'))).toEqual(['-1', '-1', '-1']);
    });
  });

  describe('disabled', () => {
    it('ignores clicks, reports itself disabled, and leaves the tab order', async () => {
      await mount(['contract']);
      fixture.debugElement.children[0].injector.get(ChipToggleGroup).setDisabledState(true);
      fixture.detectChanges();

      await click(1);

      expect(listbox().getAttribute('aria-disabled')).toBe('true');
      expect(listbox().getAttribute('tabindex')).toBe('-1');
      expect(fixture.componentInstance.value).toEqual(['contract']);
    });
  });
});
