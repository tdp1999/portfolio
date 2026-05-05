import { Pipe, PipeTransform } from '@angular/core';

interface TranslatableLike {
  en?: string;
  vi?: string;
}

/**
 * Translatable JSON resolver. Returns the requested locale's value with a fallback chain:
 * `locale` → `en` → `vi` → `emptyFallback` (default `—`). When `locale` is omitted, defaults to `en`.
 * Pass `''` as `emptyFallback` when consumers need a falsy value for `@if` guards.
 */
@Pipe({ name: 'translatable', standalone: true })
export class TranslatablePipe implements PipeTransform {
  transform(value: TranslatableLike | null | undefined, locale?: 'en' | 'vi', emptyFallback = '—'): string {
    if (!value) return emptyFallback;
    if (locale === 'vi') return value.vi || value.en || emptyFallback;
    return value.en || value.vi || emptyFallback;
  }
}
