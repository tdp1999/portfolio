import { ComponentRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Image } from './image';

describe('ImageComponent', () => {
  let fixture: ComponentFixture<Image>;
  let ref: ComponentRef<Image>;
  let component: Image;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [Image] });
    fixture = TestBed.createComponent(Image);
    ref = fixture.componentRef;
    component = fixture.componentInstance;
  });

  function set(inputs: Record<string, unknown>): void {
    for (const [k, v] of Object.entries(inputs)) ref.setInput(k, v);
    fixture.detectChanges();
  }

  it('creates', () => {
    set({ src: '/img/hero', alt: 'Hero' });
    expect(component).toBeTruthy();
  });

  describe('mode (a) — manual N-width', () => {
    beforeEach(() => set({ src: '/img/hero', alt: 'Hero', widths: [480, 960], formats: ['webp', 'jpg'] }));

    it('emits a <source> for every format except the last', () => {
      const sources = fixture.nativeElement.querySelectorAll('source');
      expect(sources.length).toBe(1);
      expect(sources[0].getAttribute('type')).toBe('image/webp');
      expect(sources[0].getAttribute('srcset')).toBe('/img/hero-480.webp 480w, /img/hero-960.webp 960w');
    });

    it('uses the last format at the largest width as the <img> fallback', () => {
      const img = fixture.nativeElement.querySelector('img');
      expect(img.getAttribute('src')).toBe('/img/hero-960.jpg');
      expect(img.getAttribute('srcset')).toBe('/img/hero-480.jpg 480w, /img/hero-960.jpg 960w');
    });
  });

  describe('mode (b) — explicit srcset', () => {
    beforeEach(() =>
      set({ src: 'https://cdn/img.jpg', alt: 'Hero', srcset: 'https://cdn/img-480 480w, https://cdn/img-960 960w' })
    );

    it('emits no <source> tags and uses src verbatim', () => {
      expect(fixture.nativeElement.querySelectorAll('source').length).toBe(0);
      const img = fixture.nativeElement.querySelector('img');
      expect(img.getAttribute('src')).toBe('https://cdn/img.jpg');
      expect(img.getAttribute('srcset')).toBe('https://cdn/img-480 480w, https://cdn/img-960 960w');
    });
  });

  describe('CLS + above-the-fold', () => {
    it('reserves space via width/height', () => {
      set({ src: '/img/hero', alt: 'Hero', width: 1200, height: 800 });
      const img = fixture.nativeElement.querySelector('img');
      expect(img.getAttribute('width')).toBe('1200');
      expect(img.getAttribute('height')).toBe('800');
    });

    it('preload flips to eager + sync decode + high fetchpriority', () => {
      set({ src: '/img/hero', alt: 'Hero', preload: true });
      const img = fixture.nativeElement.querySelector('img');
      expect(img.getAttribute('loading')).toBe('eager');
      expect(img.getAttribute('decoding')).toBe('sync');
      expect(img.getAttribute('fetchpriority')).toBe('high');
    });

    it('defaults to lazy + async', () => {
      set({ src: '/img/hero', alt: 'Hero' });
      const img = fixture.nativeElement.querySelector('img');
      expect(img.getAttribute('loading')).toBe('lazy');
      expect(img.getAttribute('decoding')).toBe('async');
    });
  });
});
