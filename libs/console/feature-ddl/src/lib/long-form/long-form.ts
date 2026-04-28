import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RouterLink } from '@angular/router';
import {
  FormSnapshotDirective,
  LongFormLayoutComponent,
  ScrollspyRailComponent,
  SectionCardComponent,
  SectionDescriptor,
  SectionStatus,
  StickySaveBarComponent,
  ToastService,
  TranslatableGroupComponent,
} from '@portfolio/console/shared/ui';
import { HasUnsavedChanges } from '@portfolio/console/shared/util';

/**
 * Demo page for the long-form chassis (ADR-013 / ADR-014).
 *
 * Wires together:
 * - LongFormLayoutComponent (rail + content grid)
 * - ScrollspyRailComponent (4 sections, one per status icon)
 * - SectionCardComponent × 4 (two per-section, two atomic)
 * - StickySaveBarComponent (atomic flow)
 * - UnsavedChangesGuard (via HasUnsavedChanges)
 *
 * Also demonstrates the bilingual FormGroup convention: nested
 * `{ en: FormControl, vi: FormControl }` under a single field key.
 */
@Component({
  selector: 'console-ddl-long-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    LongFormLayoutComponent,
    ScrollspyRailComponent,
    SectionCardComponent,
    FormSnapshotDirective,
    StickySaveBarComponent,
    TranslatableGroupComponent,
  ],
  templateUrl: './long-form.html',
  styleUrl: './long-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class LongFormDemoComponent implements HasUnsavedChanges {
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);

  // --- Per-section forms (status: editing, saved) ---

  /** Basics — demonstrates the recommended nested bilingual shape: { name: { en, vi } } */
  readonly basicsForm = this.fb.group({
    name: this.fb.group({
      en: this.fb.control('Phuong Tran', { nonNullable: true, validators: [Validators.required] }),
      vi: this.fb.control('Phương Trần', { nonNullable: true, validators: [Validators.required] }),
    }),
    title: this.fb.group({
      en: this.fb.control('Senior Software Engineer', { nonNullable: true }),
      vi: this.fb.control('Kỹ sư phần mềm cao cấp', { nonNullable: true }),
    }),
  });

  /** Contact — single-language fields */
  readonly contactForm = this.fb.group({
    email: this.fb.control('hello@thunderphong.com', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    phone: this.fb.control('', { nonNullable: true }),
  });

  // --- Atomic forms (status: untouched, error) ---

  /** Skills — atomic mode, starts untouched */
  readonly skillsForm = this.fb.group({
    primaryStack: this.fb.control('Angular, NestJS, TypeScript', { nonNullable: true }),
    yearsOfExperience: this.fb.control(10, { nonNullable: true, validators: [Validators.min(0)] }),
  });

  /** Achievements — atomic mode, starts with an error to surface the ⚠ icon */
  readonly achievementsForm = this.fb.group({
    summary: this.fb.control('', { nonNullable: true, validators: [Validators.required] }),
  });

  // --- Section statuses (each card = one of the 4 statuses) ---

  private readonly basicsStatus = signal<SectionStatus>('editing');
  private readonly contactStatus = signal<SectionStatus>('saved');
  private readonly skillsStatus = signal<SectionStatus>('untouched');
  private readonly achievementsStatus = signal<SectionStatus>('error');

  readonly sections: SectionDescriptor[] = [
    { id: 'section-basics', label: 'Basics', status: this.basicsStatus.asReadonly() },
    { id: 'section-contact', label: 'Contact', status: this.contactStatus.asReadonly() },
    { id: 'section-skills', label: 'Skills', status: this.skillsStatus.asReadonly() },
    { id: 'section-achievements', label: 'Achievements', status: this.achievementsStatus.asReadonly() },
  ];

  // --- Per-section save state (Basics, Contact) ---

  readonly basicsSaving = signal(false);
  readonly basicsLastSavedAt = signal<Date | null>(null);
  readonly basicsError = signal<string | null>(null);

  readonly contactSaving = signal(false);
  readonly contactLastSavedAt = signal<Date | null>(new Date(Date.now() - 30_000));
  readonly contactError = signal<string | null>(null);

  // --- Atomic save state (Skills + Achievements) ---

  readonly atomicSaving = signal(false);
  /** Dirty = any atomic section has unsaved edits */
  readonly atomicDirty = signal(false);

  constructor() {
    // Track atomic dirty state from both atomic forms
    const updateDirty = (): void => {
      this.atomicDirty.set(this.skillsForm.dirty || this.achievementsForm.dirty);
    };
    this.skillsForm.events.subscribe(updateDirty);
    this.achievementsForm.events.subscribe(updateDirty);
  }

  // --- Per-section save handlers ---

  saveBasics(): void {
    this.basicsSaving.set(true);
    this.basicsError.set(null);
    setTimeout(() => {
      this.basicsSaving.set(false);
      this.basicsForm.markAsPristine();
      this.basicsStatus.set('saved');
      this.basicsLastSavedAt.set(new Date());
      this.toast.success('Basics saved');
    }, 600);
  }

  saveContact(): void {
    this.contactSaving.set(true);
    this.contactError.set(null);
    setTimeout(() => {
      this.contactSaving.set(false);
      this.contactForm.markAsPristine();
      this.contactStatus.set('saved');
      this.contactLastSavedAt.set(new Date());
      this.toast.success('Contact saved');
    }, 600);
  }

  // --- Atomic save handlers ---

  saveAtomic(): void {
    if (this.achievementsForm.invalid) {
      this.achievementsStatus.set('error');
      this.toast.error('Fix errors before saving');
      return;
    }
    this.atomicSaving.set(true);
    setTimeout(() => {
      this.atomicSaving.set(false);
      this.skillsForm.markAsPristine();
      this.achievementsForm.markAsPristine();
      this.atomicDirty.set(false);
      this.skillsStatus.set('saved');
      this.achievementsStatus.set('saved');
      this.toast.success('All changes saved');
    }, 800);
  }

  discardAtomic(): void {
    this.skillsForm.reset({ primaryStack: 'Angular, NestJS, TypeScript', yearsOfExperience: 10 });
    this.achievementsForm.reset({ summary: '' });
    this.skillsForm.markAsPristine();
    this.achievementsForm.markAsPristine();
    this.atomicDirty.set(false);
    this.skillsStatus.set('untouched');
    this.achievementsStatus.set('error');
  }

  // --- UnsavedChangesGuard contract ---

  readonly isDirty = computed(
    () => this.basicsForm.dirty || this.contactForm.dirty || this.skillsForm.dirty || this.achievementsForm.dirty
  );

  hasUnsavedChanges() {
    return this.isDirty;
  }
}
