import { InjectionToken, Pipe, PipeTransform, inject } from '@angular/core';

export const CLOUDINARY_UPLOAD_SEGMENT = new InjectionToken<string>('CLOUDINARY_UPLOAD_SEGMENT', {
  providedIn: 'root',
  factory: () => '/upload/',
});

@Pipe({ name: 'cloudinaryThumb', standalone: true })
export class CloudinaryThumbPipe implements PipeTransform {
  private readonly uploadSegment = inject(CLOUDINARY_UPLOAD_SEGMENT);

  transform(url: string | null | undefined, transform = 'c_thumb,w_160,h_160'): string {
    if (!url) return '';
    const idx = url.indexOf(this.uploadSegment);
    if (idx < 0) return url;
    const head = url.slice(0, idx + this.uploadSegment.length);
    const tail = url.slice(idx + this.uploadSegment.length);
    return `${head}${transform}/${tail}`;
  }
}
