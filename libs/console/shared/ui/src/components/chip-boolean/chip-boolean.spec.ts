import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ChipBoolean } from './chip-boolean';

@Component({
  standalone: true,
  imports: [ChipBoolean, FormsModule],
  template: `<console-chip-boolean label="Featured" [icon]="icon" [(ngModel)]="value" />`,
})
class Host {
  icon: string | null = null;
  value: boolean | null = false;
}

/**
 * The one member of the chip family that is **not** a listbox.
 *
 * A boolean is the WAI-ARIA toggle-button pattern: `role="button"` plus `aria-pressed`. That cannot
 * be reached through `mat-chip-option`, whose inner `<button role="option">` owns the accessible
 * name and whose host Material marks `role="presentation"` — which is exactly why the first version
 * of this component shipped a lone orphan `option` with a dead `[attr.aria-pressed]` on the host.
 *
 * `mat-chip` is the escape hatch Material documents for this ("these elements do not implement any
 * specific accessibility pattern; add the appropriate accessibility depending on the context"). Its
 * structure is the exact inverse of `mat-chip-option`: no inner button at all, and the host carries
 * `attr.role` and `attr.aria-label` from inputs. So here the host **is** the exposed node, and
 * writing ARIA onto it is correct rather than dead. The tests below pin that inversion down, because
 * it is the one thing a future edit is most likely to get backwards.
 *
 * Cost of the swap: `mat-chip` never gets `.mdc-evolution-chip--selected`, which is where Material
 * keys the filled background, so the pressed fill is set in SCSS off `[aria-pressed='true']` using
 * Material's own chip tokens. Styling from the ARIA state keeps the two from drifting apart.
 */
describe('ChipBoolean', () => {
  let fixture: ComponentFixture<Host>;

  async function mount(initial: boolean | null = false, icon: string | null = null): Promise<void> {
    fixture = TestBed.createComponent(Host);
    fixture.componentInstance.value = initial;
    fixture.componentInstance.icon = icon;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function chip(): HTMLElement {
    return fixture.nativeElement.querySelector('mat-chip');
  }

  function press(key: string): KeyboardEvent {
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    chip().dispatchEvent(event);
    fixture.detectChanges();
    return event;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Host],
      providers: [provideNoopAnimations()],
    }).compileComponents();
  });

  describe('ARIA structure', () => {
    it('is a toggle button, declared on the host', async () => {
      await mount(false);
      expect(chip().getAttribute('role')).toBe('button');
    });

    /**
     * The guard against sliding back to a chip-option. If any descendant ever carries a role again,
     * the host stops being the exposed node and every attribute below goes dead without a single
     * other test turning red.
     */
    it('exposes exactly one node to the accessibility tree, and it is the host', async () => {
      await mount(false);
      const roled: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('[role]'));
      expect(roled).toEqual([chip()]);
    });

    it('reports the released state as aria-pressed="false", not as a missing attribute', async () => {
      await mount(false);
      expect(chip().getAttribute('aria-pressed')).toBe('false');
    });

    it('reports the pressed state as aria-pressed="true"', async () => {
      await mount(true);
      expect(chip().getAttribute('aria-pressed')).toBe('true');
    });
  });

  describe('naming', () => {
    it('takes its accessible name from the visible label', async () => {
      await mount(false);
      expect(chip().textContent).toContain('Featured');
    });

    /**
     * `mat-icon` renders its ligature as text, so without `aria-hidden` the computed name would come
     * out as "star Featured". Material sets the attribute itself; this test exists so that adding an
     * `aria-label` to the icon (which would switch it back on) cannot pass unnoticed.
     */
    it('hides the decorative icon from the name computation', async () => {
      await mount(false, 'star');
      expect(fixture.nativeElement.querySelector('mat-icon').getAttribute('aria-hidden')).toBe('true');
    });
  });

  describe('toggling', () => {
    it('flips on click and writes a boolean back through ngModel', async () => {
      await mount(false);

      chip().click();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(fixture.componentInstance.value).toBe(true);
      expect(chip().getAttribute('aria-pressed')).toBe('true');

      chip().click();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(fixture.componentInstance.value).toBe(false);
      expect(chip().getAttribute('aria-pressed')).toBe('false');
    });

    it('coerces a null patch to false rather than throwing or staying null', async () => {
      await mount(null);
      expect(chip().getAttribute('aria-pressed')).toBe('false');
    });
  });

  describe('keyboard', () => {
    /**
     * A native `<button>` gets Space and Enter for free; `mat-chip` renders a `<span>`, so the host
     * has to handle both itself. This is the only hand-written keyboard logic the family allows,
     * and only because a single toggle has nothing to navigate between — no roving focus, no arrows.
     */
    it('toggles on Enter', async () => {
      await mount(false);
      press('Enter');
      await fixture.whenStable();
      fixture.detectChanges();

      expect(fixture.componentInstance.value).toBe(true);
    });

    it('toggles on Space and swallows the keypress so the page does not scroll', async () => {
      await mount(false);
      const event = press(' ');
      await fixture.whenStable();
      fixture.detectChanges();

      expect(fixture.componentInstance.value).toBe(true);
      expect(event.defaultPrevented).toBe(true);
    });

    it('ignores keys that are not Enter or Space', async () => {
      await mount(false);
      press('a');
      await fixture.whenStable();
      fixture.detectChanges();

      expect(fixture.componentInstance.value).toBe(false);
    });

    it('is a single tab stop', async () => {
      await mount(false);
      expect(chip().getAttribute('tabindex')).toBe('0');
    });
  });

  describe('disabled', () => {
    it('ignores click and keys, and leaves the tab order', async () => {
      await mount(true);
      fixture.debugElement.children[0].injector.get(ChipBoolean).setDisabledState(true);
      fixture.detectChanges();

      chip().click();
      press('Enter');
      await fixture.whenStable();
      fixture.detectChanges();

      expect(chip().getAttribute('tabindex')).toBe('-1');
      expect(fixture.componentInstance.value).toBe(true);
    });

    /**
     * Leaving the tab order is not enough on its own: a chip reachable by a screen-reader's virtual
     * cursor, or already focused when the control is disabled, still announces as an actionable
     * toggle button unless `aria-disabled` says otherwise. `MatChip` puts it on the inner
     * `<span matChipContent>`, which is not the node exposed here, so the host needs its own.
     */
    it('announces itself as disabled, not merely untabbable', async () => {
      await mount(true);
      fixture.debugElement.children[0].injector.get(ChipBoolean).setDisabledState(true);
      fixture.detectChanges();

      expect(chip().getAttribute('aria-disabled')).toBe('true');
    });

    it('reports aria-disabled="false" while enabled', async () => {
      await mount(true);
      expect(chip().getAttribute('aria-disabled')).toBe('false');
    });

    /** The state still has to be announced while disabled; only the interaction goes away. */
    it('keeps announcing its pressed state while disabled', async () => {
      await mount(true);
      fixture.debugElement.children[0].injector.get(ChipBoolean).setDisabledState(true);
      fixture.detectChanges();

      expect(chip().getAttribute('aria-pressed')).toBe('true');
    });
  });
});
