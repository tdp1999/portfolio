import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SectionCard, SectionStatus, SectionTabsLayout, StickySaveBar } from '@portfolio/console/shared/ui';

/**
 * DDL ANATOMY — Form page reference. Shows every form-page element from the audit:
 * breadcrumbs + back · title + lede · section-tabs rail (+ show-all toggle) ·
 * required fields + inline validation + rail error status · sticky save bar with
 * dirty indicator · Save (primary) / Cancel · danger zone. Boxed, centered.
 */
@Component({
  selector: 'console-ddl-anatomy-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    SectionCard,
    SectionTabsLayout,
    StickySaveBar,
  ],
  templateUrl: './ddl-anatomy-form.html',
  styleUrl: '../ddl-anatomy.shared.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DdlAnatomyForm {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required]],
    oneLiner: [''],
    description: [''],
    metaTitle: [''],
    metaDescription: [''],
    featured: [false],
    displayOrder: [0],
  });

  readonly activeId = signal('section-basics');
  readonly showAll = signal(false);
  readonly saving = signal(false);

  private readonly dirtyTick = signal(0);
  readonly dirty = computed(() => {
    this.dirtyTick();
    return this.form.dirty;
  });

  // Rail status: Basics shows error until its required title is filled.
  private readonly basicsStatus = computed<SectionStatus>(() => {
    this.dirtyTick();
    if (this.form.controls.title.invalid && this.form.controls.title.touched) return 'error';
    if (this.form.controls.title.value) return 'saved';
    return 'untouched';
  });

  // Rail descriptor — status wired only for Basics to demo the error icon.
  readonly rail = [
    { id: 'section-basics', label: 'Basics', status: this.basicsStatus },
    { id: 'section-content', label: 'Content' },
    { id: 'section-media', label: 'Media' },
    { id: 'section-seo', label: 'SEO / OG' },
    { id: 'section-settings', label: 'Settings' },
  ];

  constructor() {
    this.form.events.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.markDirty());
  }

  markDirty(): void {
    this.dirtyTick.update((n) => n + 1);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.markDirty();
      return;
    }
    this.saving.set(true);
    setTimeout(() => {
      this.saving.set(false);
      this.form.markAsPristine();
      this.markDirty();
    }, 800);
  }

  discard(): void {
    this.form.reset();
    this.markDirty();
  }
}
