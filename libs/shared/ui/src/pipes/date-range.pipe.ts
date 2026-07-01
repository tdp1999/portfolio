import { Pipe, PipeTransform } from '@angular/core';

export interface DateRangeInput {
  startDate: string | Date | null | undefined;
  endDate: string | Date | null | undefined;
}

@Pipe({ name: 'dateRange', standalone: true })
export class DateRangePipe implements PipeTransform {
  transform(input: DateRangeInput | null | undefined, ongoingLabel = 'Present'): string {
    if (!input?.startDate) return '';
    const start = formatMonth(input.startDate);
    const end = input.endDate ? formatMonth(input.endDate) : ongoingLabel;
    return `${start} – ${end}`;
  }
}

function formatMonth(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}
