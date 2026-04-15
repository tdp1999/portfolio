import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { of } from 'rxjs';
import { StickySaveBarComponent } from './sticky-save-bar.component';

@Component({
  standalone: true,
  imports: [StickySaveBarComponent],
  template: `
    <console-sticky-save-bar
      [dirty]="dirty"
      [saving]="saving"
      [disabled]="disabled"
      (save)="saved = true"
      (discard)="discarded = true"
    />
  `,
})
class TestHostComponent {
  dirty = signal(true);
  saving = signal(false);
  disabled = signal(false);
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

  it('should render when dirty is true', () => {
    expect(el.querySelector('.sticky-save-bar')).toBeTruthy();
  });

  it('should not render when dirty is false', () => {
    host.dirty.set(false);
    fixture.detectChanges();
    expect(el.querySelector('.sticky-save-bar')).toBeFalsy();
  });

  it('should show "Unsaved changes" indicator', () => {
    expect(el.querySelector('.sticky-save-bar__indicator')?.textContent).toContain('Unsaved changes');
  });

  it('should emit save on save click', () => {
    const saveBtn = el.querySelectorAll('.sticky-save-bar__actions button')[1] as HTMLButtonElement;
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
    dialog.open.mockReturnValue({ afterClosed: () => of(false) } as any);
    const discardBtn = el.querySelectorAll('.sticky-save-bar__actions button')[0] as HTMLButtonElement;
    discardBtn.click();
    await fixture.whenStable();
    expect(host.discarded).toBe(false);
  });

  it('should disable save button when saving', () => {
    host.saving.set(true);
    fixture.detectChanges();
    const saveBtn = el.querySelectorAll('.sticky-save-bar__actions button')[1] as HTMLButtonElement;
    expect(saveBtn.disabled).toBe(true);
  });

  it('should disable save button when disabled signal is true', () => {
    host.disabled.set(true);
    fixture.detectChanges();
    const saveBtn = el.querySelectorAll('.sticky-save-bar__actions button')[1] as HTMLButtonElement;
    expect(saveBtn.disabled).toBe(true);
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
