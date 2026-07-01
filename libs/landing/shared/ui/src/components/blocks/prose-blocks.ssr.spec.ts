import { Component, provideZonelessChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { renderApplication } from '@angular/platform-server';
import { provideBlockRenderers, type RenderContext } from '@portfolio/shared/features/rte-contract';
import type { PortableDocument } from '@portfolio/shared/features/rte-core/portable';
import { RteRender } from '@portfolio/shared/features/rte-renderer';
import { galleryBlockRenderer } from './gallery-block/gallery-block.renderer';
import { imageRefBlockRenderer } from './image-ref-block/image-ref-block.renderer';

/**
 * SSR crawler-completeness proof for the AST read-path (epic Phase 5, decision D7).
 *
 * The epic demotes the `*Html` cache to a fallback and asserts SEO is served by
 * SSR itself. This test makes that concrete: it renders `<rte-render [doc]>` through
 * `@angular/platform-server`'s `renderApplication` — the same server path the landing
 * app uses — and inspects the **raw serialized HTML string**, i.e. exactly what a
 * no-JS crawler (Googlebot / an AI reader) receives on first paint.
 *
 * It proves the whole tree — structural tags, declarative marks, AND the registered
 * `image-ref` / `gallery` blocks (with real `<img src>` resolved through the render
 * context) — is present in that string with no client JS, and that no editor engine
 * (Tiptap/ProseMirror) leaks into the read-path. This is the gate that must be green
 * before Phase 6 points the real consumers at `<rte-render>`.
 */

const media: RenderContext = {
  locale: 'en',
  media: (id) =>
    id === 'm1' || id === 'm2'
      ? { url: `https://cdn/${id}.png`, alt: `alt ${id}`, width: 800, height: 600 }
      : undefined,
};

const DOC: PortableDocument = {
  schemaVersion: 1,
  content: [
    { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Section title' }] },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'plain and ' },
        { type: 'text', text: 'bold', marks: [{ type: 'bold' }] },
        { type: 'text', text: ' and ' },
        { type: 'text', text: 'a link', marks: [{ type: 'link', attrs: { href: 'https://example.com' } }] },
      ],
    },
    {
      type: 'bulletList',
      content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'item one' }] }] }],
    },
    { type: 'image-ref', attrs: { imageId: 'm1', caption: 'A caption' } },
    { type: 'gallery', attrs: { imageIds: ['m1', 'm2'] } },
  ],
};

/** Render a doc through platform-server and return the serialized HTML string. */
async function renderToString(doc: PortableDocument): Promise<string> {
  @Component({
    selector: 'landing-ssr-host',
    standalone: true,
    imports: [RteRender],
    template: `<rte-render [doc]="doc" [context]="ctx" contentClass="landing-prose" />`,
  })
  class SsrHost {
    readonly doc = doc;
    readonly ctx = media;
  }

  return renderApplication(
    (context) =>
      bootstrapApplication(
        SsrHost,
        {
          providers: [
            provideZonelessChangeDetection(),
            provideBlockRenderers(imageRefBlockRenderer, galleryBlockRenderer),
          ],
        },
        context
      ),
    { document: '<html><head></head><body><landing-ssr-host></landing-ssr-host></body></html>', url: '/' }
  );
}

describe('prose-block AST read-path — SSR crawler-completeness (D7)', () => {
  let html = '';
  beforeAll(async () => {
    html = await renderToString(DOC);
  });

  it('renders structural tags server-side (crawler sees real headings/paragraphs/lists)', () => {
    expect(html).toContain('<h2');
    expect(html).toContain('Section title');
    expect(html).toContain('<p');
    expect(html).toContain('<ul');
    expect(html).toContain('<li');
    expect(html).toContain('item one');
  });

  it('renders inline marks declaratively as real elements', () => {
    expect(html).toContain('<strong');
    expect(html).toContain('bold');
    // Link mark → real <a> with the forced target/rel (D5b), no innerHTML.
    expect(html).toMatch(/<a[^>]*href="https:\/\/example\.com"/);
    expect(html).toContain('rel="noopener nofollow"');
  });

  it('renders the image-ref block with a real resolved <img>, not a placeholder', () => {
    expect(html).toContain('landing-image-ref-block');
    expect(html).toContain('<figure');
    expect(html).toMatch(/<img[^>]*src="https:\/\/cdn\/m1\.png"/);
    expect(html).toContain('A caption');
  });

  it('renders the gallery block resolving every image id through the context', () => {
    expect(html).toContain('landing-gallery-block');
    expect(html).toMatch(/<img[^>]*src="https:\/\/cdn\/m1\.png"/);
    expect(html).toMatch(/<img[^>]*src="https:\/\/cdn\/m2\.png"/);
  });

  it('leaks no editor engine into the read-path (no Tiptap/ProseMirror/contenteditable)', () => {
    expect(html).not.toContain('ProseMirror');
    expect(html.toLowerCase()).not.toContain('tiptap');
    expect(html).not.toContain('contenteditable');
  });
});
