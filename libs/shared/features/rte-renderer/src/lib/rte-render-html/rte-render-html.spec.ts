import { TestBed } from '@angular/core/testing';
import { RteRenderHtml } from './rte-render-html';

// Integration test: drive the real pipe (real isomorphic-dompurify) through the
// component's [innerHTML] binding. Proves the read-path strips dangerous markup
// and hardens anchors before anything reaches the DOM.
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
});
