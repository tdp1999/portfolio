import { Pipe, PipeTransform } from '@angular/core';
import { timeAgo } from '@portfolio/landing/shared/util';

/**
 * Relative publish time ("3 days ago" / "3 ngày trước") for a list row.
 *
 * Usage: `{{ post.publishedAt | timeAgo: locale() }}`
 */
@Pipe({ name: 'timeAgo', standalone: true })
export class TimeAgoPipe implements PipeTransform {
  transform(iso: string | null, locale: 'en' | 'vi'): string {
    return timeAgo(iso, locale);
  }
}
