import { TestBed } from '@angular/core/testing';
import { RteRenderHtml } from './rte-render-html';

// Integration test: drive the real pipe (browser DOMPurify via sanitizeRichTextBrowser)
// through the component's [innerHTML] binding. Proves the read-path strips dangerous
// markup, hardens anchors, and keeps id only on headings before anything reaches the DOM.
describe('RteRenderHtml (read-path sanitization)', () => {
  function render(html: string): HTMLElement {
    const fixture = TestBed.createComponent(RteRenderHtml);
    fixture.componentRef.setInput('html', html);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('strips <script> from a known JSON snapshot HTML string', () => {
    const el = render('<p>case study body</p><script>alert(1)</script>');
    expect(el.textContent).toContain('case study body');
    expect(el.querySelector('script')).toBeNull();
    expect(el.innerHTML).not.toContain('alert(1)');
  });

  it('keeps whitelisted semantic markup (h2 / blockquote / code)', () => {
    const el = render('<h2>Heading</h2><blockquote>quote</blockquote><pre><code>x</code></pre>');
    expect(el.querySelector('h2')?.textContent).toBe('Heading');
    expect(el.querySelector('blockquote')).not.toBeNull();
    expect(el.querySelector('code')).not.toBeNull();
  });

  it('hardens surviving anchors with target=_blank + rel=noopener nofollow', () => {
    const el = render('<a href="https://example.com">link</a>');
    const a = el.querySelector('a');
    expect(a?.getAttribute('target')).toBe('_blank');
    expect(a?.getAttribute('rel')).toBe('noopener nofollow');
  });

  it('keeps id on headings (ToC anchors survive)', () => {
    const el = render('<h2 id="overview">Overview</h2><h3 id="why">Why</h3>');
    expect(el.querySelector('h2')?.getAttribute('id')).toBe('overview');
    expect(el.querySelector('h3')?.getAttribute('id')).toBe('why');
  });

  it('strips id from non-heading elements (blocks anchor spoofing)', () => {
    const el = render('<p id="spoof">text</p><a href="https://example.com" id="hijack">link</a>');
    expect(el.querySelector('p')?.hasAttribute('id')).toBe(false);
    expect(el.querySelector('a')?.hasAttribute('id')).toBe(false);
  });
});
