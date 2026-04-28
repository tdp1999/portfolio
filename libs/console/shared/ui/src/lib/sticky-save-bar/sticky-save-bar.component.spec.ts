import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { of } from 'rxjs';
import { StickySaveBarComponent } from './sticky-save-bar.component';

@Component({
  standalone: true,
  imports: [StickySaveBarComponent],
  template: `
    <console-sticky-save-bar [dirty]="dirty" [saving]="saving" (save)="saved = true" (discard)="discarded = true" />
  `,
})
class TestHostComponent {
  dirty = signal(true);
  saving = signal(false);
  saved = false;
  discarded = false;
}

describe('StickySaveBarComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;
  let el: HTMLElement;
  let dialog: jest.Mocked<MatDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent, MatDialogModule],
      providers: [
        {
          provide: MatDialog,
          useValue: {
            open: jest.fn().mockReturnValue({ afterClosed: () => of(true) }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    el = fixture.nativeElement;
    dialog = TestBed.inject(MatDialog) as jest.Mocked<MatDialog>;
    fixture.detectChanges();
  });

  it('should always render the save bar', () => {
    expect(el.querySelector('.sticky-save-bar')).toBeTruthy();
    host.dirty.set(false);
    fixture.detectChanges();
    expect(el.querySelector('.sticky-save-bar')).toBeTruthy();
  });

  it('should show "Unsaved changes" indicator when dirty', () => {
    expect(el.querySelector('.sticky-save-bar__indicator')?.textContent).toContain('Unsaved changes');
  });

  it('should show idle indicator when not dirty', () => {
    host.dirty.set(false);
    fixture.detectChanges();
    expect(el.querySelector('.sticky-save-bar__indicator')?.textContent).toContain('No changes yet');
  });

  it('should hide discard button when not dirty', () => {
    host.dirty.set(false);
    fixture.detectChanges();
    const buttons = el.querySelectorAll('.sticky-save-bar__actions button');
    expect(buttons.length).toBe(1);
  });

  it('should emit save on save click even when not dirty', () => {
    host.dirty.set(false);
    fixture.detectChanges();
    const saveBtn = el.querySelector('.sticky-save-bar__actions button') as HTMLButtonElement;
    saveBtn.click();
    expect(host.saved).toBe(true);
  });

  it('should emit discard after confirm dialog approval', async () => {
    const discardBtn = el.querySelectorAll('.sticky-save-bar__actions button')[0] as HTMLButtonElement;
    discardBtn.click();
    await fixture.whenStable();
    expect(dialog.open).toHaveBeenCalled();
    expect(host.discarded).toBe(true);
  });

  it('should not emit discard when dialog is cancelled', async () => {
    dialog.open.mockReturnValue({ afterClosed: () => of(false) } as ReturnType<typeof dialog.open>);
    const discardBtn = el.querySelectorAll('.sticky-save-bar__actions button')[0] as HTMLButtonElement;
    discardBtn.click();
    await fixture.whenStable();
    expect(host.discarded).toBe(false);
  });

  it('should disable save button while saving', () => {
    host.saving.set(true);
    fixture.detectChanges();
    const saveBtn = el.querySelectorAll('.sticky-save-bar__actions button')[1] as HTMLButtonElement;
    expect(saveBtn.disabled).toBe(true);
  });

  it('should keep save button enabled when not saving (regardless of validity)', () => {
    const saveBtn = el.querySelectorAll('.sticky-save-bar__actions button')[1] as HTMLButtonElement;
    expect(saveBtn.disabled).toBe(false);
  });

  it('should show "Saving…" text when saving', () => {
    host.saving.set(true);
    fixture.detectChanges();
    const saveBtn = el.querySelectorAll('.sticky-save-bar__actions button')[1] as HTMLButtonElement;
    expect(saveBtn.textContent?.trim()).toBe('Saving…');
  });

  it('should disable discard button when saving', () => {
    host.saving.set(true);
    fixture.detectChanges();
    const discardBtn = el.querySelectorAll('.sticky-save-bar__actions button')[0] as HTMLButtonElement;
    expect(discardBtn.disabled).toBe(true);
  });
});
