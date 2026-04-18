import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'fileIcon', standalone: true })
export class FileIconPipe implements PipeTransform {
  transform(mimeType: string | null | undefined): string {
    if (!mimeType) return 'description';
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'movie';
    if (mimeType === 'application/pdf') return 'picture_as_pdf';
    if (mimeType === 'application/zip') return 'folder_zip';
    return 'description';
  }
}
