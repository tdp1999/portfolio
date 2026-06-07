import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Textarea } from './textarea';

describe('TextareaComponent', () => {
  let component: Textarea;
  let fixture: ComponentFixture<Textarea>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Textarea, FormsModule, ReactiveFormsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(Textarea);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ── B1 ──
  it('preserves newlines in the projected value', () => {
    const multiline = 'line one\nline two\nline three';
    component.writeValue(multiline);
    fixture.detectChanges();
    const ta: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea');
    expect(ta.value).toBe(multiline);
  });

  // ── B2 ──
  it('renders the rows attribute from input', () => {
    fixture.componentRef.setInput('rows', 8);
    fixture.detectChanges();
    const ta: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea');
    expect(ta.rows).toBe(8);
  });

  it('defaults rows to 4', () => {
    const ta: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea');
    expect(ta.rows).toBe(4);
  });

  // ── B3 ──
  it('renders maxlength attribute when provided', () => {
    fixture.componentRef.setInput('maxLength', 100);
    fixture.detectChanges();
    const ta: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea');
    expect(ta.getAttribute('maxlength')).toBe('100');
  });

  it('does not render maxlength when not provided', () => {
    const ta: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea');
    expect(ta.getAttribute('maxlength')).toBeNull();
  });

  // ── B4 ──
  it('applies the textarea--error class when hasError is true', () => {
    fixture.componentRef.setInput('hasError', true);
    fixture.detectChanges();
    const ta: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea');
    expect(ta.className).toContain('textarea--error');
  });

  it('sets aria-invalid when hasError is true', () => {
    fixture.componentRef.setInput('hasError', true);
    fixture.detectChanges();
    const ta: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea');
    expect(ta.getAttribute('aria-invalid')).toBe('true');
  });

  // ── B6 ──
  it('calls onTouched on blur', () => {
    const onTouchedSpy = jest.fn();
    component.registerOnTouched(onTouchedSpy);
    const ta: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea');
    ta.dispatchEvent(new Event('blur'));
    expect(onTouchedSpy).toHaveBeenCalled();
  });

  it('calls onChange on input event', () => {
    const onChangeSpy = jest.fn();
    component.registerOnChange(onChangeSpy);
    const ta: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea');
    ta.value = 'hello world';
    ta.dispatchEvent(new Event('input'));
    expect(onChangeSpy).toHaveBeenCalledWith('hello world');
  });

  // ── B7 ──
  it('writeValue seeds the textarea content', () => {
    component.writeValue('seeded');
    fixture.detectChanges();
    const ta: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea');
    expect(ta.value).toBe('seeded');
  });

  it('writeValue handles null gracefully', () => {
    component.writeValue(null as unknown as string);
    fixture.detectChanges();
    expect(component['value']()).toBe('');
  });

  it('integrates with FormControl', () => {
    const fc = new FormControl<string>('initial', { nonNullable: true });
    component.writeValue(fc.value);
    component.registerOnChange((v: string) => fc.setValue(v));
    fixture.detectChanges();

    const ta: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea');
    expect(ta.value).toBe('initial');

    ta.value = 'updated';
    ta.dispatchEvent(new Event('input'));
    expect(fc.value).toBe('updated');
  });

  it('renders disabled attribute when disabled', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    const ta: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea');
    expect(ta.disabled).toBe(true);
  });
});
