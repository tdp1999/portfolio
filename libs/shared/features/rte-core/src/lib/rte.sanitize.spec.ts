import { sanitizeRichText } from './rte.sanitize';
import { RICH_TEXT_WHITELIST } from './rte.constants';

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
});
