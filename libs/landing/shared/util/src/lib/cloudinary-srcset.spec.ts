import { buildCloudinarySrcset } from './cloudinary-srcset';

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
