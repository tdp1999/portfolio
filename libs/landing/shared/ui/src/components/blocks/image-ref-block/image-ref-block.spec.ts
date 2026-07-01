import { ComponentRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideBlockRenderers, type RenderContext } from '@portfolio/shared/features/rte-contract';
import type { PortableDocument } from '@portfolio/shared/features/rte-core/portable';
import { RteRender } from '@portfolio/shared/features/rte-renderer';
import { ImageRefBlock } from './image-ref-block';
import { imageRefBlockRenderer } from './image-ref-block.renderer';

const media: RenderContext = {
  locale: 'en',
  media: (id) => (id === 'm1' ? { url: 'https://cdn/a.png', alt: 'A photo', width: 800, height: 600 } : undefined),
};

describe('ImageRefBlock (unit)', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('renders a lightbox-enabled landing-figure when src is set', () => {
    const fixture = TestBed.createComponent(ImageRefBlock);
    fixture.componentRef.setInput('src', 'https://cdn/a.png');
    fixture.componentRef.setInput('alt', 'A photo');
    fixture.componentRef.setInput('caption', 'Hello');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    const figure = el.querySelector('landing-figure');
    expect(figure).not.toBeNull();
    expect(el.querySelector('img')?.getAttribute('src')).toBe('https://cdn/a.png');
    // The [lightbox] directive marks its host element → in-content figures are zoomable.
    expect(figure?.classList).toContain('lightbox-enabled');
  });

  it('renders nothing when src is empty (unresolved media)', () => {
    const fixture = TestBed.createComponent(ImageRefBlock);
    fixture.componentRef.setInput('src', '');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('landing-figure')).toBeNull();
  });
});

/** Mount a canonical doc through the real AST renderer + registry (the Phase 4 seam
 *  + a hydration smoke check that NgComponentOutlet resolves the block under render). */
function renderDoc(doc: PortableDocument): HTMLElement {
  TestBed.configureTestingModule({ providers: [provideBlockRenderers(imageRefBlockRenderer)] });
  const fixture = TestBed.createComponent(RteRender);
  (fixture.componentRef as ComponentRef<RteRender>).setInput('doc', doc);
  fixture.componentRef.setInput('context', media);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('image-ref block via RteRender registry', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('mounts the block and resolves media through the context', () => {
    const el = renderDoc({
      schemaVersion: 1,
      content: [{ type: 'image-ref', attrs: { imageId: 'm1', caption: 'Hello' } }],
    });
    expect(el.querySelector('landing-image-ref-block')).not.toBeNull();
    expect(el.querySelector('img')?.getAttribute('src')).toBe('https://cdn/a.png');
    expect(el.querySelector('figcaption')?.textContent).toContain('Hello');
  });

  it('renders no figure (and does not throw) when the media id is unknown', () => {
    const el = renderDoc({ schemaVersion: 1, content: [{ type: 'image-ref', attrs: { imageId: 'nope' } }] });
    expect(el.querySelector('landing-image-ref-block')).not.toBeNull();
    expect(el.querySelector('landing-figure')).toBeNull();
  });
});
