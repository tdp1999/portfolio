import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { EMPTY, Subject, of, throwError } from 'rxjs';
import { MEDIA_PICKER_MIN_LOADING_MS, type MediaItem } from '@portfolio/console/shared/util';
import { ToastService } from '../../services/toast/toast.service';
import MediaPickerDialog from './media-picker-dialog';
import type { MediaPickerDataSource, MediaPickerDialogData } from './media-picker-dialog.types';

function makeItem(id: string, overrides: Partial<MediaItem> = {}): MediaItem {
  return {
    id,
    originalFilename: `a-rather-long-original-filename-${id}.png`,
    mimeType: 'image/png',
    url: `https://cdn.example.com/${id}.png`,
    format: 'png',
    bytes: 250_880,
    width: 1200,
    height: 800,
    altText: null,
    caption: null,
    folder: 'general',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

const LIBRARY = [makeItem('a'), makeItem('b')];

describe('MediaPickerDialog — naming the selection', () => {
  let fixture: ComponentFixture<MediaPickerDialog>;
  let component: MediaPickerDialog;
  let getByIdSilent: jest.Mock;

  /**
   * Waits out the picker's MEDIA_PICKER_MIN_LOADING_MS anti-flicker delay and settles
   * the resulting render. Real timers: the zoneless `whenStable()` never resolves
   * under jest's fake clock.
   */
  async function settle(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, MEDIA_PICKER_MIN_LOADING_MS + 50));
    await fixture.whenStable();
    fixture.detectChanges();
  }

  async function setup(
    data: Partial<MediaPickerDialogData> = {},
    resolver: (id: string) => ReturnType<MediaPickerDataSource['getByIdSilent']> = (id) => of(makeItem(id))
  ): Promise<void> {
    getByIdSilent = jest.fn(resolver);
    const dataSource: MediaPickerDataSource = {
      list: jest.fn(() => of({ data: LIBRARY, total: LIBRARY.length, page: 1, limit: 24 })),
      upload: jest.fn(() => EMPTY),
      getById: jest.fn((id: string) => of(makeItem(id))),
      getByIdSilent: (id: string) => getByIdSilent(id),
      update: jest.fn(() => of({ success: true })),
    };

    TestBed.configureTestingModule({
      imports: [MediaPickerDialog, NoopAnimationsModule],
      providers: [
        {
          provide: MatDialogRef,
          useValue: { close: jest.fn(), keydownEvents: () => EMPTY, backdropClick: () => EMPTY },
        },
        {
          provide: MAT_DIALOG_DATA,
          useValue: { mode: 'multi', dataSource, ...data } satisfies MediaPickerDialogData,
        },
      ],
    });

    fixture = TestBed.createComponent(MediaPickerDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await settle();
  }

  /** Multi mode renders the selection in the rail; single mode in the footer line. */
  function railNames(): string[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.picker__rail-name')).map((el) =>
      (el as HTMLElement).textContent?.trim()
    ) as string[];
  }

  function footerSummary(): string {
    return (fixture.nativeElement.querySelector('.picker__summary') as HTMLElement | null)?.textContent?.trim() ?? '';
  }

  function attemptsFor(id: string): number {
    return getByIdSilent.mock.calls.filter(([called]) => called === id).length;
  }

  describe('multi mode', () => {
    it('shows an empty rail while nothing is selected', async () => {
      await setup();

      expect(railNames()).toEqual([]);
      expect(fixture.nativeElement.querySelector('.picker__rail-empty')).toBeTruthy();
      // The footer one-liner belongs to single mode; the rail replaces it here.
      expect(fixture.nativeElement.querySelector('.picker__summary')).toBeNull();
    });

    it('names every selected file in the rail', async () => {
      await setup();

      component['onSelectionChange'](['a', 'b']);
      fixture.detectChanges();

      expect(railNames()).toEqual(['a-rather-long-original-filename-a.png', 'a-rather-long-original-filename-b.png']);
    });

    it('drops one asset from the selection without touching its card', async () => {
      await setup();
      component['onSelectionChange'](['a', 'b']);
      fixture.detectChanges();

      component['deselect']('a');
      fixture.detectChanges();

      expect(railNames()).toEqual(['a-rather-long-original-filename-b.png']);
      expect([...component.selected()]).toEqual(['b']);
    });

    it('fetches a pre-selected asset that is not on the current page so it can still be named', async () => {
      await setup({ selectedIds: ['off-page'] });

      expect(attemptsFor('off-page')).toBe(1);
      expect(railNames()).toEqual(['a-rather-long-original-filename-off-page.png']);
    });

    it('does not retry an unresolvable id when the library reloads', async () => {
      await setup({ selectedIds: ['deleted'] }, () => throwError(() => new Error('404')));

      expect(attemptsFor('deleted')).toBe(1);
      expect(railNames()).toEqual([]);

      component['onPageChange'](2);
      await settle();

      expect(attemptsFor('deleted')).toBe(1);
    });
  });

  describe('single mode', () => {
    it('names the pick in full on one footer line, with type and size', async () => {
      await setup({ mode: 'single' });

      component['onSelectionChange'](['a']);
      fixture.detectChanges();

      // A rail would be a permanently near-empty column when only one asset can
      // ever be selected.
      expect(fixture.nativeElement.querySelector('.picker__rail')).toBeNull();
      expect(footerSummary()).toBe('a-rather-long-original-filename-a.png · PNG · 245.0 KB · 1200×800');
    });

    it('says nothing while nothing is selected', async () => {
      await setup({ mode: 'single' });

      expect(footerSummary()).toBe('');
    });
  });

  // Guards the footer against the growth that pushed the action buttons off-screen:
  // the summary stays one line no matter how many assets are selected.
  it('collapses a large selection into a counted one-liner in single-mode layout', async () => {
    await setup({ mode: 'single' });

    component['selected'].set(new Set(['a', 'b']));
    fixture.detectChanges();

    expect(component.selectionSummary()).toBe(
      '2 selected: a-rather-long-original-filename-a.png, a-rather-long-original-filename-b.png'
    );
  });
});

