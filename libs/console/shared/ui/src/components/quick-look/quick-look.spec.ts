import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QuickLook } from './quick-look';

describe('QuickLook', () => {
  let fixture: ComponentFixture<QuickLook>;
  let component: QuickLook;

  function create(inputs: Partial<{ open: boolean; hasPrev: boolean; hasNext: boolean }> = {}) {
    TestBed.configureTestingModule({ imports: [QuickLook] }).compileComponents();
    fixture = TestBed.createComponent(QuickLook);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('open', inputs.open ?? true);
    fixture.componentRef.setInput('hasPrev', inputs.hasPrev ?? false);
    fixture.componentRef.setInput('hasNext', inputs.hasNext ?? false);
    fixture.detectChanges();
  }

  /**
   * `target` must be a REAL element. `isEditableTarget` narrows with
   * `instanceof HTMLElement` before it reads `tagName`, so a `{ tagName: 'INPUT' }`
   * stand-in is not "typing" — it is not an element at all. The test used one and
   * so asserted the opposite of what it meant to: the guard returned false, Space
   * closed the overlay, and the failure looked like a component bug rather than a
   * fixture that never resembled the DOM.
   */
  function press(key: string, target: EventTarget = document.createElement('div')): KeyboardEvent {
    const event = new KeyboardEvent('keydown', { key, cancelable: true });
    Object.defineProperty(event, 'target', { value: target });
    component.onKeydown(event);
    return event;
  }

  it('closes on Escape and Space', () => {
    create({ open: true });
    press('Escape');
    expect(component.open()).toBe(false);

    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    press(' ');
    expect(component.open()).toBe(false);
  });

  it('emits prev/next only when enabled', () => {
    create({ open: true, hasPrev: false, hasNext: true });
    const prev = jest.fn();
    const next = jest.fn();
    component.prev.subscribe(prev);
    component.next.subscribe(next);

    press('ArrowLeft');
    expect(prev).not.toHaveBeenCalled();
    press('ArrowRight');
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('ignores keys when closed', () => {
    create({ open: false });
    const event = press('Escape');
    expect(event.defaultPrevented).toBe(false);
  });

  it('does not hijack keys while typing in a field', () => {
    create({ open: true });
    press(' ', document.createElement('input'));
    expect(component.open()).toBe(true);
  });

  it('does not hijack keys while typing in a rich-text editor', () => {
    // `isEditableTarget` also matches anything inside a contenteditable root,
    // which is how the guard covers the engine's editing surface. A child node
    // is the realistic target — the event fires on the deepest element.
    // jsdom does not implement `isContentEditable` — it never computes the
    // inherited value, so setting the attribute on the parent leaves the child
    // reporting false. Define the property the guard actually reads, which is
    // what a browser would report for a node inside a contenteditable root.
    const child = document.createElement('span');
    Object.defineProperty(child, 'isContentEditable', { value: true });
    document.body.append(child);

    create({ open: true, hasNext: true });
    const next = jest.fn();
    component.next.subscribe(next);

    press(' ', child);
    press('ArrowRight', child);
    expect(component.open()).toBe(true);
    expect(next).not.toHaveBeenCalled();

    child.remove();
  });
});
