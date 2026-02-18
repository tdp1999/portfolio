import { BadRequestError, ErrorLayer } from '@portfolio/shared/errors';

export class SlugValue {
  static from(text: string): string {
    if (!text.trim()) {
      throw BadRequestError('Cannot create slug from empty text', { layer: ErrorLayer.DOMAIN });
    }

    const slug = text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    if (!slug) {
      throw BadRequestError('Cannot create slug from empty text', { layer: ErrorLayer.DOMAIN });
    }

    return slug;
  }
}
