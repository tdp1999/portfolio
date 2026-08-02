import { mediaThumbTransform, resolveMediaAlt, resolveMediaLabel } from './media-preview.util';

describe('resolveMediaLabel', () => {
  it('prefers the caption', () => {
    expect(resolveMediaLabel({ caption: 'Builder + table', filename: 'shot.png', altText: 'A table' })).toBe(
      'Builder + table'
    );
  });

  it('falls back to the filename when there is no caption', () => {
    expect(resolveMediaLabel({ caption: null, filename: 'shot.png', altText: 'A table' })).toBe('shot.png');
  });

  it('falls back to the alt text only when caption and filename are both absent', () => {
    expect(resolveMediaLabel({ caption: null, filename: null, altText: 'A table' })).toBe('A table');
  });

  // The bug this component exists to kill: project detail read `altText || 'Untitled'`,
  // so an asset with a filename but no alt text printed "Untitled".
  it('names an asset that has a filename but no alt text', () => {
    expect(resolveMediaLabel({ caption: null, filename: 'gallery-1.builder.png', altText: null })).toBe(
      'gallery-1.builder.png'
    );
  });

  it('treats blank and whitespace-only values as absent', () => {
    expect(resolveMediaLabel({ caption: '', filename: '   ', altText: 'A table' })).toBe('A table');
  });

  it('returns Untitled only when nothing at all is set', () => {
    expect(resolveMediaLabel({ caption: null, filename: null, altText: null })).toBe('Untitled');
  });
});

describe('resolveMediaAlt', () => {
  it('prefers real alt text', () => {
    expect(resolveMediaAlt({ caption: 'Cap', filename: 'f.png', altText: 'Alt' })).toBe('Alt');
  });

  it('borrows the caption, then the filename, so the image is not silent', () => {
    expect(resolveMediaAlt({ caption: 'Cap', filename: 'f.png', altText: null })).toBe('Cap');
    expect(resolveMediaAlt({ caption: null, filename: 'f.png', altText: null })).toBe('f.png');
  });

  // "Untitled" is a UI placeholder, not a description — announcing it helps nobody.
  it('returns an empty string rather than the Untitled placeholder', () => {
    expect(resolveMediaAlt({ caption: null, filename: null, altText: null })).toBe('');
  });
});

describe('mediaThumbTransform', () => {
  it('asks for twice the CSS width so a retina screen stays sharp', () => {
    expect(mediaThumbTransform(160)).toBe('c_limit,w_320,f_auto,q_auto');
  });

  it('rounds up to a 160px step so distinct tile sizes share derived assets', () => {
    expect(mediaThumbTransform(100)).toBe('c_limit,w_320,f_auto,q_auto');
    expect(mediaThumbTransform(230)).toBe('c_limit,w_480,f_auto,q_auto');
  });

  it('never asks for less than one step, however small the tile', () => {
    expect(mediaThumbTransform(24)).toBe('c_limit,w_160,f_auto,q_auto');
  });

  // c_limit shrinks but never upscales, so a small source is served untouched.
  it('uses c_limit, which cannot upscale a small source', () => {
    expect(mediaThumbTransform(320)).toContain('c_limit');
  });
});
