import { Component, input } from '@angular/core';
import { ComponentRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideBlockRenderers } from '@portfolio/shared/features/rte-contract';
import type { PortableDocument, PortableNode } from '@portfolio/shared/features/rte-core/portable';
import { RteRender } from './rte-render';

const doc = (...content: PortableNode[]): PortableDocument => ({ schemaVersion: 1, content });
const text = (value: string, marks?: PortableNode['marks']): PortableNode => ({
  type: 'text',
  text: value,
  ...(marks ? { marks } : {}),
});
/** Trimmed text — flow elements (<p>, <li>, marks) may carry Angular's collapsed
 *  boundary whitespace, which browsers render as nothing. Code blocks are asserted
 *  strictly (whitespace-significant, bound via codeText). */
const txt = (node: Element | null | undefined): string | undefined => node?.textContent?.trim();

/** Render `doc` and return the host element. */
function render(portable: PortableDocument, providers: unknown[] = []): HTMLElement {
  TestBed.configureTestingModule({ providers: providers as never });
  const fixture = TestBed.createComponent(RteRender);
  (fixture.componentRef as ComponentRef<RteRender>).setInput('doc', portable);
  fixture.componentRef.setInput('contentClass', 'landing-prose');
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('RteRender', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('renders a paragraph as a direct child of the host (prose rhythm intact)', () => {
    const el = render(doc({ type: 'paragraph', content: [text('hello')] }));
    const p = el.querySelector('p');
    expect(txt(p)).toBe('hello');
    // Direct child of the host → `.landing-prose > p` matches.
    expect(p?.parentElement).toBe(el);
    expect(el.classList).toContain('landing-prose');
  });

  it('maps heading level to the right tag', () => {
    const el = render(
      doc(
        { type: 'heading', attrs: { level: 2 }, content: [text('h2')] },
        { type: 'heading', attrs: { level: 3 }, content: [text('h3')] },
        { type: 'heading', attrs: { level: 4 }, content: [text('h4')] }
      )
    );
    expect(txt(el.querySelector('h2'))).toBe('h2');
    expect(txt(el.querySelector('h3'))).toBe('h3');
    expect(txt(el.querySelector('h4'))).toBe('h4');
  });

  it('renders lists structurally (ul > li > p)', () => {
    const el = render(
      doc({
        type: 'bulletList',
        content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [text('item')] }] }],
      })
    );
    expect(txt(el.querySelector('ul > li > p'))).toBe('item');
  });

  it('renders a table structurally, spans only when they differ from 1', () => {
    const el = render(
      doc({
        type: 'table',
        content: [
          {
            type: 'tableRow',
            content: [
              { type: 'tableHeader', content: [{ type: 'paragraph', content: [text('h')] }] },
              { type: 'tableCell', attrs: { colspan: 2 }, content: [{ type: 'paragraph', content: [text('c')] }] },
            ],
          },
        ],
      })
    );
    expect(txt(el.querySelector('table > tbody > tr > th'))).toBe('h');
    const td = el.querySelector('td');
    expect(txt(td)).toBe('c');
    expect(td?.getAttribute('colspan')).toBe('2');
    // colspan 1 is the default — the attribute is noise, so it is omitted.
    expect(el.querySelector('th')?.hasAttribute('colspan')).toBe(false);
  });

  it('renders a horizontal rule', () => {
    const el = render(doc({ type: 'horizontalRule' }));
    expect(el.querySelector('hr')).not.toBeNull();
  });

  /**
   * Regression: an unmarked run used to arrive as "\n  <text>\n", which Angular
   * collapses to " <text> " — so a run following a mark rendered as `bold , rest`
   * with a space in front of the comma.
   */
  it('does not pad an unmarked run that follows a mark', () => {
    const el = render(doc({ type: 'paragraph', content: [text('penalty', [{ type: 'bold' }]), text(', on notice.')] }));
    expect(el.querySelector('p')?.textContent).toBe('penalty, on notice.');
  });

  it('renders inline marks as nested REAL elements (no innerHTML)', () => {
    const el = render(doc({ type: 'paragraph', content: [text('x', [{ type: 'bold' }, { type: 'italic' }])] }));
    // Nested strong > em > text, all real DOM nodes.
    const strong = el.querySelector('strong');
    expect(strong).not.toBeNull();
    expect(txt(strong?.querySelector('em'))).toBe('x');
  });

  it('forces target/rel on link marks (D5b)', () => {
    const el = render(
      doc({ type: 'paragraph', content: [text('go', [{ type: 'link', attrs: { href: 'https://a.com' } }])] })
    );
    const a = el.querySelector('a');
    expect(a?.getAttribute('href')).toBe('https://a.com');
    expect(a?.getAttribute('target')).toBe('_blank');
    expect(a?.getAttribute('rel')).toBe('noopener nofollow');
  });

  it('renders codeBlock and hardBreak', () => {
    const el = render(doc({ type: 'codeBlock', content: [text('code()')] }, { type: 'hardBreak' }));
    // Code is whitespace-significant → asserted strictly (bound via codeText, no
    // stray formatting whitespace).
    expect(el.querySelector('pre > code')?.textContent).toBe('code()');
    expect(el.querySelector('br')).not.toBeNull();
  });

  it('shows a dev placeholder for an unknown block, without throwing', () => {
    // isDevMode() is true under Jest/TestBed, so the placeholder branch renders.
    const el = render(doc({ type: 'gallery', attrs: {} }, { type: 'paragraph', content: [text('after')] }));
    expect(el.querySelector('[data-rte-unknown]')?.textContent).toContain('gallery');
    // Sibling content still renders — one bad node never breaks the tree.
    expect(txt(el.querySelector('p'))).toBe('after');
  });

  it('stamps slugged ids on headings so a ToC / scrollspy can target them', () => {
    const el = render(
      doc(
        { type: 'heading', attrs: { level: 2 }, content: [text('Getting Started')] },
        { type: 'heading', attrs: { level: 3 }, content: [text('Getting Started')] }
      )
    );
    expect(el.querySelector('h2')?.id).toBe('getting-started');
    // Colliding slug → deduped suffix, matching collectHeadings.
    expect(el.querySelector('h3')?.id).toBe('getting-started-2');
  });

  it('exposes headings() as the single slug source for a consumer ToC', () => {
    TestBed.configureTestingModule({});
    const fixture = TestBed.createComponent(RteRender);
    (fixture.componentRef as ComponentRef<RteRender>).setInput(
      'doc',
      doc(
        { type: 'heading', attrs: { level: 2 }, content: [text('Alpha')] },
        { type: 'heading', attrs: { level: 4 }, content: [text('Beta')] }
      )
    );
    fixture.detectChanges();
    expect(fixture.componentInstance.headings()).toEqual([
      { id: 'alpha', text: 'Alpha', level: 2 },
      { id: 'beta', text: 'Beta', level: 4 },
    ]);
  });

  it('mounts a registered block component via the registry (the Phase 4 seam)', () => {
    const el = render(doc({ type: 'image-ref', attrs: { imageId: 'm1' } }), [
      provideBlockRenderers({
        type: 'image-ref',
        component: StubBlock,
        inputs: (node) => ({ imageId: node.attrs?.['imageId'] as string }),
      }),
    ]);
    const stub = el.querySelector('[data-stub]');
    expect(stub?.textContent).toBe('block:m1');
  });
});

@Component({ selector: 'rte-stub-block', template: `<span data-stub>block:{{ imageId() }}</span>` })
class StubBlock {
  readonly imageId = input<string>('');
}
