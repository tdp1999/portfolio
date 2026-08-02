import { TestBed } from '@angular/core/testing';
import { MediaThumbPipe } from './media-thumb.pipe';

const CLOUDINARY = 'https://res.cloudinary.com/demo/image/upload/v1785/gallery-1.png';

describe('MediaThumbPipe', () => {
  let pipe: MediaThumbPipe;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [MediaThumbPipe] });
    pipe = TestBed.inject(MediaThumbPipe);
  });

  it('injects a retina-doubled c_limit transform for the rendered width', () => {
    expect(pipe.transform(CLOUDINARY, 64)).toBe(
      'https://res.cloudinary.com/demo/image/upload/c_limit,w_160,f_auto,q_auto/v1785/gallery-1.png'
    );
  });

  it('scales the transform with the slot, so a big slot is not served a thumbnail', () => {
    expect(pipe.transform(CLOUDINARY, 640)).toContain('w_1280');
  });

  // Local file storage and the seeded picsum links have no transform engine.
  it('passes a non-Cloudinary url through unchanged', () => {
    expect(pipe.transform('https://picsum.photos/seed/x/1200/800', 64)).toBe('https://picsum.photos/seed/x/1200/800');
  });

  it('returns an empty string for a missing url', () => {
    expect(pipe.transform(null, 64)).toBe('');
    expect(pipe.transform(undefined, 64)).toBe('');
  });
});
