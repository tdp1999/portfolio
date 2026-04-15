import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SectionCardComponent } from './section-card.component';

@Component({
  standalone: true,
  imports: [SectionCardComponent, ReactiveFormsModule],
  template: `
    <console-section-card
      [id]="sectionId"
      [title]="title"
      [description]="description"
      [saveMode]="saveMode"
      [formGroup]="formGroup"
      [saving]="saving"
      [lastSavedAt]="lastSavedAt"
      [errorMessage]="errorMessage"
      (save)="saved = true"
    >
      <input [formControl]="formGroup.controls.name" />
    </console-section-card>
  `,
})
class PerSectionHostComponent {
  sectionId = 'identity';
  title = 'Identity';
  description = 'Your public profile info';
  saveMode: 'per-section' | 'atomic' = 'per-section';
  formGroup = new FormGroup({ name: new FormControl('Alice') });
  saving = signal(false);
  lastSavedAt = signal<Date | null>(null);
  errorMessage = signal<string | null>(null);
  saved = false;
}

@Component({
  standalone: true,
  imports: [SectionCardComponent],
  template: ` <console-section-card id="work" title="Work" description="Your work history" saveMode="atomic" /> `,
})
class AtomicHostComponent {}

describe('SectionCardComponent', () => {
  describe('per-section mode', () => {
    let fixture: ComponentFixture<PerSectionHostComponent>;
    let host: PerSectionHostComponent;
    let el: HTMLElement;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [PerSectionHostComponent],
      }).compileComponents();

      fixture = TestBed.createComponent(PerSectionHostComponent);
      host = fixture.componentInstance;
      el = fixture.nativeElement;
      fixture.detectChanges();
    });

    it('should render the section with correct id attribute', () => {
      const section = el.querySelector('.section-card');
      expect(section?.getAttribute('id')).toBe('identity');
    });

    it('should render title and description', () => {
      expect(el.querySelector('.text-section-heading')?.textContent?.trim()).toBe('Identity');
      expect(el.querySelector('.section-card__description p')?.textContent?.trim()).toBe('Your public profile info');
    });

    it('should project form content', () => {
      expect(el.querySelector('.section-card__form input')).toBeTruthy();
    });

    it('should show footer in per-section mode', () => {
      expect(el.querySelector('.section-card__footer')).toBeTruthy();
    });

    it('should disable save button when form is not dirty', () => {
      const saveBtn = el.querySelectorAll('.section-card__footer-actions button')[1] as HTMLButtonElement;
      expect(saveBtn.disabled).toBe(true);
    });

    it('should enable save button when form is dirty and valid', () => {
      // Changing via the control triggers reactive forms' internal notifications
      host.formGroup.controls.name.setValue('Bob');
      host.formGroup.controls.name.markAsDirty();
      fixture.detectChanges();
      const saveBtn = el.querySelectorAll('.section-card__footer-actions button')[1] as HTMLButtonElement;
      expect(saveBtn.disabled).toBe(false);
    });

    it('should emit save event on save click', () => {
      host.formGroup.controls.name.setValue('Bob');
      host.formGroup.controls.name.markAsDirty();
      fixture.detectChanges();
      const saveBtn = el.querySelectorAll('.section-card__footer-actions button')[1] as HTMLButtonElement;
      saveBtn.click();
      fixture.detectChanges();
      expect(host.saved).toBe(true);
    });

    it('should show dirty indicator dot when form is dirty', () => {
      host.formGroup.controls.name.setValue('Bob');
      host.formGroup.controls.name.markAsDirty();
      fixture.detectChanges();
      expect(el.querySelector('.section-card__dirty-dot')).toBeTruthy();
    });

    it('should not show dirty dot when form is pristine', () => {
      expect(el.querySelector('.section-card__dirty-dot')).toBeFalsy();
    });

    it('should show error message when set', () => {
      host.errorMessage.set('Save failed');
      fixture.detectChanges();
      const error = el.querySelector('.section-card__error');
      expect(error?.textContent?.trim()).toBe('Save failed');
    });

    it('should disable save button when saving', () => {
      host.formGroup.controls.name.setValue('Bob');
      host.formGroup.controls.name.markAsDirty();
      host.saving.set(true);
      fixture.detectChanges();
      const saveBtn = el.querySelectorAll('.section-card__footer-actions button')[1] as HTMLButtonElement;
      expect(saveBtn.disabled).toBe(true);
    });
  });

  describe('atomic mode', () => {
    let fixture: ComponentFixture<AtomicHostComponent>;
    let el: HTMLElement;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [AtomicHostComponent],
      }).compileComponents();

      fixture = TestBed.createComponent(AtomicHostComponent);
      el = fixture.nativeElement;
      fixture.detectChanges();
    });

    it('should not render footer in atomic mode', () => {
      expect(el.querySelector('.section-card__footer')).toBeFalsy();
    });

    it('should render the section with correct id', () => {
      expect(el.querySelector('.section-card')?.getAttribute('id')).toBe('work');
    });
  });
});
