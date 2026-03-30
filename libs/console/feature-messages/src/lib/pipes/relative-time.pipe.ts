import { Pipe, PipeTransform } from '@angular/core';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

@Pipe({ name: 'relativeTime', standalone: true })
export class RelativeTimePipe implements PipeTransform {
  transform(value: string | Date | null): string {
    if (!value) return '';

    const date = typeof value === 'string' ? new Date(value) : value;
    const now = Date.now();
    const diff = now - date.getTime();

    if (diff < MINUTE) return 'just now';
    if (diff < HOUR) return `${Math.floor(diff / MINUTE)}m ago`;
    if (diff < DAY) return `${Math.floor(diff / HOUR)}h ago`;
    if (diff < WEEK) return `${Math.floor(diff / DAY)}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}
