import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CheckboxComponent } from './checkbox.component';

describe('CheckboxComponent', () => {
  let component: CheckboxComponent;
  let fixture: ComponentFixture<CheckboxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CheckboxComponent, FormsModule, ReactiveFormsModule],
    }).compileComponents();
    fixture = TestBed.createComponent(CheckboxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ── C1, C3 ──
  it('toggles checked when native input change fires', () => {
    const native: HTMLInputElement = fixture.nativeElement.querySelector('input[type="checkbox"]');
    native.checked = true;
    native.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(component['checked']()).toBe(true);
  });

  it('calls onChange callback with the new boolean', () => {
    const onChange = jest.fn();
    component.registerOnChange(onChange);
    const native: HTMLInputElement = fixture.nativeElement.querySelector('input[type="checkbox"]');
    native.checked = true;
    native.dispatchEvent(new Event('change'));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  // ── C4 ──
  it('fires onChange when toggled via the same change event (keyboard Space mirrors this)', () => {
    const onChange = jest.fn();
    component.registerOnChange(onChange);
    const native: HTMLInputElement = fixture.nativeElement.querySelector('input[type="checkbox"]');
    native.checked = true;
    native.dispatchEvent(new Event('change'));
    native.checked = false;
    native.dispatchEvent(new Event('change'));
    expect(onChange).toHaveBeenNthCalledWith(1, true);
    expect(onChange).toHaveBeenNthCalledWith(2, false);
  });

  // ── C6 ──
  it('renders native disabled attribute when disabled', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    const native: HTMLInputElement = fixture.nativeElement.querySelector('input[type="checkbox"]');
    expect(native.disabled).toBe(true);
  });

  it('applies the disabled modifier on the label', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    const label: HTMLLabelElement = fixture.nativeElement.querySelector('.cbx');
    expect(label.className).toContain('cbx--disabled');
  });

  // ── C7 ──
  it('applies the error modifier on the visual box when hasError is true', () => {
    fixture.componentRef.setInput('hasError', true);
    fixture.detectChanges();
    const box = fixture.nativeElement.querySelector('.cbx__box');
    expect(box.className).toContain('cbx__box--error');
  });

  it('sets aria-invalid when hasError is true', () => {
    fixture.componentRef.setInput('hasError', true);
    fixture.detectChanges();
    const native: HTMLInputElement = fixture.nativeElement.querySelector('input[type="checkbox"]');
    expect(native.getAttribute('aria-invalid')).toBe('true');
  });

  // ── C8 ──
  it('writeValue(true) renders the input as checked', () => {
    component.writeValue(true);
    fixture.detectChanges();
    const native: HTMLInputElement = fixture.nativeElement.querySelector('input[type="checkbox"]');
    expect(native.checked).toBe(true);
  });

  it('writeValue handles non-boolean truthy/falsy by coercing', () => {
    component.writeValue('yes' as unknown as boolean);
    expect(component['checked']()).toBe(true);
    component.writeValue(0 as unknown as boolean);
    expect(component['checked']()).toBe(false);
  });

  // ── id passthrough ──
  it('sets inputId on the native input', () => {
    fixture.componentRef.setInput('inputId', 'my-cbx');
    fixture.detectChanges();
    const native: HTMLInputElement = fixture.nativeElement.querySelector('input[type="checkbox"]');
    expect(native.id).toBe('my-cbx');
  });

  it('fires onTouched on blur', () => {
    const onTouched = jest.fn();
    component.registerOnTouched(onTouched);
    const native: HTMLInputElement = fixture.nativeElement.querySelector('input[type="checkbox"]');
    native.dispatchEvent(new Event('blur'));
    expect(onTouched).toHaveBeenCalled();
  });

  it('integrates with FormControl<boolean>', () => {
    const fc = new FormControl<boolean>(false, { nonNullable: true });
    component.writeValue(fc.value);
    component.registerOnChange((v: boolean) => fc.setValue(v));
    fixture.detectChanges();

    const native: HTMLInputElement = fixture.nativeElement.querySelector('input[type="checkbox"]');
    native.checked = true;
    native.dispatchEvent(new Event('change'));
    expect(fc.value).toBe(true);
  });
});
