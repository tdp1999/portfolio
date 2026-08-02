import { buildCloudinaryWidthSet } from '@portfolio/landing/shared/util';
import { cellSizing } from './gallery.sizing';

const URL = 'https://res.cloudinary.com/demo/image/upload/v1785661649/gallery-1.png';

describe('cellSizing', () => {
  it('gives a lone image the full gallery width', () => {
    expect(cellSizing(1, 0).maxCss).toBe(700);
  });

  it('gives every cell of a 2- or 4-up grid half the gallery', () => {
    expect(cellSizing(2, 0).maxCss).toBe(340);
    expect(cellSizing(4, 3).maxCss).toBe(340);
  });

  it('promotes only the first cell of a 3-up layout, matching the 3fr/2fr grid', () => {
    expect(cellSizing(3, 0).maxCss).toBe(410);
    expect(cellSizing(3, 1).maxCss).toBe(280);
    expect(cellSizing(3, 2).maxCss).toBe(280);
  });

  it('falls back to the full viewport below laptop, where the grid collapses', () => {
    for (const count of [1, 2, 3, 4] as const) {
      expect(cellSizing(count, 0).sizes.endsWith('100vw')).toBe(true);
    }
  });
});

// The regression this file exists for: a 333px cell was being served w_1440.
describe('gallery cell srcset', () => {
  it('caps the 4-up ladder well below the old flat 1440px variant', () => {
    const { srcset } = buildCloudinaryWidthSet(URL, cellSizing(4, 0).maxCss);
    const widths = [...srcset.matchAll(/ (\d+)w/g)].map((m) => Number(m[1]));

    expect(Math.max(...widths)).toBe(768);
    expect(widths).toEqual([320, 480, 640, 768]);
  });

  it('offers a retina rung above the measured 333px cell', () => {
    const { srcset } = buildCloudinaryWidthSet(URL, cellSizing(4, 0).maxCss);
    const widths = [...srcset.matchAll(/ (\d+)w/g)].map((m) => Number(m[1]));

    expect(widths.some((w) => w >= 333 * 2)).toBe(true);
  });

  it('points the no-srcset fallback at the smallest rung, not the largest', () => {
    const { src } = buildCloudinaryWidthSet(URL, cellSizing(4, 0).maxCss);
    expect(src).toContain('w_320');
  });

  it('leaves a non-Cloudinary url without a srcset instead of mangling it', () => {
    expect(buildCloudinaryWidthSet('https://picsum.photos/seed/x/1200/800', 340)).toEqual({
      src: 'https://picsum.photos/seed/x/1200/800',
      srcset: '',
    });
  });
});
