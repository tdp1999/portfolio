import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'mimeCategory', standalone: true })
export class MimeCategoryPipe implements PipeTransform {
  transform(mimeType: string | null | undefined): string {
    if (!mimeType) return 'File';
    if (mimeType.startsWith('image/')) return 'Image';
    if (mimeType.startsWith('video/')) return 'Video';
    if (mimeType === 'application/pdf') return 'PDF';
    if (mimeType === 'application/zip') return 'Archive';
    if (mimeType.startsWith('text/')) return 'Text';
    if (mimeType.includes('document') || mimeType.includes('sheet')) return 'Document';
    return 'File';
  }
}
