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
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import {
  LongFormLayoutComponent,
  MonthYearPickerComponent,
  ScrollspyRailComponent,
  SectionCardComponent,
  SectionDescriptor,
  SpinnerOverlayComponent,
  StickySaveBarComponent,
  ToastService,
  TranslatableGroupComponent,
} from '@portfolio/console/shared/ui';
import {
  baselineFor,
  extractApiError,
  FormErrorPipe,
  HasUnsavedChanges,
  onBeforeUnload,
  scrollToFirstError,
} from '@portfolio/console/shared/util';
import { EMPLOYMENT_TYPE_LABELS, LOCATION_TYPE_LABELS } from '@portfolio/shared/enum-labels';
import { LIMITS } from '@portfolio/shared/validation';
import { AdminExperience, SkillOption } from '../experience.types';
import { ExperienceService } from '../experience.service';

type BulletGroup = FormGroup<{ text: FormControl<string> }>;
type LinkGroup = FormGroup<{ label: FormControl<string>; url: FormControl<string> }>;

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
    MatChipsModule,
    MatAutocompleteModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    FormErrorPipe,
    LongFormLayoutComponent,
    MonthYearPickerComponent,
    ScrollspyRailComponent,
    SectionCardComponent,
    StickySaveBarComponent,
    SpinnerOverlayComponent,
    TranslatableGroupComponent,
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
    companyName: ['', [Validators.required, Validators.maxLength(LIMITS.TITLE_MAX)]],
    companyUrl: ['', baselineFor.url()],
    companyLogoId: [''],

    position: this.fb.nonNullable.group({
      en: ['', [Validators.required]],
      vi: ['', [Validators.required]],
    }),
    description: this.fb.nonNullable.group({
      en: [''],
      vi: [''],
    }),
    teamRole: this.fb.nonNullable.group({
      en: [''],
      vi: [''],
    }),

    employmentType: ['FULL_TIME', [Validators.required]],

    startDate: [null as Date | null, [Validators.required]],
    endDate: [null as Date | null],
    isCurrent: [true],

    locationType: ['ONSITE', [Validators.required]],
    locationCountry: ['', [Validators.maxLength(LIMITS.NAME_MAX)]],
    locationCity: ['', [Validators.maxLength(LIMITS.NAME_MAX)]],
    locationPostalCode: ['', baselineFor.postalCode()],
    locationAddress1: ['', baselineFor.address()],
    locationAddress2: ['', baselineFor.address()],

    clientName: ['', [Validators.maxLength(LIMITS.TITLE_MAX)]],
    domain: ['', [Validators.maxLength(LIMITS.NAME_MAX)]],
    teamSizeMin: [null as number | null, [...baselineFor.integer(LIMITS.TEAM_SIZE_MIN)]],
    teamSizeMax: [null as number | null, [...baselineFor.integer(LIMITS.TEAM_SIZE_MIN)]],

    displayOrder: [0, baselineFor.displayOrder()],

    responsibilities_en: this.fb.array<BulletGroup>([]),
    responsibilities_vi: this.fb.array<BulletGroup>([]),
    highlights_en: this.fb.array<BulletGroup>([]),
    highlights_vi: this.fb.array<BulletGroup>([]),

    links: this.fb.array<LinkGroup>([]),
  });

  readonly dirty = signal(false);
  readonly isInvalid = computed(() => this.form.invalid);
  private readonly initialSnapshot = signal<unknown>(null);

  /** Cross-field: teamSizeMin must be <= teamSizeMax when both are set. Mirrors BE refine. */
  private readonly teamSizeRangeValidator = (group: AbstractControl) => {
    const min = group.get('teamSizeMin')?.value as number | null;
    const max = group.get('teamSizeMax')?.value as number | null;
    if (min == null || max == null || min <= max) return null;
    return { teamSizeRange: true };
  };

  /** Cross-field: startDate must be before endDate when endDate is set. Mirrors BE refine. */
  private readonly dateRangeValidator = (group: AbstractControl) => {
    const start = group.get('startDate')?.value as Date | null;
    const end = group.get('endDate')?.value as Date | null;
    if (!start || !end || start < end) return null;
    return { dateRange: true };
  };

  readonly sections: SectionDescriptor[] = [
    { id: 'section-company', label: 'Company' },
    { id: 'section-role', label: 'Role' },
    { id: 'section-dates', label: 'Dates' },
    { id: 'section-location', label: 'Location' },
    { id: 'section-skills', label: 'Skills' },
    { id: 'section-responsibilities', label: 'Responsibilities' },
    { id: 'section-highlights', label: 'Highlights' },
    { id: 'section-links', label: 'Links' },
    { id: 'section-context', label: 'Context' },
    { id: 'section-settings', label: 'Admin' },
  ];

  ngOnInit(): void {
    this.form.addValidators(this.teamSizeRangeValidator);
    this.form.addValidators(this.dateRangeValidator);
    this.form.updateValueAndValidity({ emitEvent: false });
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

  addResponsibility(lang: 'en' | 'vi'): void {
    const arr = lang === 'en' ? this.form.controls.responsibilities_en : this.form.controls.responsibilities_vi;
    arr.push(this.createBulletGroup());
    arr.markAsDirty();
  }

  removeResponsibility(lang: 'en' | 'vi', index: number): void {
    const arr = lang === 'en' ? this.form.controls.responsibilities_en : this.form.controls.responsibilities_vi;
    arr.removeAt(index);
    arr.markAsDirty();
  }

  addHighlight(lang: 'en' | 'vi'): void {
    const arr = lang === 'en' ? this.form.controls.highlights_en : this.form.controls.highlights_vi;
    arr.push(this.createBulletGroup());
    arr.markAsDirty();
  }

  removeHighlight(lang: 'en' | 'vi', index: number): void {
    const arr = lang === 'en' ? this.form.controls.highlights_en : this.form.controls.highlights_vi;
    arr.removeAt(index);
    arr.markAsDirty();
  }

  addLink(): void {
    this.form.controls.links.push(this.createLinkGroup());
    this.form.controls.links.markAsDirty();
  }

  removeLink(index: number): void {
    this.form.controls.links.removeAt(index);
    this.form.controls.links.markAsDirty();
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
      scrollToFirstError();
      this.toast.error('Please fix validation errors before saving');
      return;
    }

    this.saving.set(true);
    this.serverError.set('');

    const v = this.form.getRawValue();
    const isCurrent = v.isCurrent;

    const responsibilities = {
      en: v.responsibilities_en.map((a) => a.text).filter(Boolean),
      vi: v.responsibilities_vi.map((a) => a.text).filter(Boolean),
    };
    const highlights = {
      en: v.highlights_en.map((a) => a.text).filter(Boolean),
      vi: v.highlights_vi.map((a) => a.text).filter(Boolean),
    };
    const links = v.links.filter((l) => l.label && l.url);

    const basePayload = {
      companyName: v.companyName,
      companyUrl: v.companyUrl || undefined,
      position: v.position,
      description: v.description.en || v.description.vi ? v.description : undefined,
      responsibilities,
      highlights,
      teamRole: v.teamRole.en || v.teamRole.vi ? v.teamRole : undefined,
      links,
      employmentType: v.employmentType,
      locationType: v.locationType,
      locationCountry: v.locationCountry || undefined,
      locationCity: v.locationCity || undefined,
      locationPostalCode: v.locationPostalCode || undefined,
      locationAddress1: v.locationAddress1 || undefined,
      locationAddress2: v.locationAddress2 || undefined,
      clientName: v.clientName || undefined,
      domain: v.domain || undefined,
      teamSizeMin: v.teamSizeMin ?? undefined,
      teamSizeMax: v.teamSizeMax ?? undefined,
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
    const snapshot = this.initialSnapshot() as {
      responsibilities_en?: Array<{ text: string }>;
      responsibilities_vi?: Array<{ text: string }>;
      highlights_en?: Array<{ text: string }>;
      highlights_vi?: Array<{ text: string }>;
      links?: Array<{ label: string; url: string }>;
    } | null;
    if (snapshot) {
      this.rebuildBullets(this.form.controls.responsibilities_en, snapshot.responsibilities_en ?? []);
      this.rebuildBullets(this.form.controls.responsibilities_vi, snapshot.responsibilities_vi ?? []);
      this.rebuildBullets(this.form.controls.highlights_en, snapshot.highlights_en ?? []);
      this.rebuildBullets(this.form.controls.highlights_vi, snapshot.highlights_vi ?? []);
      this.rebuildLinks(snapshot.links ?? []);
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

  private createBulletGroup(text = ''): BulletGroup {
    return this.fb.nonNullable.group({ text: [text] }) as BulletGroup;
  }

  private createLinkGroup(label = '', url = ''): LinkGroup {
    return this.fb.nonNullable.group({
      label: [label, [Validators.required, Validators.maxLength(LIMITS.NAME_MAX)]],
      url: [url, [Validators.required, ...baselineFor.url()]],
    }) as LinkGroup;
  }

  private rebuildBullets(arr: FormArray<BulletGroup>, items: Array<{ text: string }>): void {
    arr.clear({ emitEvent: false });
    for (const item of items) arr.push(this.createBulletGroup(item.text), { emitEvent: false });
  }

  private rebuildLinks(items: Array<{ label: string; url: string }>): void {
    this.form.controls.links.clear({ emitEvent: false });
    for (const item of items)
      this.form.controls.links.push(this.createLinkGroup(item.label, item.url), { emitEvent: false });
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
        position: { en: exp.position?.en ?? '', vi: exp.position?.vi ?? '' },
        description: { en: exp.description?.en ?? '', vi: exp.description?.vi ?? '' },
        teamRole: { en: exp.teamRole?.en ?? '', vi: exp.teamRole?.vi ?? '' },
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
        domain: exp.domain ?? '',
        teamSizeMin: exp.teamSizeMin,
        teamSizeMax: exp.teamSizeMax,
        displayOrder: exp.displayOrder,
      },
      { emitEvent: false }
    );

    this.rebuildBullets(
      this.form.controls.responsibilities_en,
      (exp.responsibilities?.en ?? []).map((text) => ({ text }))
    );
    this.rebuildBullets(
      this.form.controls.responsibilities_vi,
      (exp.responsibilities?.vi ?? []).map((text) => ({ text }))
    );
    this.rebuildBullets(
      this.form.controls.highlights_en,
      (exp.highlights?.en ?? []).map((text) => ({ text }))
    );
    this.rebuildBullets(
      this.form.controls.highlights_vi,
      (exp.highlights?.vi ?? []).map((text) => ({ text }))
    );
    this.rebuildLinks(exp.links ?? []);

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
