import { Provider } from '@angular/core';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS, MatFormFieldDefaultOptions } from '@angular/material/form-field';
import { MAT_PAGINATOR_DEFAULT_OPTIONS, MatPaginatorDefaultOptions } from '@angular/material/paginator';
import { provideNativeDateAdapter } from '@angular/material/core';
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '../constants';

// MatFormField
const formFieldDefault: MatFormFieldDefaultOptions = {
  appearance: 'outline',
  subscriptSizing: 'dynamic',
  floatLabel: 'always',
};

// Paginator
const paginatorDefault: MatPaginatorDefaultOptions = {
  pageSizeOptions: PAGE_SIZE_OPTIONS,
  pageSize: DEFAULT_PAGE_SIZE,
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
  ...provideNativeDateAdapter(),
];
