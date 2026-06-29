import type { MediaRefMap } from '@portfolio/shared/features/rte-core/image-refs';
import { hydrateImageRefs } from './hydrate-image-refs';

const CLOUDINARY = 'https://res.cloudinary.com/demo/image/upload/v1/pic1.png';

const MAP: MediaRefMap = {
  pic1: { url: CLOUDINARY, alt: 'First', width: 800, height: 600 },
  plain: { url: 'https://example.com/n.png', alt: '', width: null, height: null },
};

const figure = (id: string, caption = '', posAttr = ''): string =>
  `<figure data-block="image-ref" data-image-id="${id}"${posAttr}>${caption ? `<figcaption>${caption}</figcaption>` : ''}</figure>`;

describe('hydrateImageRefs', () => {
  it('returns the html untouched when the map is nullish (no resolution attempted)', () => {
    const html = figure('pic1');
    expect(hydrateImageRefs(html, null)).toBe(html);
    expect(hydrateImageRefs(html, undefined)).toBe(html);
  });

  it('renders the broken-media fallback for an unresolved id when a (possibly empty) map is given', () => {
    const out = hydrateImageRefs(figure('pic1'), {});
    expect(out).toContain('<figure class="landing-figure">');
    expect(out).not.toContain('src=');
  });

  it('returns empty input untouched', () => {
    expect(hydrateImageRefs('', MAP)).toBe('');
  });

  it('rebuilds an image-ref figure into the landing-figure primitive', () => {
    const out = hydrateImageRefs(figure('pic1'), MAP);
    expect(out).toContain('<figure class="landing-figure">');
    expect(out).toContain('<div class="landing-figure__frame">');
    expect(out).toContain('<img');
    expect(out).toContain('alt="First"');
    expect(out).toContain('loading="lazy"');
  });

  it('emits a 1×/2× Cloudinary srcset and width/height from the ref', () => {
    const out = hydrateImageRefs(figure('pic1'), MAP);
    expect(out).toContain('srcset="');
    expect(out).toContain('w_800');
    expect(out).toContain('2x');
    expect(out).toContain('width="800"');
    expect(out).toContain('height="600"');
  });

  it('uses a plain src with no srcset for a non-Cloudinary url', () => {
    const out = hydrateImageRefs(figure('plain'), MAP);
    expect(out).toContain('src="https://example.com/n.png"');
    expect(out).not.toContain('srcset=');
    expect(out).not.toContain('width=');
  });

  it('renders the caption as FIG. 0X · CAPTION with mono-caps spans', () => {
    const out = hydrateImageRefs(figure('pic1', 'A wide shot'), MAP);
    expect(out).toContain('<figcaption class="landing-figure__caption">');
    expect(out).toContain('<span class="landing-figure__number">FIG. 01</span>');
    expect(out).toContain('<span class="landing-figure__sep" aria-hidden="true">·</span>');
    expect(out).toContain('<span class="landing-figure__text">A wide shot</span>');
  });

  it('numbers captioned figures contiguously per page (01, 02)', () => {
    const out = hydrateImageRefs(figure('pic1', 'one') + figure('plain', 'two'), MAP);
    expect(out).toContain('FIG. 01');
    expect(out).toContain('FIG. 02');
  });

  it('does not consume a FIG number for a caption-less figure', () => {
    // first figure has no caption → no figcaption/number; the captioned one is still 01.
    const out = hydrateImageRefs(figure('pic1') + figure('plain', 'only caption'), MAP);
    expect(out.match(/<figcaption/g)).toHaveLength(1);
    expect(out).toContain('FIG. 01');
    expect(out).not.toContain('FIG. 02');
  });

  it('renders a broken <img> (no src) + caption-as-alt when the media is missing', () => {
    const out = hydrateImageRefs(figure('gone', 'Lost shot'), MAP);
    expect(out).toContain('<figure class="landing-figure">');
    expect(out).not.toContain('src=');
    expect(out).toContain('alt="Lost shot"');
    expect(out).toContain('<span class="landing-figure__text">Lost shot</span>');
  });

  it('ignores non-image-ref figures', () => {
    const html = '<figure><figcaption>plain</figcaption></figure>';
    expect(hydrateImageRefs(html, MAP)).toBe(html);
  });

  it('attr-escapes a media alt that contains breaking characters', () => {
    const map: MediaRefMap = { x: { url: 'https://example.com/x.png', alt: 'a "b" <c>', width: null, height: null } };
    const out = hydrateImageRefs(figure('x'), map);
    expect(out).toContain('alt="a &quot;b&quot; &lt;c&gt;"');
  });

  it('hydrates multiple image-ref figures in one document', () => {
    const out = hydrateImageRefs(figure('pic1', 'one') + '<p>x</p>' + figure('plain', 'two'), MAP);
    expect(out.match(/<figure class="landing-figure">/g)).toHaveLength(2);
  });
});
