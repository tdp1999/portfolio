import { HttpEventType, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_CONFIG } from '../api';
import { MediaService } from './media.service';
import type { MediaUploadEvent } from '@portfolio/console/shared/util';

describe('MediaService.upload', () => {
  let service: MediaService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        MediaService,
        { provide: API_CONFIG, useValue: { baseUrl: 'http://api.test', urlPrefix: 'api', timeout: 30000 } },
      ],
    });
    service = TestBed.inject(MediaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  const file = () => new File(['x'.repeat(100)], 'shot.png', { type: 'image/png' });

  it('asks for progress events, which is what makes the percentage real', () => {
    service.upload(file()).subscribe();
    const req = httpMock.expectOne('http://api.test/api/media/upload');

    expect(req.request.reportProgress).toBe(true);
    expect(req.request.responseType).toBe('text');
    req.flush('media-1');
  });

  // The regression: the bar only ever had 0% and 100% because nothing in between
  // was ever emitted.
  it('emits every intermediate percentage, not just the endpoints', () => {
    const seen: MediaUploadEvent[] = [];
    service.upload(file()).subscribe((e) => seen.push(e));
    const req = httpMock.expectOne('http://api.test/api/media/upload');

    req.event({ type: HttpEventType.UploadProgress, loaded: 250, total: 1000 });
    req.event({ type: HttpEventType.UploadProgress, loaded: 500, total: 1000 });
    req.event({ type: HttpEventType.UploadProgress, loaded: 750, total: 1000 });
    req.flush('media-1');

    expect(seen.map((e) => e.progress)).toEqual([25, 50, 75, 100]);
  });

  it('holds a fully-sent-but-unanswered upload at 99, so the bar never sits full while work remains', () => {
    const seen: MediaUploadEvent[] = [];
    service.upload(file()).subscribe((e) => seen.push(e));
    const req = httpMock.expectOne('http://api.test/api/media/upload');

    req.event({ type: HttpEventType.UploadProgress, loaded: 1000, total: 1000 });

    expect(seen).toEqual([{ progress: 99 }]);
    expect(seen.some((e) => e.id)).toBe(false);
    req.flush('media-1');
  });

  it('carries the new id only on the final tick', () => {
    const seen: MediaUploadEvent[] = [];
    service.upload(file()).subscribe((e) => seen.push(e));
    const req = httpMock.expectOne('http://api.test/api/media/upload');

    req.event({ type: HttpEventType.UploadProgress, loaded: 500, total: 1000 });
    req.flush('media-42');

    expect(seen).toEqual([{ progress: 50 }, { progress: 100, id: 'media-42' }]);
  });

  // A 2xx carrying no id used to slip through as a plain `{ progress: 100 }` tick,
  // indistinguishable from "still sending". The row then parked on "Processing"
  // forever and the batch never reported complete, with nothing on screen to say so.
  it('fails loudly when a successful response carries no media id', () => {
    const seen: MediaUploadEvent[] = [];
    let error: Error | undefined;
    service.upload(file()).subscribe({ next: (e) => seen.push(e), error: (e) => (error = e) });
    const req = httpMock.expectOne('http://api.test/api/media/upload');

    req.flush('   ');

    expect(seen).toEqual([]);
    expect(error?.message).toContain('no media id');
  });

  it('reports 0 rather than NaN when the body length is unknown', () => {
    const seen: MediaUploadEvent[] = [];
    service.upload(file()).subscribe((e) => seen.push(e));
    const req = httpMock.expectOne('http://api.test/api/media/upload');

    req.event({ type: HttpEventType.UploadProgress, loaded: 500 });

    expect(seen).toEqual([{ progress: 0 }]);
    req.flush('media-1');
  });

  it('drops events a progress bar cannot use', () => {
    const seen: MediaUploadEvent[] = [];
    service.upload(file()).subscribe((e) => seen.push(e));
    const req = httpMock.expectOne('http://api.test/api/media/upload');

    req.event({ type: HttpEventType.Sent });
    req.flush('media-1');

    expect(seen).toEqual([{ progress: 100, id: 'media-1' }]);
  });

  it('forwards folder, alt text and caption in the form body', () => {
    service.upload(file(), { folder: 'projects', altText: 'A table', caption: 'Builder' }).subscribe();
    const req = httpMock.expectOne('http://api.test/api/media/upload');
    const body = req.request.body as FormData;

    expect(body.get('folder')).toBe('projects');
    expect(body.get('altText')).toBe('A table');
    expect(body.get('caption')).toBe('Builder');
    req.flush('media-1');
  });
});
