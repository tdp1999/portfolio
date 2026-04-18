import { FormControl, FormGroup, Validators } from '@angular/forms';
import { FormErrorPipe } from './form-error.pipe';

describe('FormErrorPipe', () => {
  let pipe: FormErrorPipe;

  beforeEach(() => {
    pipe = new FormErrorPipe();
  });

  it('should return empty string for null control', () => {
    expect(pipe.transform(null)).toBe('');
  });

  it('should return empty string for valid control', () => {
    const control = new FormControl('hello', Validators.required);
    expect(pipe.transform(control)).toBe('');
  });

  it('should return default required message', () => {
    const control = new FormControl('', Validators.required);
    control.markAsTouched();
    expect(pipe.transform(control)).toBe('This field is required.');
  });

  it('should return default email message', () => {
    const control = new FormControl('bad', Validators.email);
    control.markAsTouched();
    expect(pipe.transform(control)).toBe('Enter a valid email address (e.g., name@example.com).');
  });

  it('should return default minlength message with dynamic value', () => {
    const control = new FormControl('ab', Validators.minLength(8));
    control.markAsTouched();
    expect(pipe.transform(control)).toBe('Must be at least 8 characters.');
  });

  it('should return default maxlength message with dynamic value', () => {
    const control = new FormControl('a'.repeat(60), Validators.maxLength(50));
    control.markAsTouched();
    expect(pipe.transform(control)).toBe('Must be 50 characters or less.');
  });

  it('should use custom message when provided', () => {
    const control = new FormControl('', Validators.required);
    control.markAsTouched();
    expect(pipe.transform(control, { required: 'Email is required.' })).toBe('Email is required.');
  });

  it('should resolve server error from string value', () => {
    const control = new FormControl('');
    control.setErrors({ server: 'Name already taken' });
    expect(pipe.transform(control)).toBe('Name already taken');
  });

  it('should resolve first error when multiple exist', () => {
    const control = new FormControl('', [Validators.required, Validators.email]);
    control.markAsTouched();
    // `required` comes first in the error object
    expect(pipe.transform(control)).toBe('This field is required.');
  });

  it('should resolve group-level errors via parentGroup', () => {
    const group = new FormGroup({
      password: new FormControl('abc'),
      confirm: new FormControl('xyz'),
    });
    group.setErrors({ passwordsMismatch: true });

    const confirmControl = group.controls['confirm'];
    expect(pipe.transform(confirmControl, { passwordsMismatch: 'Passwords do not match.' }, group)).toBe(
      'Passwords do not match.'
    );
  });

  it('should return fallback for unknown error key', () => {
    const control = new FormControl('');
    control.setErrors({ customUnknown: true });
    expect(pipe.transform(control)).toBe('Invalid value.');
  });
});
