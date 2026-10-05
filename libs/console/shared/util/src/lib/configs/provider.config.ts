import { Provider } from '@angular/core';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS, MatFormFieldDefaultOptions } from '@angular/material/form-field';
import { provideNativeDateAdapter } from '@angular/material/core';

// MatFormField
const formFieldDefault: MatFormFieldDefaultOptions = {
  appearance: 'outline',
  subscriptSizing: 'dynamic',
  floatLabel: 'always',
};

export const THIRD_PARTY_PROVIDER: Provider[] = [
  {
    provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
    useValue: formFieldDefault,
  },
  ...provideNativeDateAdapter(),
];
