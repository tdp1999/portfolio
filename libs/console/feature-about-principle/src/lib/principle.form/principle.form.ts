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
import { AboutPrincipleService } from '../about-principle.service';
import { AdminAboutPrinciple } from '../about-principle.types';

@Component({
  selector: 'console-principle-form',
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
  templateUrl: './principle.form.html',
  styleUrl: './principle.form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PrincipleForm implements OnInit, HasUnsavedChanges {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly principleService = inject(AboutPrincipleService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly id = signal<string | null>(null);
  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly dirty = signal(false);
  readonly isInvalid = signal(false);
  readonly isEditMode = computed(() => this.id() !== null);

  readonly form = this.fb.nonNullable.group({
    claimEn: ['', [Validators.required, Validators.maxLength(LIMITS.PRINCIPLE_CLAIM_MAX)]],
    claimVi: ['', [Validators.maxLength(LIMITS.PRINCIPLE_CLAIM_MAX)]],
    expansionEn: ['', [Validators.required, Validators.maxLength(LIMITS.PRINCIPLE_EXPANSION_MAX)]],
    expansionVi: ['', [Validators.maxLength(LIMITS.PRINCIPLE_EXPANSION_MAX)]],
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
      this.principleService.getById(idParam).subscribe({
        next: (p) => {
          this.id.set(p.id);
          this.applyPrinciple(p);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.router.navigate(['/about/principles']);
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
      this.principleService.getById(editId).subscribe({
        next: (p) => this.applyPrinciple(p),
      });
    } else {
      this.form.reset({
        claimEn: '',
        claimVi: '',
        expansionEn: '',
        expansionVi: '',
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
      claim: { en: raw.claimEn.trim(), vi: raw.claimVi.trim() },
      expansion: { en: raw.expansionEn.trim(), vi: raw.expansionVi.trim() },
      isPublished: raw.isPublished,
    };

    const onError = () => this.submitting.set(false);
    const editId = this.id();

    if (editId) {
      this.principleService.update(editId, payload).subscribe({
        next: () => {
          this.dirty.set(false);
          this.toast.success('Principle updated');
          this.router.navigate(['/about/principles']);
        },
        error: onError,
      });
    } else {
      this.principleService.create(payload).subscribe({
        next: () => {
          this.dirty.set(false);
          this.toast.success('Principle created');
          this.router.navigate(['/about/principles']);
        },
        error: onError,
      });
    }
  }

  private applyPrinciple(p: AdminAboutPrinciple): void {
    this.form.setValue({
      claimEn: p.claim.en,
      claimVi: p.claim.vi ?? '',
      expansionEn: p.expansion.en,
      expansionVi: p.expansion.vi ?? '',
      isPublished: p.isPublished,
    });
    this.dirty.set(false);
  }
}
