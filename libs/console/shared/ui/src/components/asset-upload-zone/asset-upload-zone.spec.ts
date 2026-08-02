import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { AssetUploadZone } from './asset-upload-zone';
import type { MediaItem } from '@portfolio/console/shared/util';
import type { UploadFn, UploadProgress } from './asset-upload-zone.types';

const mockMedia: MediaItem = {
  id: 'media-1',
  originalFilename: 'test.jpg',
  mimeType: 'image/jpeg',
  url: 'https://example.com/test.jpg',
  format: 'jpg',
  bytes: 1024,
  width: 800,
  height: 600,
  altText: null,
  caption: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

function makeFile(name: string, type: string, size: number): File {
  return new File(['x'.repeat(size)], name, { type });
}

describe('AssetUploadZoneComponent', () => {
  let fixture: ComponentFixture<AssetUploadZone>;
  let component: AssetUploadZone;

  function create(uploadFn: UploadFn) {
    TestBed.configureTestingModule({
      imports: [AssetUploadZone],
    }).compileComponents();
    fixture = TestBed.createComponent(AssetUploadZone);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('uploadFn', uploadFn);
    fixture.detectChanges();
  }

  function drop(file: File): void {
    const dt = new DataTransfer();
    dt.items.add(file);
    fixture.nativeElement
      .querySelector('.upload-zone__dropzone')
      .dispatchEvent(new DragEvent('drop', { dataTransfer: dt }));
    fixture.detectChanges();
  }

  describe('validation', () => {
    it('rejects files exceeding maxFileSize', () => {
      create(() => of({ progress: 100, result: mockMedia }));
      fixture.componentRef.setInput('maxFileSize', 100);
      fixture.componentRef.setInput('accept', 'image/*');

      const large = makeFile('big.jpg', 'image/jpeg', 200);
      const dt = new DataTransfer();
      dt.items.add(large);
      const dropEvent = new DragEvent('drop', { dataTransfer: dt });
      const dropzone = fixture.nativeElement.querySelector('.upload-zone__dropzone');
      dropzone.dispatchEvent(dropEvent);
      fixture.detectChanges();

      const errors: string[] = (component as unknown as { validationErrors: { (): string[] } }).validationErrors();
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('big.jpg');
      expect((component as unknown as { rows: { (): unknown[] } }).rows().length).toBe(0);
    });

    it('rejects files with wrong mime type', () => {
      create(() => of({ progress: 100, result: mockMedia }));
      fixture.componentRef.setInput('accept', 'image/*');

      const pdf = makeFile('doc.pdf', 'application/pdf', 100);
      const dt = new DataTransfer();
      dt.items.add(pdf);
      const dropEvent = new DragEvent('drop', { dataTransfer: dt });
      fixture.nativeElement.querySelector('.upload-zone__dropzone').dispatchEvent(dropEvent);
      fixture.detectChanges();

      const errors: string[] = (component as unknown as { validationErrors: { (): string[] } }).validationErrors();
      expect(errors.some((e) => e.includes('doc.pdf'))).toBe(true);
    });

    // Regression: every media picker passes `accept="image/"` (the same string it
    // sends to the API as `mimeTypePrefix`). That prefix was compared with `===`
    // against `file.type`, so NO image could be uploaded from the picker — the
    // whole Upload tab was dead and users had to detour through the Media page.
    it('accepts an image when accept is the API mime-prefix `image/`', () => {
      create(() => of({ progress: 100, result: mockMedia }));
      fixture.componentRef.setInput('accept', 'image/');

      const png = makeFile('Screenshot 2026-06-22 at 10.54.19.png', 'image/png', 100);
      const dt = new DataTransfer();
      dt.items.add(png);
      fixture.nativeElement
        .querySelector('.upload-zone__dropzone')
        .dispatchEvent(new DragEvent('drop', { dataTransfer: dt }));
      fixture.detectChanges();

      expect((component as unknown as { validationErrors: { (): string[] } }).validationErrors()).toEqual([]);
      expect((component as unknown as { rows: { (): unknown[] } }).rows().length).toBe(1);
    });

    it('still rejects a non-image when accept is the `image/` prefix', () => {
      create(() => of({ progress: 100, result: mockMedia }));
      fixture.componentRef.setInput('accept', 'image/');

      const pdf = makeFile('doc.pdf', 'application/pdf', 100);
      const dt = new DataTransfer();
      dt.items.add(pdf);
      fixture.nativeElement
        .querySelector('.upload-zone__dropzone')
        .dispatchEvent(new DragEvent('drop', { dataTransfer: dt }));
      fixture.detectChanges();

      expect((component as unknown as { rows: { (): unknown[] } }).rows().length).toBe(0);
    });

    it('rewrites the mime-prefix into a valid accept attribute for the file dialog', () => {
      create(() => of({ progress: 100, result: mockMedia }));
      fixture.componentRef.setInput('accept', 'image/');
      fixture.detectChanges();

      const input: HTMLInputElement = fixture.nativeElement.querySelector('input[type="file"]');
      expect(input.getAttribute('accept')).toBe('image/*');
    });
  });

  describe('progress updates', () => {
    it('renders progress bar while uploading', () => {
      const progress$ = new Subject<UploadProgress>();
      create(() => progress$);

      const file = makeFile('photo.jpg', 'image/jpeg', 100);
      const dt = new DataTransfer();
      dt.items.add(file);
      fixture.nativeElement
        .querySelector('.upload-zone__dropzone')
        .dispatchEvent(new DragEvent('drop', { dataTransfer: dt }));
      fixture.detectChanges();

      progress$.next({ progress: 50 });
      fixture.detectChanges();

      const fill: HTMLElement | null = fixture.nativeElement.querySelector('.upload-row__fill');
      expect(fill).toBeTruthy();
      if (!fill) throw new Error('fill element not found');
      expect(fill.style.width).toBe('50%');
    });

    it('tracks each intermediate percentage the source emits', () => {
      const progress$ = new Subject<UploadProgress>();
      create(() => progress$);
      drop(makeFile('photo.jpg', 'image/jpeg', 100));

      const widths: string[] = [];
      for (const p of [12, 37, 68, 91]) {
        progress$.next({ progress: p });
        fixture.detectChanges();
        widths.push(fixture.nativeElement.querySelector('.upload-row__fill').style.width);
      }

      expect(widths).toEqual(['12%', '37%', '68%', '91%']);
    });

    // A bar parked at 100% for the whole Cloudinary leg reads as a hang. The row
    // switches to an indeterminate sweep labelled "Processing" instead.
    it('switches to the processing state once every byte is sent', () => {
      const progress$ = new Subject<UploadProgress>();
      create(() => progress$);
      drop(makeFile('photo.jpg', 'image/jpeg', 100));

      progress$.next({ progress: 100 });
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.upload-row__fill--indeterminate')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('.upload-row__percent').textContent.trim()).toBe('Processing');
      expect(fixture.nativeElement.querySelector('.upload-row--processing')).toBeTruthy();
    });

    it('leaves the processing state for done when the record arrives', () => {
      const progress$ = new Subject<UploadProgress>();
      create(() => progress$);
      drop(makeFile('photo.jpg', 'image/jpeg', 100));

      progress$.next({ progress: 100 });
      fixture.detectChanges();
      progress$.next({ progress: 100, result: mockMedia });
      progress$.complete();
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.upload-row__fill--indeterminate')).toBeNull();
      expect(fixture.nativeElement.querySelector('.upload-row--done')).toBeTruthy();
    });

    it('does not report the batch complete while a file is still processing', () => {
      const progress$ = new Subject<UploadProgress>();
      create(() => progress$);
      const emitted: MediaItem[][] = [];
      fixture.componentInstance.uploadsComplete.subscribe((v) => emitted.push(v));
      drop(makeFile('photo.jpg', 'image/jpeg', 100));

      progress$.next({ progress: 100 });
      fixture.detectChanges();

      expect(emitted).toEqual([]);
    });
  });

  describe('failures', () => {
    // Not every failure is an HttpErrorResponse. A timeout, or a 2xx that carried no
    // media id, arrives as a plain Error — and its own message is the informative one.
    // Routing those through `extractApiError` flattened every one of them to the same
    // useless "An unexpected error occurred".
    it('shows a plain Error’s own message rather than a generic fallback', () => {
      create(() => throwError(() => new Error('The upload finished but the server returned no media id.')));
      drop(makeFile('photo.jpg', 'image/jpeg', 100));

      const text: string = fixture.nativeElement.querySelector('.upload-row').textContent;
      expect(text).toContain('no media id');
    });

    // The point of failing loudly: the row reaches a settled state and the batch
    // reports. A row left on `processing` would block `checkAllSettled` forever.
    it('settles the batch on failure instead of waiting for a row that will never finish', () => {
      const failures: { file: File; error: Error }[][] = [];
      create(() => throwError(() => new Error('boom')));
      fixture.componentInstance.uploadFailed.subscribe((v) => failures.push(v));
      drop(makeFile('photo.jpg', 'image/jpeg', 100));

      expect(failures.length).toBe(1);
      expect(failures[0][0].error.message).toBe('boom');
      expect(fixture.nativeElement.querySelector('.upload-row__fill--indeterminate')).toBeNull();
    });
  });

  describe('cancel', () => {
    it('removes row when cancel is clicked', () => {
      const progress$ = new Subject<UploadProgress>();
      create(() => progress$);

      const file = makeFile('photo.jpg', 'image/jpeg', 100);
      const dt = new DataTransfer();
      dt.items.add(file);
      fixture.nativeElement
        .querySelector('.upload-zone__dropzone')
        .dispatchEvent(new DragEvent('drop', { dataTransfer: dt }));
      fixture.detectChanges();

      expect((component as unknown as { rows: { (): unknown[] } }).rows().length).toBe(1);

      const cancelBtn: HTMLButtonElement = fixture.nativeElement.querySelector('[aria-label="Cancel upload"]');
      cancelBtn.click();
      fixture.detectChanges();

      expect((component as unknown as { rows: { (): unknown[] } }).rows().length).toBe(0);
    });
  });

  describe('retry', () => {
    it('restarts upload on retry', () => {
      let callCount = 0;
      create((_file: File) => {
        callCount++;
        return throwError(() => new Error(`fail-${callCount}`));
      });

      const file = makeFile('photo.jpg', 'image/jpeg', 100);
      const dt = new DataTransfer();
      dt.items.add(file);
      fixture.nativeElement
        .querySelector('.upload-zone__dropzone')
        .dispatchEvent(new DragEvent('drop', { dataTransfer: dt }));
      fixture.detectChanges();

      expect(callCount).toBe(1);

      const retryBtn: HTMLButtonElement = fixture.nativeElement.querySelector('[aria-label="Retry upload"]');
      expect(retryBtn).toBeTruthy();
      retryBtn.click();
      fixture.detectChanges();

      expect(callCount).toBe(2);
    });
  });
});
