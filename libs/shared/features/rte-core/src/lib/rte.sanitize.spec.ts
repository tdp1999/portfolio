import { sanitizeRichText } from './rte.sanitize';
import { RICH_TEXT_MEDIA_WHITELIST, RICH_TEXT_WHITELIST } from './rte.constants';

describe('sanitizeRichText', () => {
  it('strips a <script> tag entirely', () => {
    const out = sanitizeRichText('<p>hi</p><script>alert(1)</script>');
    expect(out).toContain('<p>hi</p>');
    expect(out).not.toContain('script');
  });

  it('drops a javascript: URL on an anchor', () => {
    const out = sanitizeRichText('<a href="javascript:alert(1)">x</a>');
    expect(out).not.toContain('javascript:');
  });

  it('hardens surviving anchors with target=_blank + rel=noopener nofollow', () => {
    const out = sanitizeRichText('<a href="https://example.com">link</a>');
    expect(out).toContain('target="_blank"');
    expect(out).toContain('rel="noopener nofollow"');
  });

  it('keeps whitelisted semantic tags (h2/blockquote/code)', () => {
    const out = sanitizeRichText('<h2>T</h2><blockquote>q</blockquote><pre><code>c</code></pre>');
    expect(out).toContain('<h2>T</h2>');
    expect(out).toContain('<blockquote>q</blockquote>');
    expect(out).toContain('<code>c</code>');
  });

  it('removes a tag absent from the whitelist (e.g. <table>)', () => {
    const out = sanitizeRichText('<table><tr><td>x</td></tr></table>');
    expect(out).not.toContain('<table>');
  });

  it('honours a call-site whitelist extension (id on headings)', () => {
    const extended = {
      ALLOWED_TAGS: RICH_TEXT_WHITELIST.ALLOWED_TAGS,
      ALLOWED_ATTR: [...RICH_TEXT_WHITELIST.ALLOWED_ATTR, 'id'],
    };
    const out = sanitizeRichText('<h2 id="intro">T</h2>', extended);
    expect(out).toContain('id="intro"');
  });

  it('keeps id on h2/h3/h4 with the base whitelist (ToC anchors)', () => {
    const out = sanitizeRichText('<h2 id="a">A</h2><h3 id="b">B</h3><h4 id="c">C</h4>');
    expect(out).toContain('id="a"');
    expect(out).toContain('id="b"');
    expect(out).toContain('id="c"');
  });

  it('strips id from non-heading elements (no anchor spoofing on <a>/<p>)', () => {
    const out = sanitizeRichText('<p id="x">p</p><a href="https://e.com" id="y">a</a>');
    expect(out).not.toContain('id="x"');
    expect(out).not.toContain('id="y"');
  });

  // --- image-ref figures (task 315) ---

  it('keeps an image-ref figure with data-image-id + data-caption-position (base whitelist)', () => {
    const out = sanitizeRichText(
      '<figure data-block="image-ref" data-image-id="abc" data-caption-position="bottom"><figcaption>cap</figcaption></figure>'
    );
    expect(out).toContain('data-block="image-ref"');
    expect(out).toContain('data-image-id="abc"');
    expect(out).toContain('data-caption-position="bottom"');
    expect(out).toContain('<figcaption>cap</figcaption>');
  });

  it('strips an <img> under the base whitelist (stored cache stays URL-free)', () => {
    const out = sanitizeRichText(
      '<figure data-block="image-ref" data-image-id="abc"><img src="https://cdn/x.png" /></figure>'
    );
    expect(out).not.toContain('<img');
    expect(out).toContain('data-image-id="abc"');
  });

  it('keeps a hydrated landing-figure (div frame + img srcset + class) under RICH_TEXT_MEDIA_WHITELIST', () => {
    const out = sanitizeRichText(
      '<figure class="landing-figure"><div class="landing-figure__frame"><img src="https://cdn/x.png" srcset="https://cdn/x.png 1x, https://cdn/x2.png 2x" alt="a" width="800" height="600" loading="lazy" /></div></figure>',
      RICH_TEXT_MEDIA_WHITELIST
    );
    expect(out).toContain('<div class="landing-figure__frame">');
    expect(out).toContain('class="landing-figure"');
    expect(out).toContain('srcset="https://cdn/x.png 1x, https://cdn/x2.png 2x"');
    expect(out).toContain('width="800"');
    expect(out).toContain('height="600"');
  });

  it('still strips a <div> under the base whitelist (media tags are read-time only)', () => {
    const out = sanitizeRichText('<div class="x">hi</div>');
    expect(out).not.toContain('<div');
  });

  it('still drops a javascript: src even with the media whitelist', () => {
    const out = sanitizeRichText('<img src="javascript:alert(1)" />', RICH_TEXT_MEDIA_WHITELIST);
    expect(out).not.toContain('javascript:');
  });
});
