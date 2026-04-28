import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  HostListener,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  SectionCardComponent,
  SpinnerOverlayComponent,
  StickySaveBarComponent,
  ToastService,
} from '@portfolio/console/shared/ui';
import {
  baselineFor,
  extractApiError,
  FormErrorPipe,
  HasUnsavedChanges,
  onBeforeUnload,
  scrollToFirstError,
} from '@portfolio/console/shared/util';
import { LIMITS } from '@portfolio/shared/validation';
import { CategoryService } from '../category.service';

@Component({
  selector: 'console-category-form-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    SectionCardComponent,
    SpinnerOverlayComponent,
    StickySaveBarComponent,
    FormErrorPipe,
  ],
  templateUrl: './category-form-page.html',
  styleUrl: './category-form-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class CategoryFormPageComponent implements OnInit, HasUnsavedChanges {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly categoryService = inject(CategoryService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly id = signal<string | null>(null);
  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly serverError = signal('');
  readonly dirty = signal(false);

  readonly isEditMode = computed(() => this.id() !== null);
  readonly isInvalid = signal(false);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(LIMITS.NAME_MAX)]],
    description: ['', baselineFor.longText(LIMITS.DESCRIPTION_SHORT_MAX)],
    displayOrder: [0, baselineFor.displayOrder()],
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
      this.id.set(idParam);
      this.load(idParam);
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
      this.load(editId);
    } else {
      this.form.reset({ name: '', description: '', displayOrder: 0 });
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
    this.serverError.set('');

    const { name, description, displayOrder } = this.form.getRawValue();
    const editId = this.id();

    const onError = (err: HttpErrorResponse) => {
      this.submitting.set(false);
      const apiError = extractApiError(err);
      this.serverError.set(apiError?.message ?? 'Failed to save category');
    };

    if (editId) {
      this.categoryService.update(editId, { name, description: description || null, displayOrder }).subscribe({
        next: () => {
          this.dirty.set(false);
          this.toast.success('Category updated');
          this.router.navigate(['/categories', editId]);
        },
        error: onError,
      });
    } else {
      this.categoryService.create({ name, description: description || undefined, displayOrder }).subscribe({
        next: (res) => {
          this.dirty.set(false);
          this.toast.success('Category created');
          this.router.navigate(['/categories', res.id]);
        },
        error: onError,
      });
    }
  }

  private load(id: string): void {
    this.loading.set(true);
    this.categoryService.getById(id).subscribe({
      next: (category) => {
        this.form.setValue({
          name: category.name,
          description: category.description ?? '',
          displayOrder: category.displayOrder,
        });
        this.dirty.set(false);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Failed to load category');
        this.loading.set(false);
        this.router.navigate(['/categories']);
      },
    });
  }
}
