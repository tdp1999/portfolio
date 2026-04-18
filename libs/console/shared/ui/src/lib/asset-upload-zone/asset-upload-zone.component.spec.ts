import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { AssetUploadZoneComponent } from './asset-upload-zone.component';
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
  let fixture: ComponentFixture<AssetUploadZoneComponent>;
  let component: AssetUploadZoneComponent;

  function create(uploadFn: UploadFn) {
    TestBed.configureTestingModule({
      imports: [AssetUploadZoneComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(AssetUploadZoneComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('uploadFn', uploadFn);
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
      expect(fill!.style.width).toBe('50%');
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
      const progress$ = new Subject<UploadProgress>();
      create((file: File) => {
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
