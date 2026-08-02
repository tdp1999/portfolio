import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MediaPreview } from './media-preview';
import type { MediaPreviewItem } from './media-preview.types';

const CLOUDINARY = 'https://res.cloudinary.com/demo/image/upload/v1/shot.png';

@Component({
  standalone: true,
  imports: [MediaPreview],
  template: `<console-media-preview [items]="items()" [tileSize]="230" [lightbox]="lightbox()" />`,
})
class Host {
  readonly items = signal<readonly MediaPreviewItem[]>([]);
  readonly lightbox = signal(true);
}

describe('MediaPreview', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
  });

  const labels = () =>
    fixture.debugElement.queryAll(By.css('.media-preview__label')).map((el) => el.nativeElement.textContent.trim());

  it('labels each tile caption first, then filename, then alt text', () => {
    host.items.set([
      { id: 'a', url: CLOUDINARY, caption: 'Builder + table', filename: 'a.png', altText: 'Alt a' },
      { id: 'b', url: CLOUDINARY, caption: null, filename: 'b.png', altText: 'Alt b' },
      { id: 'c', url: CLOUDINARY, caption: null, filename: null, altText: 'Alt c' },
      { id: 'd', url: CLOUDINARY, caption: null, filename: null, altText: null },
    ]);
    fixture.detectChanges();

    expect(labels()).toEqual(['Builder + table', 'b.png', 'Alt c', 'Untitled']);
  });

  // The console used to hand a 230px tile the untouched original.
  it('requests a tile-sized derivative instead of the original', () => {
    host.items.set([{ id: 'a', url: CLOUDINARY, filename: 'a.png' }]);
    fixture.detectChanges();

    const src: string = fixture.debugElement.query(By.css('.media-preview__img')).nativeElement.getAttribute('src');
    expect(src).toContain('/upload/c_limit,w_480,f_auto,q_auto/');
    expect(src).not.toBe(CLOUDINARY);
  });

  it('leaves a non-Cloudinary url alone rather than corrupting it', () => {
    host.items.set([{ id: 'a', url: 'https://example.com/plain.png', filename: 'plain.png' }]);
    fixture.detectChanges();

    const src: string = fixture.debugElement.query(By.css('.media-preview__img')).nativeElement.getAttribute('src');
    expect(src).toBe('https://example.com/plain.png');
  });

  it('opens the overlay on a tile click and navigates the whole group', () => {
    host.items.set([
      { id: 'a', url: CLOUDINARY, filename: 'a.png' },
      { id: 'b', url: CLOUDINARY, filename: 'b.png' },
    ]);
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('.ql-panel'))).toBeNull();

    fixture.debugElement.queryAll(By.css('.media-preview__frame--interactive'))[0].nativeElement.click();
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('.ql-panel'))).not.toBeNull();
    expect(fixture.debugElement.query(By.css('.media-preview__full-label')).nativeElement.textContent.trim()).toBe(
      'a.png'
    );

    // Next is enabled because the sibling tile is part of the same group.
    fixture.debugElement.query(By.css('[aria-label="Next (Right arrow)"]')).nativeElement.click();
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('.media-preview__full-label')).nativeElement.textContent.trim()).toBe(
      'b.png'
    );
  });

  it('renders plain, unclickable frames when the lightbox is off', () => {
    host.lightbox.set(false);
    host.items.set([{ id: 'a', url: CLOUDINARY, filename: 'a.png' }]);
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('.media-preview__frame--interactive'))).toBeNull();
    expect(fixture.debugElement.query(By.css('.media-preview__frame'))).not.toBeNull();
  });

  it('shows a file icon instead of a broken image for a non-image asset', () => {
    host.items.set([{ id: 'a', url: CLOUDINARY, filename: 'a.pdf', mimeType: 'application/pdf' }]);
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('.media-preview__img'))).toBeNull();
    expect(fixture.debugElement.query(By.css('.media-preview__fallback'))).not.toBeNull();
  });
});
