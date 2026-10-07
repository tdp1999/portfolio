import { Injectable } from '@angular/core';
import { NativeDateAdapter } from '@angular/material/core';

/**
 * The native adapter shows dates in the locale's order but parses typed text with `Date.parse`,
 * which always reads `07/09/2026` as July 9. This one reads a typed `d/m/yyyy` (also `-` or `.`)
 * day first, so what the Owner types matches what the field shows. Anything else, such as the
 * month-year picker's `mm/yyyy`, falls back to the native parse.
 */
@Injectable()
export class DayFirstDateProvider extends NativeDateAdapter {
  override parse(value: unknown, parseFormat?: unknown): Date | null {
    if (typeof value === 'string') {
      const m = /^\s*(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})\s*$/.exec(value);
      if (m) {
        const [day, month, year] = [Number(m[1]), Number(m[2]) - 1, Number(m[3])];
        const date = new Date(year, month, day);
        // 31/02/2026 would roll over to March: refuse it instead.
        return date.getDate() === day && date.getMonth() === month ? date : this.invalid();
      }
    }
    return super.parse(value, parseFormat);
  }
}
