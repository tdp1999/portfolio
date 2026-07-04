import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  HostListener,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import {
  ChipBoolean,
  HasUnsavedChanges,
  onBeforeUnload,
  SectionCard,
  SpinnerOverlay,
  StickySaveBar,
  ToastService,
} from '@portfolio/console/shared/ui';
import { FormErrorPipe, ServerErrorDirective, scrollToFirstError } from '@portfolio/console/shared/util';
import { LIMITS } from '@portfolio/shared/validation';
import { AboutFailureService } from '../about-failure.service';
import { AdminAboutFailure } from '../about-failure.types';

@Component({
  selector: 'console-failure-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    ChipBoolean,
    SectionCard,
    SpinnerOverlay,
    StickySaveBar,
    FormErrorPipe,
    ServerErrorDirective,
  ],
  templateUrl: './failure.form.html',
  styleUrl: './failure.form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class FailureForm implements OnInit, HasUnsavedChanges {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly failureService = inject(AboutFailureService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly id = signal<string | null>(null);
  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly dirty = signal(false);
  readonly isInvalid = signal(false);
  readonly isEditMode = computed(() => this.id() !== null);

  readonly currentYear = new Date().getFullYear();
  readonly yearMin = LIMITS.FAILURE_YEAR_MIN;

  readonly form = this.fb.nonNullable.group({
    year: [
      this.currentYear,
      [Validators.required, Validators.min(LIMITS.FAILURE_YEAR_MIN), Validators.max(this.currentYear)],
    ],
    contextEn: ['', [Validators.required, Validators.maxLength(LIMITS.FAILURE_CONTEXT_MAX)]],
    contextVi: ['', [Validators.maxLength(LIMITS.FAILURE_CONTEXT_MAX)]],
    decisionEn: ['', [Validators.required, Validators.maxLength(LIMITS.FAILURE_NARRATIVE_MAX)]],
    decisionVi: ['', [Validators.maxLength(LIMITS.FAILURE_NARRATIVE_MAX)]],
    consequenceEn: ['', [Validators.required, Validators.maxLength(LIMITS.FAILURE_NARRATIVE_MAX)]],
    consequenceVi: ['', [Validators.maxLength(LIMITS.FAILURE_NARRATIVE_MAX)]],
    lessonEn: ['', [Validators.required, Validators.maxLength(LIMITS.FAILURE_NARRATIVE_MAX)]],
    lessonVi: ['', [Validators.maxLength(LIMITS.FAILURE_NARRATIVE_MAX)]],
    isPublished: [true],
  });

  ngOnInit(): void {
    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.dirty.set(true);
      this.isInvalid.set(this.form.invalid);
    });
    this.form.statusChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.isInvalid.set(this.form.invalid);
    });

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.loading.set(true);
      this.failureService.getById(idParam).subscribe({
        next: (f) => {
          this.id.set(f.id);
          this.applyFailure(f);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.router.navigate(['/about/failures']);
        },
      });
    }
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    onBeforeUnload(event, this.dirty());
  }

  hasUnsavedChanges() {
    return this.dirty;
  }

  discard(): void {
    const editId = this.id();
    if (editId) {
      this.failureService.getById(editId).subscribe({
        next: (f) => this.applyFailure(f),
      });
    } else {
      this.form.reset({
        year: this.currentYear,
        contextEn: '',
        contextVi: '',
        decisionEn: '',
        decisionVi: '',
        consequenceEn: '',
        consequenceVi: '',
        lessonEn: '',
        lessonVi: '',
        isPublished: true,
      });
      this.dirty.set(false);
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      scrollToFirstError();
      return;
    }

    this.submitting.set(true);
    const raw = this.form.getRawValue();
    const payload = {
      year: raw.year,
      context: { en: raw.contextEn.trim(), vi: raw.contextVi.trim() },
      decision: { en: raw.decisionEn.trim(), vi: raw.decisionVi.trim() },
      consequence: { en: raw.consequenceEn.trim(), vi: raw.consequenceVi.trim() },
      lesson: { en: raw.lessonEn.trim(), vi: raw.lessonVi.trim() },
      isPublished: raw.isPublished,
    };

    const onError = () => this.submitting.set(false);
    const editId = this.id();

    if (editId) {
      this.failureService.update(editId, payload).subscribe({
        next: () => {
          this.dirty.set(false);
          this.toast.success('Failure updated');
          this.router.navigate(['/about/failures']);
        },
        error: onError,
      });
    } else {
      this.failureService.create(payload).subscribe({
        next: () => {
          this.dirty.set(false);
          this.toast.success('Failure created');
          this.router.navigate(['/about/failures']);
        },
        error: onError,
      });
    }
  }

  private applyFailure(f: AdminAboutFailure): void {
    this.form.setValue({
      year: f.year,
      contextEn: f.context.en,
      contextVi: f.context.vi ?? '',
      decisionEn: f.decision.en,
      decisionVi: f.decision.vi ?? '',
      consequenceEn: f.consequence.en,
      consequenceVi: f.consequence.vi ?? '',
      lessonEn: f.lesson.en,
      lessonVi: f.lesson.vi ?? '',
      isPublished: f.isPublished,
    });
    this.dirty.set(false);
  }
}
