import { Pipe, PipeTransform } from '@angular/core';

/**
 * Formats a date to "Mon YYYY" (e.g. "Jan 2024"). Returns empty string for null/undefined input.
 */
@Pipe({ name: 'monthYear', standalone: true })
export class MonthYearPipe implements PipeTransform {
  transform(value: string | Date | null | undefined): string {
    if (!value) return '';
    const date = value instanceof Date ? value : new Date(value);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }
}
