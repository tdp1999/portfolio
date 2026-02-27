import { Provider } from '@angular/core';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS, MatFormFieldDefaultOptions } from '@angular/material/form-field';
import { MAT_PAGINATOR_DEFAULT_OPTIONS, MatPaginatorDefaultOptions } from '@angular/material/paginator';

// MatFormField
const formFieldDefault: MatFormFieldDefaultOptions = {
  appearance: 'outline',
  subscriptSizing: 'dynamic',
  floatLabel: 'always',
};

// Paginator
const paginatorDefault: MatPaginatorDefaultOptions = {
  pageSizeOptions: [20, 50, 100],
  pageSize: 20,
};

export const THIRD_PARTY_PROVIDER: Provider[] = [
  {
    provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
    useValue: formFieldDefault,
  },
  {
    provide: MAT_PAGINATOR_DEFAULT_OPTIONS,
    useValue: paginatorDefault,
  },
];
