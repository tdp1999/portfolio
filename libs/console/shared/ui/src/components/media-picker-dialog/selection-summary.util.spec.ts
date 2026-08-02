import type { MediaItem } from '@portfolio/console/shared/util';
import { formatMediaMeta } from './selection-summary.util';

function makeItem(overrides: Partial<MediaItem> = {}): MediaItem {
  return {
    id: 'a',
    originalFilename: 'shot.png',
    mimeType: 'image/png',
    url: 'https://cdn.example.com/shot.png',
    format: 'png',
    bytes: 250_880,
    width: 1200,
    height: 800,
    altText: null,
    caption: null,
    folder: 'general',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('formatMediaMeta', () => {
  it('reads type, size and dimensions off an image', () => {
    expect(formatMediaMeta(makeItem())).toBe('PNG · 245.0 KB · 1200×800');
  });

  it('strips the structured-syntax suffix from a compound mime type', () => {
    expect(formatMediaMeta(makeItem({ mimeType: 'image/svg+xml' }))).toContain('XML');
    expect(formatMediaMeta(makeItem({ mimeType: 'image/svg+xml' })).startsWith('XML')).toBe(true);
  });

  it('omits dimensions for a non-raster asset', () => {
    const meta = formatMediaMeta(
      makeItem({ mimeType: 'application/pdf', bytes: 1024, width: null, height: null, originalFilename: 'cv.pdf' })
    );
    expect(meta).toBe('PDF · 1.0 KB');
  });
});
