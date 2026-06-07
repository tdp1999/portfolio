import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'enumLabel', standalone: true })
export class EnumLabelPipe implements PipeTransform {
  transform(value: string | null | undefined, labels: Record<string, string>): string {
    if (value == null) return '';
    return labels[value] ?? value;
  }
}
