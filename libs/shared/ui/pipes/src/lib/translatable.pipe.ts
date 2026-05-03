import { Pipe, PipeTransform } from '@angular/core';

interface TranslatableLike {
  en?: string;
  vi?: string;
}

/**
 * Translatable JSON resolver. Returns the requested locale's value with a fallback chain:
 * `locale` → `en` → `vi` → `—`. When `locale` is omitted, defaults to `en`.
 */
@Pipe({ name: 'translatable', standalone: true })
export class TranslatablePipe implements PipeTransform {
  transform(value: TranslatableLike | null | undefined, locale?: 'en' | 'vi'): string {
    if (!value) return '—';
    if (locale === 'vi') return value.vi || value.en || '—';
    return value.en || value.vi || '—';
  }
}
