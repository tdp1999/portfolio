import { Pipe, PipeTransform } from '@angular/core';

export function readableSize(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

@Pipe({ name: 'readableSize', standalone: true })
export class ReadableSizePipe implements PipeTransform {
  transform(bytes: number | null | undefined): string {
    return readableSize(bytes);
  }
}
