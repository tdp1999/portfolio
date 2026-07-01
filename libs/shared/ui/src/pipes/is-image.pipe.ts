import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'isImage', standalone: true })
export class IsImagePipe implements PipeTransform {
  transform(mimeType: string | null | undefined): boolean {
    return !!mimeType && mimeType.startsWith('image/');
  }
}
