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
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MediaService } from '@portfolio/console/shared/data-access';
import {
  LongFormLayoutComponent,
  MediaPickerDialogComponent,
  MediaPickerDataSource,
  MediaPickerDialogData,
  ScrollspyRailComponent,
  SectionCardComponent,
  SpinnerOverlayComponent,
  StickySaveBarComponent,
  ToastService,
} from '@portfolio/console/shared/ui';
import {
  baselineFor,
  FormErrorPipe,
  HasUnsavedChanges,
  onBeforeUnload,
  scrollToFirstError,
  ServerErrorDirective,
  type MediaItem,
} from '@portfolio/console/shared/util';
import { LIMITS } from '@portfolio/shared/validation';
import { forkJoin, of } from 'rxjs';
import { SkillService } from '../skill.service';
import { AdminSkill } from '../skill.types';

@Component({
  selector: 'console-skill-form-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTooltipModule,
    LongFormLayoutComponent,
    ScrollspyRailComponent,
    SectionCardComponent,
    SpinnerOverlayComponent,
    StickySaveBarComponent,
    FormErrorPipe,
    ServerErrorDirective,
  ],
  templateUrl: './skill-form-page.html',
  styleUrl: './skill-form-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SkillFormPageComponent implements OnInit, HasUnsavedChanges {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly skillService = inject(SkillService);
  private readonly mediaService = inject(MediaService);
  private readonly matDialog = inject(MatDialog);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly id = signal<string | null>(null);
  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly dirty = signal(false);
  readonly isInvalid = signal(false);

  readonly iconId = signal<string | null>(null);
  readonly iconPreviewUrl = signal<string | null>(null);

  readonly parentSkills = signal<AdminSkill[]>([]);
  readonly parentSkillsForSelect = computed(() => {
    const editId = this.id();
    return this.parentSkills().filter((s) => !s.parentSkillId && s.id !== editId);
  });

  readonly isEditMode = computed(() => this.id() !== null);

  readonly sections = [
    { id: 'section-identity', label: 'Identity' },
    { id: 'section-classification', label: 'Classification' },
    { id: 'section-experience', label: 'Experience' },
    { id: 'section-icon', label: 'Icon' },
    { id: 'section-settings', label: 'Settings' },
  ];

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(LIMITS.NAME_MAX)]],
    description: ['', baselineFor.longText(LIMITS.DESCRIPTION_LONG_MAX)],
    category: ['', [Validators.required]],
    parentSkillId: [null as string | null],
    isLibrary: [false],
    yearsOfExperience: [null as number | null, baselineFor.yearsOfExperience()],
    proficiencyNote: ['', baselineFor.longText(LIMITS.DESCRIPTION_SHORT_MAX)],
    isFeatured: [false],
    displayOrder: [0, baselineFor.displayOrder()],
  });

  private readonly mediaDataSource: MediaPickerDataSource = {
    list: (p) => this.mediaService.list(p),
    upload: (f, folder) => this.mediaService.upload(f, { folder }),
    getById: (id) => this.mediaService.getById(id),
    getByIdSilent: (id) => this.mediaService.getByIdSilent(id),
  };

  ngOnInit(): void {
    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.dirty.set(true);
      this.isInvalid.set(this.form.invalid);
    });
    this.form.statusChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.isInvalid.set(this.form.invalid);
    });

    const idParam = this.route.snapshot.paramMap.get('id');

    forkJoin({
      all: this.skillService.listAll(),
      skill: idParam ? this.skillService.getById(idParam) : of(null),
    }).subscribe({
      next: ({ all, skill }) => {
        this.parentSkills.set(all);
        if (skill) {
          this.id.set(skill.id);
          this.applySkill(skill);
        }
      },
      error: () => this.router.navigate(['/skills']),
    });
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    onBeforeUnload(event, this.dirty());
  }

  hasUnsavedChanges() {
    return this.dirty;
  }

  openIconPicker(): void {
    this.matDialog
      .open<MediaPickerDialogComponent, MediaPickerDialogData, MediaItem | undefined>(MediaPickerDialogComponent, {
        data: {
          mode: 'single',
          mimeFilter: 'image/svg+xml, image/png, image/webp',
          mimeGroup: 'image',
          defaultFolder: 'skills',
          selectedIds: this.iconId() ? [this.iconId()!] : [],
          dataSource: this.mediaDataSource,
        } satisfies MediaPickerDialogData,
        width: '900px',
      })
      .afterClosed()
      .subscribe((item) => {
        if (!item) return;
        this.iconId.set(item.id);
        this.iconPreviewUrl.set(item.url);
        this.dirty.set(true);
      });
  }

  clearIcon(): void {
    this.iconId.set(null);
    this.iconPreviewUrl.set(null);
    this.dirty.set(true);
  }

  discard(): void {
    const editId = this.id();
    if (editId) {
      this.skillService.getById(editId).subscribe({
        next: (skill) => this.applySkill(skill),
      });
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
    const editId = this.id();

    const onError = () => this.submitting.set(false);

    if (editId) {
      this.skillService
        .update(editId, {
          name: raw.name,
          category: raw.category,
          description: raw.description || null,
          parentSkillId: raw.parentSkillId || null,
          isLibrary: raw.isLibrary,
          isFeatured: raw.isFeatured,
          yearsOfExperience: raw.yearsOfExperience ?? null,
          displayOrder: raw.displayOrder,
          iconId: this.iconId(),
          proficiencyNote: raw.proficiencyNote || null,
        })
        .subscribe({
          next: () => {
            this.dirty.set(false);
            this.toast.success('Skill updated');
            this.router.navigate(['/skills', editId]);
          },
          error: onError,
        });
    } else {
      this.skillService
        .create({
          name: raw.name,
          category: raw.category,
          description: raw.description || undefined,
          parentSkillId: raw.parentSkillId || undefined,
          isLibrary: raw.isLibrary,
          isFeatured: raw.isFeatured,
          yearsOfExperience: raw.yearsOfExperience ?? undefined,
          displayOrder: raw.displayOrder,
          iconId: this.iconId() ?? undefined,
          proficiencyNote: raw.proficiencyNote || undefined,
        })
        .subscribe({
          next: (res) => {
            this.dirty.set(false);
            this.toast.success('Skill created');
            this.router.navigate(['/skills', res.id]);
          },
          error: onError,
        });
    }
  }

  private applySkill(skill: AdminSkill): void {
    this.form.setValue({
      name: skill.name,
      description: skill.description ?? '',
      category: skill.category,
      parentSkillId: skill.parentSkillId,
      isLibrary: skill.isLibrary,
      yearsOfExperience: skill.yearsOfExperience,
      proficiencyNote: skill.proficiencyNote ?? '',
      isFeatured: skill.isFeatured,
      displayOrder: skill.displayOrder,
    });
    this.iconId.set(skill.iconId);
    this.iconPreviewUrl.set(skill.iconUrl);
    this.dirty.set(false);
  }
}
