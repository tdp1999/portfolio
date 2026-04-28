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
import {
  SectionCardComponent,
  SpinnerOverlayComponent,
  StickySaveBarComponent,
  ToastService,
} from '@portfolio/console/shared/ui';
import {
  extractApiError,
  FormErrorPipe,
  HasUnsavedChanges,
  onBeforeUnload,
  scrollToFirstError,
} from '@portfolio/console/shared/util';
import { LIMITS } from '@portfolio/shared/validation';
import { TagService } from '../tag.service';

@Component({
  selector: 'console-tag-form-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    SectionCardComponent,
    SpinnerOverlayComponent,
    StickySaveBarComponent,
    FormErrorPipe,
  ],
  templateUrl: './tag-form-page.html',
  styleUrl: './tag-form-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TagFormPageComponent implements OnInit, HasUnsavedChanges {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly tagService = inject(TagService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly id = signal<string | null>(null);
  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly serverError = signal('');
  readonly dirty = signal(false);
  readonly isInvalid = signal(false);

  readonly isEditMode = computed(() => this.id() !== null);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(LIMITS.TAG_NAME_MAX)]],
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
      this.form.reset({ name: '' });
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
    const { name } = this.form.getRawValue();
    const editId = this.id();

    const onError = (err: HttpErrorResponse) => {
      this.submitting.set(false);
      const apiError = extractApiError(err);
      this.serverError.set(apiError?.message ?? 'Failed to save tag');
    };

    if (editId) {
      this.tagService.update(editId, { name }).subscribe({
        next: () => {
          this.dirty.set(false);
          this.toast.success('Tag updated');
          this.router.navigate(['/tags', editId]);
        },
        error: onError,
      });
    } else {
      this.tagService.create({ name }).subscribe({
        next: (res) => {
          this.dirty.set(false);
          this.toast.success('Tag created');
          this.router.navigate(['/tags', res.id]);
        },
        error: onError,
      });
    }
  }

  private load(id: string): void {
    this.loading.set(true);
    this.tagService.getById(id).subscribe({
      next: (tag) => {
        this.form.setValue({ name: tag.name });
        this.dirty.set(false);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Failed to load tag');
        this.loading.set(false);
        this.router.navigate(['/tags']);
      },
    });
  }
}
