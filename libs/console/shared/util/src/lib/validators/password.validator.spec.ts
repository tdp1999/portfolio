import { FormControl } from '@angular/forms';
import { passwordValidator } from './password.validator';

describe('passwordValidator', () => {
  const validate = (value: unknown) => passwordValidator()(new FormControl(value));

  it('treats empty values as valid', () => {
    expect(validate(null)).toBeNull();
    expect(validate('')).toBeNull();
  });

  it('rejects passwords missing required character classes', () => {
    expect(validate('password')).toEqual({ passwordWeak: true });
    expect(validate('Password1')).toEqual({ passwordWeak: true });
    expect(validate('password1!')).toEqual({ passwordWeak: true });
    expect(validate('Pass1!')).toEqual({ passwordWeak: true });
  });

  it('accepts strong passwords matching BE PASSWORD_REGEX', () => {
    expect(validate('Password1!')).toBeNull();
    expect(validate('Aa1#aaaa')).toBeNull();
  });
});
