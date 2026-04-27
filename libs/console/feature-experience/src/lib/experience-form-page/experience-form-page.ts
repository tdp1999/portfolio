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
import { forkJoin } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import {
  LongFormLayoutComponent,
  ScrollspyRailComponent,
  SectionCardComponent,
  SectionDescriptor,
  SpinnerOverlayComponent,
  StickySaveBarComponent,
  ToastService,
} from '@portfolio/console/shared/ui';
import { extractApiError, FormErrorPipe, HasUnsavedChanges, onBeforeUnload } from '@portfolio/console/shared/util';
import { EMPLOYMENT_TYPE_LABELS, LOCATION_TYPE_LABELS } from '@portfolio/shared/enum-labels';
import { AdminExperience, SkillOption } from '../experience.types';
import { ExperienceService } from '../experience.service';

type AchievementGroup = FormGroup<{ text: FormControl<string> }>;

@Component({
  selector: 'console-experience-form-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatChipsModule,
    MatAutocompleteModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    FormErrorPipe,
    LongFormLayoutComponent,
    ScrollspyRailComponent,
    SectionCardComponent,
    StickySaveBarComponent,
    SpinnerOverlayComponent,
  ],
  templateUrl: './experience-form-page.html',
  styleUrl: './experience-form-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ExperienceFormPageComponent implements OnInit, HasUnsavedChanges {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly experienceService = inject(ExperienceService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  private readonly experienceId = signal<string | null>(null);
  readonly isEdit = computed(() => this.experienceId() !== null);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly logoUploading = signal(false);
  readonly logoPreview = signal<string | null>(null);
  readonly serverError = signal('');

  readonly allSkills = signal<SkillOption[]>([]);
  readonly selectedSkills = signal<SkillOption[]>([]);
  readonly skillSearchControl = new FormControl('');
  readonly filteredSkills = signal<SkillOption[]>([]);

  readonly employmentTypeOptions = Object.entries(EMPLOYMENT_TYPE_LABELS).map(([value, label]) => ({ value, label }));
  readonly locationTypeOptions = Object.entries(LOCATION_TYPE_LABELS).map(([value, label]) => ({ value, label }));

  readonly form = this.fb.nonNullable.group({
    companyName: ['', [Validators.required, Validators.maxLength(200)]],
    companyUrl: [''],
    companyLogoId: [''],

    position_en: ['', [Validators.required]],
    position_vi: ['', [Validators.required]],
    description_en: [''],
    description_vi: [''],
    teamRole_en: [''],
    teamRole_vi: [''],

    employmentType: ['FULL_TIME', [Validators.required]],

    startDate: [null as Date | null, [Validators.required]],
    endDate: [null as Date | null],
    isCurrent: [true],

    locationType: ['ONSITE', [Validators.required]],
    locationCountry: [''],
    locationCity: [''],
    locationPostalCode: [''],
    locationAddress1: [''],
    locationAddress2: [''],

    clientName: [''],
    clientIndustry: [''],
    domain: [''],
    teamSize: [null as number | null],

    displayOrder: [0],

    achievements_en: this.fb.array<AchievementGroup>([]),
    achievements_vi: this.fb.array<AchievementGroup>([]),
  });

  readonly dirty = signal(false);
  readonly isInvalid = computed(() => this.form.invalid);
  private readonly initialSnapshot = signal<unknown>(null);

  readonly sections: SectionDescriptor[] = [
    { id: 'section-company', label: 'Company' },
    { id: 'section-role', label: 'Role' },
    { id: 'section-dates', label: 'Dates' },
    { id: 'section-location', label: 'Location' },
    { id: 'section-skills', label: 'Skills' },
    { id: 'section-achievements', label: 'Achievements' },
    { id: 'section-context', label: 'Context' },
    { id: 'section-display', label: 'Display' },
  ];

  ngOnInit(): void {
    this.setupCurrentPositionToggle();
    this.setupSkillSearch();
    this.form.events.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.dirty.set(this.form.dirty);
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.experienceId.set(id);
      this.loading.set(true);
      forkJoin({
        skills: this.experienceService.listAllSkills(),
        experience: this.experienceService.getById(id),
      })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: ({ skills, experience }) => {
            this.allSkills.set(skills);
            this.updateFilteredSkills('');
            this.hydrateForm(experience);
            this.loading.set(false);
          },
          error: () => {
            this.loading.set(false);
            this.toast.error('Failed to load experience');
            this.router.navigate(['/experiences']);
          },
        });
    } else {
      this.loadSkills();
      this.captureSnapshot();
    }
  }

  asFormGroup(control: AbstractControl): FormGroup {
    return control as FormGroup;
  }

  addAchievement(lang: 'en' | 'vi'): void {
    const arr = lang === 'en' ? this.form.controls.achievements_en : this.form.controls.achievements_vi;
    arr.push(this.createAchievementGroup());
    arr.markAsDirty();
  }

  removeAchievement(lang: 'en' | 'vi', index: number): void {
    const arr = lang === 'en' ? this.form.controls.achievements_en : this.form.controls.achievements_vi;
    arr.removeAt(index);
    arr.markAsDirty();
  }

  removeSkill(skill: SkillOption): void {
    this.selectedSkills.update((skills) => skills.filter((s) => s.id !== skill.id));
    this.form.markAsDirty();
    this.dirty.set(true);
    this.updateFilteredSkills(this.skillSearchControl.value ?? '');
  }

  onSkillSelected(event: MatAutocompleteSelectedEvent): void {
    const skill = event.option.value as SkillOption;
    if (!this.selectedSkills().find((s) => s.id === skill.id)) {
      this.selectedSkills.update((skills) => [...skills, skill]);
      this.form.markAsDirty();
      this.dirty.set(true);
    }
    this.skillSearchControl.setValue('');
    this.updateFilteredSkills('');
  }

  onLogoFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.logoUploading.set(true);
    this.experienceService
      .uploadMedia(file)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (id) => {
          this.logoUploading.set(false);
          this.form.controls.companyLogoId.setValue(id);
          this.form.controls.companyLogoId.markAsDirty();
          this.logoPreview.set(URL.createObjectURL(file));
        },
        error: () => {
          this.logoUploading.set(false);
          this.toast.error('Failed to upload logo');
        },
      });
  }

  clearLogo(): void {
    this.form.controls.companyLogoId.setValue('');
    this.form.controls.companyLogoId.markAsDirty();
    this.logoPreview.set(null);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.error('Please fix validation errors before saving');
      return;
    }

    this.saving.set(true);
    this.serverError.set('');

    const v = this.form.getRawValue();
    const isCurrent = v.isCurrent;

    const achievements = {
      en: (v.achievements_en as Array<{ text: string }>).map((a) => a.text).filter(Boolean),
      vi: (v.achievements_vi as Array<{ text: string }>).map((a) => a.text).filter(Boolean),
    };

    const basePayload = {
      companyName: v.companyName,
      companyUrl: v.companyUrl || undefined,
      position: { en: v.position_en, vi: v.position_vi },
      description:
        v.description_en || v.description_vi ? { en: v.description_en || '', vi: v.description_vi || '' } : undefined,
      achievements,
      teamRole: v.teamRole_en || v.teamRole_vi ? { en: v.teamRole_en || '', vi: v.teamRole_vi || '' } : undefined,
      employmentType: v.employmentType,
      locationType: v.locationType,
      locationCountry: v.locationCountry || undefined,
      locationCity: v.locationCity || undefined,
      locationPostalCode: v.locationPostalCode || undefined,
      locationAddress1: v.locationAddress1 || undefined,
      locationAddress2: v.locationAddress2 || undefined,
      clientName: v.clientName || undefined,
      clientIndustry: v.clientIndustry || undefined,
      domain: v.domain || undefined,
      teamSize: v.teamSize ?? undefined,
      startDate: v.startDate?.toISOString() ?? '',
      skillIds: this.selectedSkills().map((s) => s.id),
      displayOrder: v.displayOrder,
    };

    const onError = (err: HttpErrorResponse) => {
      this.saving.set(false);
      const apiError = extractApiError(err);
      const message = apiError?.message ?? 'Failed to save experience';
      this.serverError.set(message);
      this.toast.error(message);
    };

    const editId = this.experienceId();
    if (this.isEdit() && editId) {
      const updatePayload = {
        ...basePayload,
        companyLogoId: v.companyLogoId || null,
        endDate: isCurrent ? null : (v.endDate?.toISOString() ?? undefined),
      };
      this.experienceService
        .update(editId, updatePayload)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.saving.set(false);
            this.form.markAsPristine();
            this.dirty.set(false);
            this.toast.success('Experience updated successfully');
            this.router.navigate(['/experiences', editId]);
          },
          error: onError,
        });
    } else {
      const createPayload = {
        ...basePayload,
        companyLogoId: v.companyLogoId || undefined,
        endDate: isCurrent ? undefined : (v.endDate?.toISOString() ?? undefined),
      };
      this.experienceService
        .create(createPayload)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (res) => {
            this.saving.set(false);
            this.form.markAsPristine();
            this.dirty.set(false);
            this.toast.success('Experience created successfully');
            this.router.navigate(['/experiences', res.id]);
          },
          error: onError,
        });
    }
  }

  discard(): void {
    const snapshot = this.initialSnapshot();
    if (snapshot) {
      this.rebuildAchievements(
        (snapshot as { achievements_en?: Array<{ text: string }> }).achievements_en ?? [],
        (snapshot as { achievements_vi?: Array<{ text: string }> }).achievements_vi ?? []
      );
      this.form.reset(snapshot as never);
    } else {
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

  private captureSnapshot(): void {
    this.initialSnapshot.set(this.form.getRawValue());
  }

  private createAchievementGroup(text = ''): AchievementGroup {
    return this.fb.nonNullable.group({ text: [text] }) as AchievementGroup;
  }

  private rebuildAchievements(en: Array<{ text: string }>, vi: Array<{ text: string }>): void {
    this.form.controls.achievements_en.clear({ emitEvent: false });
    this.form.controls.achievements_vi.clear({ emitEvent: false });
    for (const a of en)
      this.form.controls.achievements_en.push(this.createAchievementGroup(a.text), { emitEvent: false });
    for (const a of vi)
      this.form.controls.achievements_vi.push(this.createAchievementGroup(a.text), { emitEvent: false });
  }

  private setupCurrentPositionToggle(): void {
    const isCurrentControl = this.form.controls.isCurrent;
    const endDateControl = this.form.controls.endDate;

    if (isCurrentControl.value) {
      endDateControl.disable({ emitEvent: false });
    }

    isCurrentControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((isCurrent) => {
      if (isCurrent) {
        endDateControl.disable();
        endDateControl.setValue(null);
      } else {
        endDateControl.enable();
      }
    });
  }

  private loadSkills(): void {
    this.experienceService
      .listAllSkills()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (all) => {
          this.allSkills.set(all);
          this.updateFilteredSkills('');
        },
      });
  }

  private hydrateForm(exp: AdminExperience): void {
    this.form.patchValue(
      {
        companyName: exp.companyName,
        companyUrl: exp.companyUrl ?? '',
        companyLogoId: exp.companyLogoId ?? '',
        position_en: exp.position?.en ?? '',
        position_vi: exp.position?.vi ?? '',
        description_en: exp.description?.en ?? '',
        description_vi: exp.description?.vi ?? '',
        teamRole_en: exp.teamRole?.en ?? '',
        teamRole_vi: exp.teamRole?.vi ?? '',
        employmentType: exp.employmentType,
        startDate: exp.startDate ? new Date(exp.startDate) : null,
        endDate: exp.endDate ? new Date(exp.endDate) : null,
        isCurrent: !exp.endDate,
        locationType: exp.locationType,
        locationCountry: exp.locationCountry ?? '',
        locationCity: exp.locationCity ?? '',
        locationPostalCode: exp.locationPostalCode ?? '',
        locationAddress1: exp.locationAddress1 ?? '',
        locationAddress2: exp.locationAddress2 ?? '',
        clientName: exp.clientName ?? '',
        clientIndustry: exp.clientIndustry ?? '',
        domain: exp.domain ?? '',
        teamSize: exp.teamSize,
        displayOrder: exp.displayOrder,
      },
      { emitEvent: false }
    );

    const en = (exp.achievements?.en ?? []).map((text) => ({ text }));
    const vi = (exp.achievements?.vi ?? []).map((text) => ({ text }));
    this.rebuildAchievements(en, vi);

    if (exp.companyLogoUrl) {
      this.logoPreview.set(exp.companyLogoUrl);
    }

    if (exp.skills?.length) {
      const bySkillId = new Map(this.allSkills().map((s) => [s.id, s]));
      const preselected = exp.skills.map((s) => bySkillId.get(s.id)).filter((s): s is SkillOption => !!s);
      this.selectedSkills.set(preselected);
      this.updateFilteredSkills('');
    }

    this.form.markAsPristine();
    this.dirty.set(false);
    this.captureSnapshot();
  }

  private setupSkillSearch(): void {
    this.skillSearchControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      this.updateFilteredSkills(value ?? '');
    });
  }

  private updateFilteredSkills(search: string): void {
    const selected = this.selectedSkills();
    const lowerSearch = (search ?? '').toLowerCase();
    this.filteredSkills.set(
      this.allSkills().filter(
        (s) => !selected.find((sel) => sel.id === s.id) && s.name.toLowerCase().includes(lowerSearch)
      )
    );
  }
}
