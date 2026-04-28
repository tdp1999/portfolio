import { HttpErrorResponse } from '@angular/common/http';
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
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MediaService } from '@portfolio/console/shared/data-access';
import {
  LongFormLayoutComponent,
  MediaPickerDialogComponent,
  MonthYearPickerComponent,
  ScrollspyRailComponent,
  SectionCardComponent,
  SectionDescriptor,
  SpinnerOverlayComponent,
  StickySaveBarComponent,
  ToastService,
  TranslatableGroupComponent,
  type MediaPickerDataSource,
  type MediaPickerDialogData,
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
import { ProjectService } from '../project.service';
import {
  AdminProject,
  CreateProjectPayload,
  HighlightPayload,
  SkillOption,
  TranslatableJson,
  UpdateProjectPayload,
} from '../project.types';

const EMPTY_TRANSLATABLE: TranslatableJson = { en: '', vi: '' };

function requiredTranslatableGroup(fb: FormBuilder, value: TranslatableJson = EMPTY_TRANSLATABLE): FormGroup {
  return fb.group({
    en: fb.control(value['en'] ?? '', { nonNullable: true, validators: [Validators.required] }),
    vi: fb.control(value['vi'] ?? '', { nonNullable: true, validators: [Validators.required] }),
  });
}

interface GalleryImage {
  mediaId: string;
  url: string;
  altText: string | null;
}

@Component({
  selector: 'console-project-form-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    MatCheckboxModule,
    MatDividerModule,
    MatTooltipModule,
    TranslatableGroupComponent,
    FormErrorPipe,
    LongFormLayoutComponent,
    MonthYearPickerComponent,
    ScrollspyRailComponent,
    SectionCardComponent,
    StickySaveBarComponent,
    SpinnerOverlayComponent,
  ],
  templateUrl: './project-form-page.html',
  styleUrl: './project-form-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ProjectFormPageComponent implements OnInit, HasUnsavedChanges {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly projectService = inject(ProjectService);
  private readonly matDialog = inject(MatDialog);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  private readonly mediaService = inject(MediaService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly mediaDataSource: MediaPickerDataSource = {
    list: (p) => this.mediaService.list(p),
    upload: (f, folder) => this.mediaService.upload(f, { folder }),
    getById: (id) => this.mediaService.getById(id),
    getByIdSilent: (id) => this.mediaService.getByIdSilent(id),
  };

  private readonly projectId = signal<string | null>(null);
  readonly isEdit = computed(() => this.projectId() !== null);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly serverError = signal('');

  readonly skills = signal<SkillOption[]>([]);

  readonly thumbnailUrl = signal<string | null>(null);
  readonly thumbnailId = signal<string | null>(null);
  readonly galleryImages = signal<GalleryImage[]>([]);

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(LIMITS.TITLE_MAX)]],
    oneLiner: requiredTranslatableGroup(this.fb),
    startDate: [null as Date | null, Validators.required],
    endDate: [null as Date | null],

    motivation: requiredTranslatableGroup(this.fb),
    description: requiredTranslatableGroup(this.fb),
    role: requiredTranslatableGroup(this.fb),

    highlights: this.fb.array<FormGroup>([], { validators: Validators.maxLength(LIMITS.PROJECT_HIGHLIGHTS_ARRAY_MAX) }),

    sourceUrl: ['', baselineFor.url()],
    projectUrl: ['', baselineFor.url()],
    skillIds: [[] as string[]],

    status: ['DRAFT' as 'DRAFT' | 'PUBLISHED'],
    featured: [false],
    displayOrder: [0, baselineFor.displayOrder()],
  });

  readonly dirty = signal(false);
  readonly isInvalid = computed(() => this.form.invalid);
  private readonly initialSnapshot = signal<unknown>(null);
  private loadedProject: AdminProject | null = null;

  readonly sections: SectionDescriptor[] = [
    { id: 'section-basic', label: 'Basic' },
    { id: 'section-story', label: 'Story' },
    { id: 'section-highlights', label: 'Highlights' },
    { id: 'section-media', label: 'Media' },
    { id: 'section-details', label: 'Details' },
    { id: 'section-settings', label: 'Settings' },
  ];

  ngOnInit(): void {
    this.projectService
      .listSkills()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (skills) => this.skills.set(skills) });

    this.form.events.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.dirty.set(this.form.dirty);
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.projectId.set(id);
      this.loadProject(id);
    } else {
      this.captureSnapshot();
    }
  }

  // --- Highlights ---

  createHighlightGroup(data?: {
    challenge: TranslatableJson;
    approach: TranslatableJson;
    outcome: TranslatableJson;
    codeUrl: string | null;
  }) {
    return this.fb.group({
      challenge: requiredTranslatableGroup(this.fb, data?.challenge ?? EMPTY_TRANSLATABLE),
      approach: requiredTranslatableGroup(this.fb, data?.approach ?? EMPTY_TRANSLATABLE),
      outcome: requiredTranslatableGroup(this.fb, data?.outcome ?? EMPTY_TRANSLATABLE),
      codeUrl: [data?.codeUrl ?? '', baselineFor.url()],
    });
  }

  addHighlight(): void {
    if (this.form.controls.highlights.length < 4) {
      this.form.controls.highlights.push(this.createHighlightGroup());
      this.form.controls.highlights.markAsDirty();
    }
  }

  removeHighlight(index: number): void {
    this.form.controls.highlights.removeAt(index);
    this.form.controls.highlights.markAsDirty();
  }

  // --- Media ---

  pickThumbnail(): void {
    const dialogRef = this.matDialog.open(MediaPickerDialogComponent, {
      width: '1280px',
      maxHeight: '80vh',
      data: {
        mode: 'single',
        selectedIds: this.thumbnailId() ? [this.thumbnailId() as string] : [],
        mimeFilter: 'image/',
        dataSource: this.mediaDataSource,
      } satisfies MediaPickerDialogData,
    });
    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result: string | undefined) => {
        if (result) {
          this.thumbnailId.set(result);
          this.thumbnailUrl.set(null);
          this.form.markAsDirty();
          this.dirty.set(true);
        }
      });
  }

  clearThumbnail(): void {
    this.thumbnailId.set(null);
    this.thumbnailUrl.set(null);
    this.form.markAsDirty();
    this.dirty.set(true);
  }

  pickGalleryImages(): void {
    const dialogRef = this.matDialog.open(MediaPickerDialogComponent, {
      width: '1200px',
      maxHeight: '80vh',
      data: {
        mode: 'multi',
        selectedIds: this.galleryImages().map((img) => img.mediaId),
        mimeFilter: 'image/',
        dataSource: this.mediaDataSource,
      } satisfies MediaPickerDialogData,
    });
    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result: string[] | undefined) => {
        if (result) {
          const existing = this.galleryImages();
          const existingMap = new Map(existing.map((img) => [img.mediaId, img]));
          const updated = result.map((mediaId) => existingMap.get(mediaId) ?? { mediaId, url: '', altText: null });
          this.galleryImages.set(updated);
          this.form.markAsDirty();
          this.dirty.set(true);
        }
      });
  }

  removeGalleryImage(index: number): void {
    const images = [...this.galleryImages()];
    images.splice(index, 1);
    this.galleryImages.set(images);
    this.form.markAsDirty();
    this.dirty.set(true);
  }

  moveGalleryImage(index: number, direction: -1 | 1): void {
    const images = [...this.galleryImages()];
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    [images[index], images[target]] = [images[target], images[index]];
    this.galleryImages.set(images);
    this.form.markAsDirty();
    this.dirty.set(true);
  }

  // --- Submit ---

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      scrollToFirstError();
      this.toast.error('Please fix validation errors before saving');
      return;
    }

    this.saving.set(true);
    this.serverError.set('');
    const raw = this.form.getRawValue();

    const highlights: HighlightPayload[] = raw.highlights.map((h: Record<string, unknown>) => ({
      challenge: h['challenge'] as TranslatableJson,
      approach: h['approach'] as TranslatableJson,
      outcome: h['outcome'] as TranslatableJson,
      codeUrl: (h['codeUrl'] as string) || null,
    }));

    const imageIds = this.galleryImages().map((img) => img.mediaId);

    const onError = (err: HttpErrorResponse) => {
      this.saving.set(false);
      const apiError = extractApiError(err);
      const message = apiError?.message ?? 'Failed to save project';
      this.serverError.set(message);
      this.toast.error(message);
    };

    const editId = this.projectId();
    if (this.isEdit() && editId) {
      const payload: UpdateProjectPayload = {
        title: raw.title,
        oneLiner: raw.oneLiner,
        description: raw.description,
        motivation: raw.motivation,
        role: raw.role,
        startDate: raw.startDate?.toISOString() ?? undefined,
        endDate: raw.endDate?.toISOString() ?? null,
        status: raw.status,
        sourceUrl: raw.sourceUrl || null,
        projectUrl: raw.projectUrl || null,
        thumbnailId: this.thumbnailId(),
        featured: raw.featured,
        displayOrder: raw.displayOrder,
        skillIds: raw.skillIds,
        imageIds,
        highlights,
      };
      this.projectService
        .update(editId, payload)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.saving.set(false);
            this.form.markAsPristine();
            this.dirty.set(false);
            this.toast.success('Project updated successfully');
            this.router.navigate(['/projects', editId]);
          },
          error: onError,
        });
    } else {
      const payload: CreateProjectPayload = {
        title: raw.title,
        oneLiner: raw.oneLiner,
        description: raw.description,
        motivation: raw.motivation,
        role: raw.role,
        startDate: raw.startDate?.toISOString() ?? '',
        endDate: raw.endDate?.toISOString() ?? null,
        sourceUrl: raw.sourceUrl || null,
        projectUrl: raw.projectUrl || null,
        thumbnailId: this.thumbnailId(),
        featured: raw.featured,
        displayOrder: raw.displayOrder,
        skillIds: raw.skillIds,
        imageIds,
        highlights,
      };
      this.projectService
        .create(payload)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (res) => {
            this.saving.set(false);
            this.form.markAsPristine();
            this.dirty.set(false);
            this.toast.success('Project created successfully');
            this.router.navigate(['/projects', res.id]);
          },
          error: onError,
        });
    }
  }

  discard(): void {
    if (this.loadedProject) {
      this.hydrateForm(this.loadedProject);
    } else {
      this.form.controls.highlights.clear();
      this.galleryImages.set([]);
      this.thumbnailId.set(null);
      this.thumbnailUrl.set(null);
      this.form.reset();
    }
    this.form.markAsPristine();
    this.dirty.set(false);
    this.serverError.set('');
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    onBeforeUnload(event, this.dirty());
  }

  hasUnsavedChanges() {
    return this.dirty;
  }

  // --- Hydration ---

  private captureSnapshot(): void {
    this.initialSnapshot.set(this.form.getRawValue());
  }

  private loadProject(id: string): void {
    this.loading.set(true);
    this.projectService
      .getById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (project) => {
          this.loadedProject = project;
          this.hydrateForm(project);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.toast.error('Failed to load project');
          this.router.navigate(['/projects']);
        },
      });
  }

  private hydrateForm(p: AdminProject): void {
    this.form.controls.highlights.clear({ emitEvent: false });
    if (p.highlights?.length) {
      for (const h of p.highlights) {
        this.form.controls.highlights.push(this.createHighlightGroup(h), { emitEvent: false });
      }
    }

    this.form.patchValue(
      {
        title: p.title,
        oneLiner: p.oneLiner ?? EMPTY_TRANSLATABLE,
        startDate: p.startDate ? new Date(p.startDate) : null,
        endDate: p.endDate ? new Date(p.endDate) : null,
        motivation: p.motivation ?? EMPTY_TRANSLATABLE,
        description: p.description ?? EMPTY_TRANSLATABLE,
        role: p.role ?? EMPTY_TRANSLATABLE,
        sourceUrl: p.sourceUrl ?? '',
        projectUrl: p.projectUrl ?? '',
        skillIds: p.skills?.map((s) => s.id) ?? [],
        status: p.status,
        featured: p.featured,
        displayOrder: p.displayOrder,
      },
      { emitEvent: false }
    );

    this.thumbnailId.set(p.thumbnailId ?? null);
    this.thumbnailUrl.set(p.thumbnailUrl ?? null);
    this.galleryImages.set(
      (p.images ?? []).map((img) => ({
        mediaId: img.mediaId,
        url: img.url,
        altText: img.altText,
      }))
    );

    this.form.markAsPristine();
    this.dirty.set(false);
    this.captureSnapshot();
  }
}
