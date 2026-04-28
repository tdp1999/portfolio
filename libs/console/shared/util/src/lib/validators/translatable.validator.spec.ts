import { FormControl, FormGroup } from '@angular/forms';
import { translatableRequiredValidator } from './translatable.validator';

describe('translatableRequiredValidator', () => {
  const build = (en: string, vi: string) =>
    new FormGroup(
      { en: new FormControl(en), vi: new FormControl(vi) },
      { validators: [translatableRequiredValidator()] }
    );

  it('accepts when both en and vi are non-empty', () => {
    expect(build('hello', 'xin chào').errors).toBeNull();
  });

  it('rejects when either locale is empty or whitespace', () => {
    expect(build('', 'xin chào').errors).toEqual({ translatableEnViRequired: true });
    expect(build('hello', '').errors).toEqual({ translatableEnViRequired: true });
    expect(build('   ', 'xin chào').errors).toEqual({ translatableEnViRequired: true });
  });

  it('returns null when controls are missing (defensive)', () => {
    const group = new FormGroup({ en: new FormControl('hello') }, { validators: [translatableRequiredValidator()] });
    expect(group.errors).toBeNull();
  });
});
