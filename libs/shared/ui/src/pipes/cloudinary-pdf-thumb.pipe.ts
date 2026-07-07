import { Pipe, PipeTransform, inject } from '@angular/core';
import { CLOUDINARY_UPLOAD_SEGMENT } from './cloudinary-thumb.pipe';

/**
 * Builds a raster preview of a PDF's first page from its Cloudinary URL. PDFs are
 * uploaded with `resource_type: image`, so Cloudinary can rasterize page 1 via the
 * `pg_1` transform when the asset is delivered with a raster extension — hence the
 * `.pdf` → `.jpg` swap. Returns '' for non-Cloudinary URLs (and Cloudinary returns
 * an error for non-rasterizable `raw` PDFs), so callers should fall back to an icon
 * on load error.
 */
@Pipe({ name: 'cloudinaryPdfThumb', standalone: true })
export class CloudinaryPdfThumbPipe implements PipeTransform {
  private readonly uploadSegment = inject(CLOUDINARY_UPLOAD_SEGMENT);

  transform(url: string | null | undefined, transform = 'pg_1,c_fill,g_north,w_320,h_320'): string {
    if (!url) return '';
    const idx = url.indexOf(this.uploadSegment);
    if (idx < 0) return '';
    const head = url.slice(0, idx + this.uploadSegment.length);
    const tail = url.slice(idx + this.uploadSegment.length).replace(/\.pdf(?=$|\?)/i, '.jpg');
    return `${head}${transform}/${tail}`;
  }
}
