import { FormControl } from '@angular/forms';
import { urlValidator } from './url.validator';

describe('urlValidator', () => {
  const validate = (value: unknown) => urlValidator()(new FormControl(value));

  it('treats empty values as valid (compose with required)', () => {
    expect(validate(null)).toBeNull();
    expect(validate(undefined)).toBeNull();
    expect(validate('')).toBeNull();
  });

  it('accepts http(s) URLs', () => {
    expect(validate('https://example.com')).toBeNull();
    expect(validate('http://localhost:3000/path?q=1')).toBeNull();
  });

  it('rejects non-URLs', () => {
    expect(validate('example.com')).toEqual({ urlInvalid: true });
    expect(validate('ftp://example.com')).toEqual({ urlInvalid: true });
    expect(validate('not a url')).toEqual({ urlInvalid: true });
  });

  it('rejects non-string values', () => {
    expect(validate(123)).toEqual({ urlInvalid: true });
  });
});
