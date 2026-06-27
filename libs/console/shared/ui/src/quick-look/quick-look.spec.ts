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

  function press(key: string, target: Partial<HTMLElement> = {}): KeyboardEvent {
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
    press(' ', { tagName: 'INPUT' } as Partial<HTMLElement>);
    expect(component.open()).toBe(true);
  });
});
