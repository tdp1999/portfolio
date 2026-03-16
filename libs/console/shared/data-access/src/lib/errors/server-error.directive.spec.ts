import { Component } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { ServerErrorDirective, SERVER_ERROR_FALLBACK, ServerErrorFallback } from './server-error.directive';
import { ValidationErrorService } from './validation-error.service';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, ServerErrorDirective],
  template: `
    <form [formGroup]="form" [serverErrorMap]="fieldMap">
      <input formControlName="password" />
      <input formControlName="email" />
    </form>
  `,
})
class TestHostComponent {
  form = new FormGroup({
    password: new FormControl(''),
    email: new FormControl(''),
  });
  fieldMap: Record<string, string> = {};
}

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, ServerErrorDirective],
  template: `
    <form [formGroup]="form" [serverErrorMap]="{ newPassword: 'password' }">
      <input formControlName="password" />
    </form>
  `,
})
class MappedHostComponent {
  form = new FormGroup({
    password: new FormControl(''),
  });
}

describe('ServerErrorDirective', () => {
  let validationService: ValidationErrorService;

  describe('without field mapping', () => {
    let fixture: ComponentFixture<TestHostComponent>;
    let component: TestHostComponent;

    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [TestHostComponent],
      });
      fixture = TestBed.createComponent(TestHostComponent);
      component = fixture.componentInstance;
      validationService = TestBed.inject(ValidationErrorService);
      fixture.detectChanges();
    });

    it('should set server errors on matching form controls', () => {
      validationService.push({ email: ['Email is invalid'] });
      fixture.detectChanges();

      expect(component.form.controls.email.getError('server')).toBe('Email is invalid');
      expect(component.form.controls.email.touched).toBe(true);
    });

    it('should ignore fields that do not match any control', () => {
      validationService.push({ unknownField: ['Some error'] });
      fixture.detectChanges();

      expect(component.form.controls.password.errors).toBeNull();
      expect(component.form.controls.email.errors).toBeNull();
    });

    it('should clear errors when service is cleared', () => {
      validationService.push({ email: ['Error'] });
      fixture.detectChanges();
      expect(component.form.controls.email.getError('server')).toBe('Error');

      validationService.clear();
      fixture.detectChanges();

      expect(validationService.fieldErrors()).toBeNull();
    });
  });

  describe('with field mapping', () => {
    let fixture: ComponentFixture<MappedHostComponent>;
    let component: MappedHostComponent;

    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [MappedHostComponent],
      });
      fixture = TestBed.createComponent(MappedHostComponent);
      component = fixture.componentInstance;
      validationService = TestBed.inject(ValidationErrorService);
      fixture.detectChanges();
    });

    it('should map API field names to form control names', () => {
      validationService.push({ newPassword: ['Password too weak'] });
      fixture.detectChanges();

      expect(component.form.controls.password.getError('server')).toBe('Password too weak');
      expect(component.form.controls.password.touched).toBe(true);
    });
  });

  describe('fallback for unmatched fields', () => {
    let fixture: ComponentFixture<TestHostComponent>;
    let fallbackSpy: jest.SpyInstance;
    let mockFallback: ServerErrorFallback;

    beforeEach(() => {
      mockFallback = { showError: jest.fn() };
      fallbackSpy = jest.spyOn(mockFallback, 'showError');

      TestBed.configureTestingModule({
        imports: [TestHostComponent],
        providers: [{ provide: SERVER_ERROR_FALLBACK, useValue: mockFallback }],
      });
      fixture = TestBed.createComponent(TestHostComponent);
      validationService = TestBed.inject(ValidationErrorService);
      fixture.detectChanges();
    });

    it('should call fallback for fields that do not match any control', () => {
      validationService.push({ unknownField: ['Invalid value'] });
      fixture.detectChanges();

      expect(fallbackSpy).toHaveBeenCalledWith('Invalid value');
    });

    it('should not call fallback when all fields match controls', () => {
      validationService.push({ email: ['Email is invalid'] });
      fixture.detectChanges();

      expect(fallbackSpy).not.toHaveBeenCalled();
    });

    it('should handle mix of matched and unmatched fields', () => {
      validationService.push({
        email: ['Email is invalid'],
        unknownField: ['Bad value'],
      });
      fixture.detectChanges();

      expect(fixture.componentInstance.form.controls.email.getError('server')).toBe('Email is invalid');
      expect(fallbackSpy).toHaveBeenCalledWith('Bad value');
    });
  });

  describe('cleanup on destroy', () => {
    let fixture: ComponentFixture<TestHostComponent>;

    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [TestHostComponent],
      });
      fixture = TestBed.createComponent(TestHostComponent);
      validationService = TestBed.inject(ValidationErrorService);
      fixture.detectChanges();
    });

    it('should clear validation errors when directive is destroyed', () => {
      validationService.push({ email: ['Error'] });
      fixture.detectChanges();

      fixture.destroy();

      expect(validationService.fieldErrors()).toBeNull();
    });

    it('should handle double destroy gracefully', () => {
      validationService.push({ email: ['Error'] });
      fixture.detectChanges();

      fixture.destroy();
      expect(validationService.fieldErrors()).toBeNull();

      // Simulating re-push after destroy should not throw
      validationService.push({ email: ['New error'] });
      expect(validationService.fieldErrors()).toEqual({ email: ['New error'] });
    });
  });
});
