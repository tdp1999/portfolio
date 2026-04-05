import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { extractApiError } from '@portfolio/console/shared/data-access';
import {
  TranslatableInputComponent,
  MediaPickerDialogComponent,
  type MediaPickerDialogData,
} from '@portfolio/console/shared/ui';
import { ProjectService } from '../project.service';
import {
  AdminProject,
  SkillOption,
  TranslatableJson,
  CreateProjectPayload,
  UpdateProjectPayload,
  HighlightPayload,
} from '../project.types';

export interface ProjectDialogData {
  project?: AdminProject;
  skills: SkillOption[];
}

const EMPTY_TRANSLATABLE: TranslatableJson = { en: '', vi: '' };

@Component({
  selector: 'console-project-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    MatCheckboxModule,
    MatDividerModule,
    MatTooltipModule,
    TranslatableInputComponent,
  ],
  templateUrl: './project-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ProjectDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<ProjectDialogComponent>);
  private readonly projectService = inject(ProjectService);
  private readonly matDialog = inject(MatDialog);
  private readonly fb = inject(FormBuilder);
  readonly data = inject<ProjectDialogData>(MAT_DIALOG_DATA, { optional: true });

  readonly isEdit = !!this.data?.project;
  readonly submitting = signal(false);
  readonly serverError = signal('');

  // Media state (not in form — managed separately)
  readonly thumbnailUrl = signal<string | null>(this.data?.project?.thumbnailUrl ?? null);
  readonly thumbnailId = signal<string | null>(this.data?.project?.thumbnailId ?? null);
  readonly galleryImages = signal<{ mediaId: string; url: string; altText: string | null }[]>(
    this.data?.project?.images?.map((img) => ({
      mediaId: img.mediaId,
      url: img.url,
      altText: img.altText,
    })) ?? []
  );

  readonly form = this.buildForm();

  get highlights(): FormArray {
    return this.form.controls.highlights;
  }

  private buildForm() {
    const p = this.data?.project;
    const form = this.fb.nonNullable.group({
      // Section 1: Basic Info
      title: [p?.title ?? '', Validators.required],
      oneLiner: [p?.oneLiner ?? { ...EMPTY_TRANSLATABLE }],
      startDate: [p?.startDate ? new Date(p.startDate) : (null as Date | null), Validators.required],
      endDate: [p?.endDate ? new Date(p.endDate) : (null as Date | null)],

      // Section 2: Story
      motivation: [p?.motivation ?? { ...EMPTY_TRANSLATABLE }],
      description: [p?.description ?? { ...EMPTY_TRANSLATABLE }],
      role: [p?.role ?? { ...EMPTY_TRANSLATABLE }],

      // Section 3: Highlights
      highlights: this.fb.array<FormGroup>([], { validators: Validators.maxLength(4) }),

      // Section 5: Details
      sourceUrl: [p?.sourceUrl ?? ''],
      projectUrl: [p?.projectUrl ?? ''],
      skillIds: [p?.skills?.map((s) => s.id) ?? ([] as string[])],

      // Section 6: Publishing
      status: [p?.status ?? ('DRAFT' as 'DRAFT' | 'PUBLISHED')],
      featured: [p?.featured ?? false],
      displayOrder: [p?.displayOrder ?? 0],
    });

    // Populate highlights FormArray
    if (p?.highlights?.length) {
      for (const h of p.highlights) {
        form.controls.highlights.push(this.createHighlightGroup(h));
      }
    }

    return form;
  }

  createHighlightGroup(data?: {
    challenge: TranslatableJson;
    approach: TranslatableJson;
    outcome: TranslatableJson;
    codeUrl: string | null;
  }): FormGroup {
    return this.fb.group({
      challenge: [data?.challenge ?? { ...EMPTY_TRANSLATABLE }],
      approach: [data?.approach ?? { ...EMPTY_TRANSLATABLE }],
      outcome: [data?.outcome ?? { ...EMPTY_TRANSLATABLE }],
      codeUrl: [data?.codeUrl ?? ''],
    });
  }

  addHighlight(): void {
    if (this.highlights.length < 4) {
      this.highlights.push(this.createHighlightGroup());
    }
  }

  removeHighlight(index: number): void {
    this.highlights.removeAt(index);
  }

  // --- Media Picker ---

  async pickThumbnail(): Promise<void> {
    const dialogRef = this.matDialog.open(MediaPickerDialogComponent, {
      width: '800px',
      maxHeight: '80vh',
      data: {
        mode: 'single',
        selectedIds: this.thumbnailId() ? [this.thumbnailId()!] : [],
        mimeFilter: 'image/',
      } satisfies MediaPickerDialogData,
    });
    dialogRef.afterClosed().subscribe((result: string | undefined) => {
      if (result) {
        this.thumbnailId.set(result);
        // We don't have the URL immediately — just show the ID was selected
        this.thumbnailUrl.set(null);
      }
    });
  }

  clearThumbnail(): void {
    this.thumbnailId.set(null);
    this.thumbnailUrl.set(null);
  }

  async pickGalleryImages(): Promise<void> {
    const dialogRef = this.matDialog.open(MediaPickerDialogComponent, {
      width: '800px',
      maxHeight: '80vh',
      data: {
        mode: 'multi',
        selectedIds: this.galleryImages().map((img) => img.mediaId),
        mimeFilter: 'image/',
      } satisfies MediaPickerDialogData,
    });
    dialogRef.afterClosed().subscribe((result: string[] | undefined) => {
      if (result) {
        const existing = this.galleryImages();
        const existingMap = new Map(existing.map((img) => [img.mediaId, img]));
        const updated = result.map((mediaId) => existingMap.get(mediaId) ?? { mediaId, url: '', altText: null });
        this.galleryImages.set(updated);
      }
    });
  }

  removeGalleryImage(index: number): void {
    const images = [...this.galleryImages()];
    images.splice(index, 1);
    this.galleryImages.set(images);
  }

  moveGalleryImage(index: number, direction: -1 | 1): void {
    const images = [...this.galleryImages()];
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    [images[index], images[target]] = [images[target], images[index]];
    this.galleryImages.set(images);
  }

  // --- Submit ---

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
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
      this.submitting.set(false);
      const apiError = extractApiError(err);
      this.serverError.set(apiError?.message ?? 'Failed to save project');
    };

    if (this.isEdit && this.data?.project) {
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
      this.projectService.update(this.data.project.id, payload).subscribe({
        next: () => this.dialogRef.close(true),
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
      this.projectService.create(payload).subscribe({
        next: () => this.dialogRef.close(true),
        error: onError,
      });
    }
  }
}