/**
 * The upload flow used to end by jumping to the Library tab and silently selecting
 * the new asset: no confirmation, no preview, and nowhere to write the caption and
 * alt text. These tests pin the replacement.
 */
describe('MediaPickerDialog — after an upload finishes', () => {
  let fixture: ComponentFixture<MediaPickerDialog>;
  let component: MediaPickerDialog;
  let update: jest.Mock;
  let toast: { success: jest.Mock; error: jest.Mock };

  async function settle(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, MEDIA_PICKER_MIN_LOADING_MS + 50));
    await fixture.whenStable();
    fixture.detectChanges();
  }

  async function setup(
    mode: 'single' | 'multi' = 'multi',
    updateImpl: () => ReturnType<MediaPickerDataSource['update']> = () => of({ success: true })
  ): Promise<void> {
    update = jest.fn(updateImpl);
    toast = { success: jest.fn(), error: jest.fn() };

    const dataSource: MediaPickerDataSource = {
      list: jest.fn(() => of({ data: LIBRARY, total: LIBRARY.length, page: 1, limit: 24 })),
      upload: jest.fn(() => EMPTY),
      getById: jest.fn((id: string) => of(makeItem(id))),
      getByIdSilent: jest.fn((id: string) => of(makeItem(id))),
      update: (id: string, payload) => update(id, payload),
    };

    TestBed.configureTestingModule({
      imports: [MediaPickerDialog, NoopAnimationsModule],
      providers: [
        {
          provide: MatDialogRef,
          useValue: { close: jest.fn(), keydownEvents: () => EMPTY, backdropClick: () => EMPTY },
        },
        { provide: MAT_DIALOG_DATA, useValue: { mode, dataSource } satisfies MediaPickerDialogData },
        { provide: ToastService, useValue: toast },
      ],
    });

    fixture = TestBed.createComponent(MediaPickerDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await settle();
  }

  /** Simulate the upload zone reporting a finished batch. */
  function completeUpload(items: MediaItem[]): void {
    (component as unknown as { onUploadsComplete(v: MediaItem[]): void }).onUploadsComplete(items);
    fixture.detectChanges();
  }

  const reviewCards = () => fixture.nativeElement.querySelectorAll('.picker__review-card');

  it('stays on the Upload tab instead of jumping to Library', async () => {
    await setup();
    component.activeTab.set('upload');
    fixture.detectChanges();

    completeUpload([makeItem('new-1')]);

    expect(component.activeTab()).toBe('upload');
  });

  it('confirms the upload with a toast', async () => {
    await setup();
    completeUpload([makeItem('new-1')]);

    expect(toast.success).toHaveBeenCalledWith('Uploaded a-rather-long-original-filename-new-1.png');
  });

  it('counts the files when more than one lands', async () => {
    await setup();
    completeUpload([makeItem('new-1'), makeItem('new-2')]);

    expect(toast.success).toHaveBeenCalledWith('Uploaded 2 files');
  });

  it('shows a review card per uploaded file, with caption and alt inputs', async () => {
    await setup();
    component.activeTab.set('upload');
    fixture.detectChanges();
    completeUpload([makeItem('new-1'), makeItem('new-2')]);

    expect(reviewCards().length).toBe(2);
    expect(fixture.nativeElement.querySelectorAll('.picker__review-fields mat-form-field').length).toBe(4);
  });

  it('does not select anything until the author says to use the files', async () => {
    await setup();
    completeUpload([makeItem('new-1')]);

    expect(component.selected().size).toBe(0);
  });

  it('selects everything and crosses to Library on "Use these files"', async () => {
    await setup();
    component.activeTab.set('upload');
    fixture.detectChanges();
    completeUpload([makeItem('new-1'), makeItem('new-2')]);

    (component as unknown as { useUploadedFiles(): void }).useUploadedFiles();
    fixture.detectChanges();

    expect([...component.selected()]).toEqual(['new-1', 'new-2']);
    expect(component.activeTab()).toBe('library');
    expect(component.justUploaded()).toEqual([]);
  });

  it('keeps single mode to one asset — the last one uploaded', async () => {
    await setup('single');
    completeUpload([makeItem('new-1'), makeItem('new-2')]);

    (component as unknown as { useUploadedFiles(): void }).useUploadedFiles();

    expect([...component.selected()]).toEqual(['new-2']);
  });

  it('saves a caption on blur', async () => {
    await setup();
    const blur = (
      component as unknown as {
        onReviewFieldBlur(id: string, f: 'altText' | 'caption', v: string): void;
      }
    ).onReviewFieldBlur.bind(component);
    completeUpload([makeItem('new-1')]);

    blur('new-1', 'caption', 'Builder + table');

    expect(update).toHaveBeenCalledWith('new-1', { caption: 'Builder + table' });
    expect(component.justUploaded()[0].caption).toBe('Builder + table');
  });

  it('stores a cleared field as null, not an empty string', async () => {
    await setup();
    const blur = (
      component as unknown as {
        onReviewFieldBlur(id: string, f: 'altText' | 'caption', v: string): void;
      }
    ).onReviewFieldBlur.bind(component);
    completeUpload([makeItem('new-1', { altText: 'Old alt' })]);

    blur('new-1', 'altText', '   ');

    expect(update).toHaveBeenCalledWith('new-1', { altText: null });
  });

  it('does not call the API when the value has not changed', async () => {
    await setup();
    const blur = (
      component as unknown as {
        onReviewFieldBlur(id: string, f: 'altText' | 'caption', v: string): void;
      }
    ).onReviewFieldBlur.bind(component);
    completeUpload([makeItem('new-1', { caption: 'Same' })]);

    blur('new-1', 'caption', 'Same');

    expect(update).not.toHaveBeenCalled();
  });

  // A field that keeps showing the typed value after a failed save is lying about
  // what is stored.
  it('rolls the field back and warns when the save fails', async () => {
    await setup('multi', () => throwError(() => new Error('boom')));
    const blur = (
      component as unknown as {
        onReviewFieldBlur(id: string, f: 'altText' | 'caption', v: string): void;
      }
    ).onReviewFieldBlur.bind(component);
    completeUpload([makeItem('new-1', { caption: 'Original' })]);

    blur('new-1', 'caption', 'Typed but doomed');

    expect(component.justUploaded()[0].caption).toBe('Original');
    expect(toast.error).toHaveBeenCalledWith('Could not save the caption');
  });

  // Two quick edits can resolve out of order. A rollback must only undo ITS OWN
  // write; restoring the value captured when the first save started would resurrect
  // text the author has already replaced.
  it('does not roll a newer edit back when an older save fails', async () => {
    const firstSave = new Subject<{ success: boolean }>();
    let call = 0;
    await setup('multi', () => (++call === 1 ? firstSave : of({ success: true })));
    const blur = (
      component as unknown as {
        onReviewFieldBlur(id: string, f: 'altText' | 'caption', v: string): void;
      }
    ).onReviewFieldBlur.bind(component);
    completeUpload([makeItem('new-1', { caption: 'Original' })]);

    blur('new-1', 'caption', 'First edit');
    blur('new-1', 'caption', 'Second edit');
    firstSave.error(new Error('boom'));

    expect(component.justUploaded()[0].caption).toBe('Second edit');
  });

  it('dismisses a review card without touching the selection', async () => {
    await setup();
    component.activeTab.set('upload');
    fixture.detectChanges();
    completeUpload([makeItem('new-1'), makeItem('new-2')]);

    (component as unknown as { dismissUploaded(id: string): void }).dismissUploaded('new-1');
    fixture.detectChanges();

    expect(component.justUploaded().map((i) => i.id)).toEqual(['new-2']);
    expect(reviewCards().length).toBe(1);
  });
});
