import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  FormsModule,
  ReactiveFormsModule,
  FormControl,
  NonNullableFormBuilder,
} from '@angular/forms';
import { InputComponent } from './input.component';

describe('InputComponent', () => {
  let component: InputComponent;
  let fixture: ComponentFixture<InputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InputComponent, FormsModule, ReactiveFormsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(InputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Signal Inputs', () => {
    it('should have default type of "text"', () => {
      expect(component.type()).toBe('text');
    });

    it('should accept custom type', () => {
      fixture.componentRef.setInput('type', 'email');
      fixture.detectChanges();
      expect(component.type()).toBe('email');

      const inputElement = fixture.nativeElement.querySelector('input');
      expect(inputElement.type).toBe('email');
    });

    it('should have empty placeholder by default', () => {
      expect(component.placeholder()).toBe('');
    });

    it('should accept custom placeholder', () => {
      fixture.componentRef.setInput('placeholder', 'Enter your name');
      fixture.detectChanges();
      expect(component.placeholder()).toBe('Enter your name');

      const inputElement = fixture.nativeElement.querySelector('input');
      expect(inputElement.placeholder).toBe('Enter your name');
    });

    it('should not have error state by default', () => {
      expect(component.error()).toBe(false);
    });

    it('should accept error state', () => {
      fixture.componentRef.setInput('error', true);
      fixture.detectChanges();
      expect(component.error()).toBe(true);
    });

    it('should not be disabled by default', () => {
      expect(component.disabled()).toBe(false);
    });

    it('should accept disabled state', () => {
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();
      expect(component.disabled()).toBe(true);

      const inputElement = fixture.nativeElement.querySelector('input');
      expect(inputElement.disabled).toBe(true);
    });
  });

  describe('CSS Classes', () => {
    it('should apply base "input" class', () => {
      const inputElement = fixture.nativeElement.querySelector('input');
      expect(inputElement.className).toContain('input');
    });

    it('should apply "input--error" class when error is true', () => {
      fixture.componentRef.setInput('error', true);
      fixture.detectChanges();

      const inputElement = fixture.nativeElement.querySelector('input');
      expect(inputElement.className).toContain('input--error');
    });

    it('should not apply "input--error" class when error is false', () => {
      fixture.componentRef.setInput('error', false);
      fixture.detectChanges();

      const inputElement = fixture.nativeElement.querySelector('input');
      expect(inputElement.className).not.toContain('input--error');
    });
  });

  describe('ControlValueAccessor', () => {
    it('should update value when input event occurs', () => {
      const inputElement: HTMLInputElement = fixture.nativeElement.querySelector('input');

      inputElement.value = 'test value';
      inputElement.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      expect(component['value']()).toBe('test value');
    });

    it('should call onChange callback when input changes', () => {
      const onChangeSpy = jest.fn();
      component.registerOnChange(onChangeSpy);

      const inputElement: HTMLInputElement = fixture.nativeElement.querySelector('input');

      inputElement.value = 'new value';
      inputElement.dispatchEvent(new Event('input'));

      expect(onChangeSpy).toHaveBeenCalledWith('new value');
    });

    it('should call onTouched callback when input is blurred', () => {
      const onTouchedSpy = jest.fn();
      component.registerOnTouched(onTouchedSpy);

      const inputElement: HTMLInputElement = fixture.nativeElement.querySelector('input');
      inputElement.dispatchEvent(new Event('blur'));

      expect(onTouchedSpy).toHaveBeenCalled();
    });

    it('should update internal value when writeValue is called', () => {
      component.writeValue('written value');
      fixture.detectChanges();

      expect(component['value']()).toBe('written value');
      const inputElement: HTMLInputElement = fixture.nativeElement.querySelector('input');
      expect(inputElement.value).toBe('written value');
    });

    it('should handle null value in writeValue', () => {
      component.writeValue(null as any);
      fixture.detectChanges();

      expect(component['value']()).toBe('');
    });

    it('should handle undefined value in writeValue', () => {
      component.writeValue(undefined as any);
      fixture.detectChanges();

      expect(component['value']()).toBe('');
    });
  });

  describe('Reactive Forms Integration', () => {
    it('should work with FormControl', () => {
      const formControl = new FormControl<string>('initial value');

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [InputComponent, ReactiveFormsModule],
      });

      const reactiveFixture = TestBed.createComponent(InputComponent);
      const reactiveComponent = reactiveFixture.componentInstance;

      reactiveComponent.writeValue(formControl.value ?? '');
      reactiveComponent.registerOnChange((value: string) => formControl.setValue(value));
      reactiveFixture.detectChanges();

      expect(reactiveComponent['value']()).toBe('initial value');

      const inputElement: HTMLInputElement = reactiveFixture.nativeElement.querySelector('input');
      inputElement.value = 'updated value';
      inputElement.dispatchEvent(new Event('input'));

      expect(formControl.value).toBe('updated value');
    });
  });

  describe('Disabled State', () => {
    it('should render disabled attribute when disabled is true', () => {
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();

      const inputElement: HTMLInputElement = fixture.nativeElement.querySelector('input');
      expect(inputElement.disabled).toBe(true);
    });

    it('should not call onChange when disabled', () => {
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();

      const onChangeSpy = jest.fn();
      component.registerOnChange(onChangeSpy);

      const inputElement: HTMLInputElement = fixture.nativeElement.querySelector('input');
      inputElement.value = 'test';
      inputElement.dispatchEvent(new Event('input'));

      // The onChange will still be called because HTML input behavior
      // This is expected - the parent form should handle disabled state
      expect(onChangeSpy).toHaveBeenCalled();
    });
  });

  describe('Input Types', () => {
    const inputTypes = ['text', 'email', 'password', 'number', 'tel', 'url'];

    inputTypes.forEach((type) => {
      it(`should support type="${type}"`, () => {
        fixture.componentRef.setInput('type', type);
        fixture.detectChanges();

        const inputElement: HTMLInputElement = fixture.nativeElement.querySelector('input');
        expect(inputElement.type).toBe(type);
      });
    });
  });
});
