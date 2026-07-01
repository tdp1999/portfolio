import { ComponentRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideBlockRenderers, type RenderContext } from '@portfolio/shared/features/rte-contract';
import type { PortableDocument } from '@portfolio/shared/features/rte-core/portable';
import { RteRender } from '@portfolio/shared/features/rte-renderer';
import { GalleryBlock } from './gallery-block';
import { galleryBlockRenderer } from './gallery-block.renderer';

const media: RenderContext = {
  locale: 'en',
  media: (id) =>
    id.startsWith('m') ? { url: `https://cdn/${id}.png`, alt: `img ${id}`, width: 800, height: 600 } : undefined,
};

describe('GalleryBlock (unit)', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('renders a landing-gallery with a figure per image', () => {
    const fixture = TestBed.createComponent(GalleryBlock);
    fixture.componentRef.setInput('images', [
      { url: 'https://cdn/1.png', alt: '1' },
      { url: 'https://cdn/2.png', alt: '2' },
    ]);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('landing-gallery')).not.toBeNull();
    expect(el.querySelectorAll('landing-figure').length).toBe(2);
  });

  it('renders nothing for an empty image list', () => {
    const fixture = TestBed.createComponent(GalleryBlock);
    fixture.componentRef.setInput('images', []);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('landing-gallery')).toBeNull();
  });
});

describe('gallery block via RteRender registry (2nd block = one entry)', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('resolves imageIds through the context and mounts the gallery', () => {
    const doc: PortableDocument = {
      schemaVersion: 1,
      content: [{ type: 'gallery', attrs: { imageIds: ['m1', 'm2', 'bad'] } }],
    };
    TestBed.configureTestingModule({ providers: [provideBlockRenderers(galleryBlockRenderer)] });
    const fixture = TestBed.createComponent(RteRender);
    (fixture.componentRef as ComponentRef<RteRender>).setInput('doc', doc);
    fixture.componentRef.setInput('context', media);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('landing-gallery-block')).not.toBeNull();
    expect(el.querySelector('landing-gallery')).not.toBeNull();
    // 'bad' resolves to undefined and is dropped → only the 2 real images render.
    expect(el.querySelectorAll('landing-gallery landing-figure').length).toBe(2);
  });
});
