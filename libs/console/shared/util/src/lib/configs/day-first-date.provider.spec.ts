import { TestBed } from '@angular/core/testing';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { DayFirstDateProvider } from './day-first-date.provider';

describe('DayFirstDateProvider.parse', () => {
  let adapter: DayFirstDateProvider;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DayFirstDateProvider, { provide: MAT_DATE_LOCALE, useValue: 'en-GB' }],
    });
    adapter = TestBed.inject(DayFirstDateProvider);
  });

  it('reads typed text day first', () => {
    const date = adapter.parse('07/09/2026') as Date;
    expect([date.getDate(), date.getMonth(), date.getFullYear()]).toEqual([7, 8, 2026]);
  });

  it('refuses a day that does not exist instead of rolling over', () => {
    expect(adapter.isValid(adapter.parse('31/02/2026') as Date)).toBe(false);
  });

  it('falls back to the native parse for other shapes', () => {
    expect(adapter.parse('2026-09-07')?.getFullYear()).toBe(2026);
  });
});
