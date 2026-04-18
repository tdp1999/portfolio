import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Editor } from './editor';

describe('Editor (markdown editor — textarea placeholder)', () => {
  let component: Editor;
  let fixture: ComponentFixture<Editor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Editor],
    }).compileComponents();

    fixture = TestBed.createComponent(Editor);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('setContent / getContent round-trip', () => {
    component.setContent('# hello');
    expect(component.getContent()).toBe('# hello');
  });

  it('emits contentChange when textarea input changes', () => {
    const spy = jest.fn();
    component.contentChange.subscribe(spy);

    const textarea: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea');
    textarea.value = 'updated';
    textarea.dispatchEvent(new Event('input'));

    expect(spy).toHaveBeenCalledWith({ markdown: 'updated' });
    expect(component.getContent()).toBe('updated');
  });

  it('writeValue updates the content (ControlValueAccessor)', () => {
    component.writeValue('from form');
    expect(component.getContent()).toBe('from form');
  });
});
