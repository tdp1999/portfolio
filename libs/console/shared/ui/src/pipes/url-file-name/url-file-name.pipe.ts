import { Pipe, PipeTransform } from '@angular/core';

/** `url | urlFileName` — the last path segment without its query string, or the whole URL when that is empty. */
@Pipe({ name: 'urlFileName', standalone: true })
export class UrlFileNamePipe implements PipeTransform {
  transform(url: string): string {
    const segments = url.split('/');
    return segments[segments.length - 1].split('?')[0] || url;
  }
}
