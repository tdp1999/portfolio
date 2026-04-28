import { FormControl } from '@angular/forms';
import { integerValidator } from './integer.validator';

describe('integerValidator', () => {
  const validate = (value: unknown) => integerValidator()(new FormControl(value));

  it('treats empty values as valid', () => {
    expect(validate(null)).toBeNull();
    expect(validate(undefined)).toBeNull();
    expect(validate('')).toBeNull();
  });

  it('accepts integers as numbers or numeric strings', () => {
    expect(validate(0)).toBeNull();
    expect(validate(5)).toBeNull();
    expect(validate(-3)).toBeNull();
    expect(validate('42')).toBeNull();
  });

  it('rejects decimals', () => {
    expect(validate(5.5)).toEqual({ integerOnly: true });
    expect(validate('5.5')).toEqual({ integerOnly: true });
    expect(validate(0.1)).toEqual({ integerOnly: true });
  });

  it('rejects non-numeric strings', () => {
    expect(validate('abc')).toEqual({ integerOnly: true });
  });
});
