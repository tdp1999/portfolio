import { Pipe, PipeTransform } from '@angular/core';
import { hostOf } from './radar-item.util';

@Pipe({ name: 'urlHost', standalone: true })
export class UrlHostPipe implements PipeTransform {
  transform(url: string): string {
    return hostOf(url);
  }
}
