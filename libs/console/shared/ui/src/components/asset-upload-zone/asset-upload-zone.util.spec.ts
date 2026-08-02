import { matchesAccept, toAcceptAttr } from './asset-upload-zone.util';

const file = (name: string, type: string) => new File(['x'], name, { type });

describe('toAcceptAttr', () => {
  it('rewrites the media API mime-prefix dialect into the HTML dialect', () => {
    // Regression: consumers pass `image/` (also used as MediaListParams.mimeTypePrefix).
    // Forwarded verbatim, the native file dialog matches nothing.
    expect(toAcceptAttr('image/')).toBe('image/*');
  });

  it('keeps explicit mime lists intact', () => {
    expect(toAcceptAttr('image/svg+xml, image/png, image/webp')).toBe('image/svg+xml,image/png,image/webp');
    expect(toAcceptAttr('application/pdf')).toBe('application/pdf');
  });

  it('collapses any-type dialects to */*', () => {
    expect(toAcceptAttr('*/*')).toBe('*/*');
    expect(toAcceptAttr('*')).toBe('*/*');
    expect(toAcceptAttr('')).toBe('*/*');
  });
});

describe('matchesAccept', () => {
  it('accepts every image for the `image/` prefix dialect', () => {
    // Regression: `image/` was compared with `===` against file.type, so no image
    // could ever be uploaded from the picker.
    expect(matchesAccept(file('shot.png', 'image/png'), 'image/')).toBe(true);
    expect(matchesAccept(file('logo.svg', 'image/svg+xml'), 'image/')).toBe(true);
    expect(matchesAccept(file('doc.pdf', 'application/pdf'), 'image/')).toBe(false);
  });

  it('accepts every image for the `image/*` wildcard dialect', () => {
    expect(matchesAccept(file('shot.png', 'image/png'), 'image/*')).toBe(true);
    expect(matchesAccept(file('doc.pdf', 'application/pdf'), 'image/*')).toBe(false);
  });

  it('matches an exact mime type', () => {
    expect(matchesAccept(file('cv.pdf', 'application/pdf'), 'application/pdf')).toBe(true);
    expect(matchesAccept(file('shot.png', 'image/png'), 'application/pdf')).toBe(false);
  });

  it('matches any entry of a comma-separated list', () => {
    const accept = 'image/svg+xml, image/png, image/webp';
    expect(matchesAccept(file('logo.svg', 'image/svg+xml'), accept)).toBe(true);
    expect(matchesAccept(file('shot.webp', 'image/webp'), accept)).toBe(true);
    expect(matchesAccept(file('photo.jpg', 'image/jpeg'), accept)).toBe(false);
  });

  it('falls back to the extension when the browser reports no mime type', () => {
    expect(matchesAccept(file('logo.svg', ''), '.svg')).toBe(true);
    expect(matchesAccept(file('logo.png', ''), '.svg')).toBe(false);
  });

  it('is case-insensitive on both the pattern and the file', () => {
    expect(matchesAccept(file('SHOT.PNG', 'IMAGE/PNG'), 'image/')).toBe(true);
    expect(matchesAccept(file('shot.png', 'image/png'), 'IMAGE/*')).toBe(true);
  });

  it('accepts anything for the any-type dialects', () => {
    for (const accept of ['*/*', '*', '']) {
      expect(matchesAccept(file('anything.bin', 'application/octet-stream'), accept)).toBe(true);
    }
  });
});
