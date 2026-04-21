import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'translatable', standalone: true })
export class TranslatablePipe implements PipeTransform {
  transform(value: Record<string, string> | null | undefined): string {
    if (!value) return '—';
    return value['en'] || value['vi'] || '—';
  }
}
