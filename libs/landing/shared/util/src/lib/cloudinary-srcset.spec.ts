import { buildCloudinarySrcset, buildCloudinaryWidthSet } from './cloudinary-srcset';

describe('buildCloudinarySrcset', () => {
  it('returns empty src/srcset for null/empty input', () => {
    expect(buildCloudinarySrcset(null, 960)).toEqual({ src: '', srcset: '' });
    expect(buildCloudinarySrcset('', 960)).toEqual({ src: '', srcset: '' });
  });

  it('passes through non-Cloudinary URLs unchanged with empty srcset', () => {
    const url = 'https://example.com/img.png';
    expect(buildCloudinarySrcset(url, 800)).toEqual({ src: url, srcset: '' });
  });

  it('injects f_auto,q_auto,w_{width},c_limit transforms for a Cloudinary URL', () => {
    const url = 'https://res.cloudinary.com/demo/image/upload/v1700000000/portfolio/projects/abc.png';
    const result = buildCloudinarySrcset(url, 960);
    expect(result.src).toBe(
      'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_960,c_limit/v1700000000/portfolio/projects/abc.png'
    );
    expect(result.srcset).toBe(
      'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_960,c_limit/v1700000000/portfolio/projects/abc.png 1x, ' +
        'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_1920,c_limit/v1700000000/portfolio/projects/abc.png 2x'
    );
  });

  it('layers on top of an existing transform segment', () => {
    const url = 'https://res.cloudinary.com/demo/image/upload/c_fill,w_200/portfolio/projects/abc.png';
    const result = buildCloudinarySrcset(url, 400);
    expect(result.src).toContain('/upload/f_auto,q_auto,w_400,c_limit/c_fill,w_200/portfolio/projects/abc.png');
    expect(result.srcset).toContain('w_800,c_limit/c_fill');
  });

  it('rounds non-integer widths', () => {
    const url = 'https://res.cloudinary.com/demo/image/upload/v1/abc.png';
    const result = buildCloudinarySrcset(url, 720.6);
    expect(result.src).toContain('w_721,c_limit');
  });
});

describe('buildCloudinaryWidthSet — ladder boundaries', () => {
  const URL = 'https://res.cloudinary.com/demo/image/upload/v1/abc.png';

  /** Pull the `w` descriptors out of a srcset. Anchored on the space before the
   *  descriptor, since the Cloudinary transform segment itself contains commas. */
  const rungs = (srcset: string): number[] => [...srcset.matchAll(/ (\d+)w/g)].map((m) => Number(m[1]));

  // 2-value BVA over the eight partition cuts (rung / 2.5), step 0.1.
  const CASES: readonly (readonly [number, readonly number[]])[] = [
    [127.9, [320]],
    [128, [320]],
    [191.9, [320]],
    [192, [320, 480]],
    [255.9, [320, 480]],
    [256, [320, 480, 640]],
    [307.1, [320, 480, 640]],
    [307.2, [320, 480, 640, 768]],
    [383.9, [320, 480, 640, 768]],
    [384, [320, 480, 640, 768, 960]],
    [511.9, [320, 480, 640, 768, 960]],
    [512, [320, 480, 640, 768, 960, 1280]],
    [639.9, [320, 480, 640, 768, 960, 1280]],
    [640, [320, 480, 640, 768, 960, 1280, 1600]],
    [767.9, [320, 480, 640, 768, 960, 1280, 1600]],
    [768, [320, 480, 640, 768, 960, 1280, 1600, 1920]],
  ];

  it.each(CASES)('maxCssWidth %p keeps rungs %p', (maxCssWidth, expected) => {
    expect(rungs(buildCloudinaryWidthSet(URL, maxCssWidth).srcset)).toEqual(expected);
  });
});
